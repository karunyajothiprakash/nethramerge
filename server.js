import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let db = null
try {
  db = require('./adms-sync/db.js')
} catch (err) {
  console.warn('Could not load adms-sync/db.js, continuing with local pool if available')
}
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
let supabase = null
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
} else {
  console.warn('Supabase service role configuration missing. Auth and permissions mirror may be limited.')
}

const requireAuth = async (req, res, next) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase auth not configured' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    req.user = { sub: user.id, ...user }
    next()
  } catch (err) {
    console.error('Auth validation failed:', err)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

const app = express()
app.use(cors())
app.use(express.json())

// Resolve database connection string from env (flexible)
function getDatabaseUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const host = process.env.PG_HOST
  if (!host) return null
  const user = process.env.PG_USER || process.env.PGUSER || 'postgres'
  const password = process.env.PG_PASSWORD || process.env.PGPASSWORD || ''
  const database = process.env.PG_DATABASE || process.env.PG_DB || process.env.PGDATABASE || 'postgres'
  const port = process.env.PG_PORT || '5432'
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
}

const DB_URL = getDatabaseUrl()
let pool = null
if (DB_URL) {
  pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
} else {
  console.warn('No database URL found. /api/vehicles endpoints will return 500 until configured.')
}

// Ensure drivers table exists (use adms-sync db helper when available)
(async () => {
  const createSql = `CREATE TABLE IF NOT EXISTS drivers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_name text NOT NULL,
    license_number text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
  )`;
  try {
    if (db && db.query) {
      await db.query(createSql)
      console.log('Ensured drivers table exists (via adms-sync/db.js)')
    } else if (pool) {
      await pool.query(createSql)
      console.log('Ensured drivers table exists (via local pool)')
    } else {
      console.warn('No DB available to create drivers table')
    }
    // Ensure driver_name column exists and migrate from older 'name' column if present
    const ensureCols = `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_name text; ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number text;`;
    if (db && db.query) {
      await db.query(ensureCols)
      // If legacy 'name' column exists, copy values
      try {
        await db.query("UPDATE drivers SET driver_name = name WHERE driver_name IS NULL AND (SELECT to_regclass('public.drivers') IS NOT NULL)")
      } catch (e) {
        // best-effort migration; ignore errors
      }
    } else if (pool) {
      await pool.query(ensureCols)
      try {
        await pool.query("UPDATE drivers SET driver_name = name WHERE driver_name IS NULL")
      } catch (e) {}
    }
  } catch (err) {
    console.error('Failed to ensure drivers table exists:', err?.message || err)
  }
})()

// Vehicles API - uses direct Postgres queries to avoid Supabase schema cache issues
app.get('/api/vehicles', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database not configured' })
    const { rows } = await pool.query('SELECT id, vehicle_number, vehicle_type FROM vehicles WHERE is_active = true ORDER BY vehicle_number')
    res.json(rows)
  } catch (err) {
    console.error('GET /api/vehicles error:', err?.message || err)
    res.status(500).json({ error: 'Failed to fetch vehicles' })
  }
})

app.post('/api/vehicles', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database not configured' })
    const { vehicle_number, vehicle_type } = req.body
    if (!vehicle_number) return res.status(400).json({ error: 'vehicle_number is required' })

    const insertQuery = `INSERT INTO vehicles (vehicle_number, vehicle_type, is_active) VALUES ($1, $2, true) RETURNING id, vehicle_number, vehicle_type`
    const values = [vehicle_number, vehicle_type || null]
    const { rows } = await pool.query(insertQuery, values)
    res.json(rows[0])
  } catch (err) {
    console.error('POST /api/vehicles error:', err?.message || err)
    res.status(500).json({ error: 'Failed to create vehicle' })
  }
})

// Drivers API
app.get('/api/drivers', async (req, res) => {
  try {
    const executor = (db && db.query) ? db : pool
    if (!executor) return res.status(500).json({ error: 'Database not configured' })
    const { rows } = await executor.query("SELECT id, COALESCE(driver_name, name) AS driver_name, COALESCE(license_number, '') AS license_number FROM drivers WHERE is_active = true ORDER BY COALESCE(driver_name, name)")
    res.json(rows)
  } catch (err) {
    console.error('GET /api/drivers error:', err?.message || err)
    res.status(500).json({ error: 'Failed to fetch drivers' })
  }
})

app.post('/api/drivers', async (req, res) => {
  try {
    const executor = (db && db.query) ? db : pool
    if (!executor) return res.status(500).json({ error: 'Database not configured' })
    // Accept either `driver_name` or legacy `name` from frontend
    const driver_name = req.body.driver_name || req.body.name || req.body.driverName
    const license_number = req.body.license_number || req.body.licenseNumber || null
    if (!driver_name) return res.status(400).json({ error: 'driver_name is required' })

    const insertQuery = `INSERT INTO drivers (driver_name, license_number, is_active) VALUES ($1, $2, true) RETURNING id, driver_name, license_number`
    const values = [driver_name, license_number]
    const { rows } = await executor.query(insertQuery, values)
    res.json(rows[0])
  } catch (err) {
    console.error('POST /api/drivers error:', err?.message || err)
    res.status(500).json({ error: 'Failed to create driver' })
  }
})

app.get('/api/employees/all/profiles', requireAuth, async (req, res) => {
  try {
    const executor = (db && db.query) ? db : pool
    if (!executor) return res.status(500).json({ error: 'Database not configured' })
    const { rows } = await executor.query('SELECT * FROM profiles ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) {
    console.error('GET /api/employees/all/profiles error:', err?.message || err)
    res.status(500).json({ error: 'Failed to fetch profiles' })
  }
})

app.get('/api/user-permissions', requireAuth, async (req, res) => {
  try {
    const executor = (db && db.query) ? db : pool
    if (!executor) return res.status(500).json({ error: 'Database not configured' })

    const { rows: profiles } = await executor.query('SELECT id, full_name, email, role FROM profiles')
    const { rows: perms } = await executor.query('SELECT user_id, section, has_access FROM user_permissions')

    const mapped = profiles.map((p) => {
      const userPerms = perms
        .filter((up) => String(up.user_id) === String(p.id))
        .map((up) => ({
          section: up.section,
          has_access: up.has_access,
        }))
      return {
        ...p,
        permissions: userPerms,
      }
    })

    mapped.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    res.json(mapped)
  } catch (err) {
    console.error('GET /api/user-permissions error:', err?.message || err)
    res.status(500).json({ error: 'Failed to load permissions' })
  }
})

app.post('/api/user-permissions', requireAuth, async (req, res) => {
  try {
    const executor = (db && db.query) ? db : pool
    if (!executor) return res.status(500).json({ error: 'Database not configured' })

    const { user_id, section, has_access } = req.body
    if (!user_id || !section || typeof has_access !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid body parameters' })
    }

    const { rows: existing } = await executor.query(
      'SELECT id FROM user_permissions WHERE user_id = $1 AND section = $2',
      [user_id, section]
    )

    if (existing.length > 0) {
      await executor.query(
        'UPDATE user_permissions SET has_access = $1, updated_at = NOW() WHERE id = $2',
        [has_access, existing[0].id]
      )
    } else {
      await executor.query(
        'INSERT INTO user_permissions (user_id, section, has_access) VALUES ($1, $2, $3)',
        [user_id, section, has_access]
      )
    }

    if (supabase) {
      try {
        const upsertPayload = { user_id, section, has_access, granted_by: req.user?.sub || null }
        const { error: supaErr } = await supabase
          .from('user_permissions')
          .upsert(upsertPayload, { onConflict: 'user_id,section' })
        if (supaErr) console.warn('Supabase upsert warning:', supaErr.message)
      } catch (sErr) {
        console.warn('Failed to mirror permission to Supabase:', sErr.message || sErr)
      }
    }

    res.json({ success: true })
  } catch (err) {
    console.error('POST /api/user-permissions error:', err?.message || err)
    res.status(500).json({ error: 'Failed to save permission' })
  }
})

app.post('/api/ai-chat', async (req, res) => {
  try {
    const { messages, system } = req.body
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: system || 'You are a helpful ERP assistant.',
        messages: messages
      })
    })

    const data = await response.json()
    console.log('Claude response:', JSON.stringify(data))
    res.json({ content: data.content[0].text })

  } catch (err) {
    console.error('Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => console.log('✅ Server running on port 3001'))