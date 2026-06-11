const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db');

// GET /api/leads - Fetch all leads
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error("DB Error (get leads):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id - Fetch single lead
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("DB Error (get single lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads - Create lead
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    data.created_by = req.user.sub || req.user.id;

    // Fetch user's company_id from profiles if not provided
    if (!data.company_id && data.created_by) {
      const { rows: profileRows } = await db.query('SELECT company_id FROM profiles WHERE id = $1', [data.created_by]);
      if (profileRows.length > 0) {
        data.company_id = profileRows[0].company_id;
      }
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');

    const query = `INSERT INTO leads (${columns}) VALUES (${placeholders}) RETURNING *`;
    
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("DB Error (create lead):", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    if (Object.keys(updates).length === 0) return res.json({ success: true });

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    
    values.push(req.params.id);
    const query = `UPDATE leads SET ${setClause} WHERE id = $${values.length}`;
    
    await db.query(query, values);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (update lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/leads/:id - Delete lead (Soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('UPDATE leads SET is_deleted = true, deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (delete lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/meta/sources - Fetch acquisition channels
router.get('/meta/sources', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, channel_name FROM acquisition_channels ORDER BY channel_name');
    res.json(rows);
  } catch (err) {
    console.error("DB Error (get sources):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/convert - Convert lead to customer
router.post('/:id/convert', requireAuth, async (req, res) => {
  try {
    const { company_id, name, country, email } = req.body;

    await db.query('BEGIN');
    
    await db.query(
      'INSERT INTO customers (company_id, name, country, email) VALUES ($1, $2, $3, $4)',
      [company_id, name, country, email]
    );

    await db.query('UPDATE leads SET stage = $1 WHERE id = $2', ['Won', req.params.id]);

    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("DB Error (convert lead):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/follow-ups - Add follow up and update assignee
router.post('/:id/follow-ups', requireAuth, async (req, res) => {
  try {
    const { company_name, contact_name, follow_up_date, note, assigned_to } = req.body;

    await db.query('BEGIN');
    
    await db.query(
      `INSERT INTO follow_ups (lead_id, company_name, contact_name, follow_up_date, note, assigned_to, is_notified) 
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [req.params.id, company_name, contact_name, follow_up_date, note, assigned_to]
    );

    await db.query('UPDATE leads SET assigned_to = $1 WHERE id = $2', [assigned_to, req.params.id]);
    
    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("DB Error (add follow-up):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id/activities - Fetch lead activities
router.get('/:id/activities', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT a.*, p.full_name as "profiles.full_name" 
      FROM activities a 
      LEFT JOIN profiles p ON a.created_by = p.id 
      WHERE a.lead_id = $1 
      ORDER BY a.created_at DESC
    `, [req.params.id]);
    
    const formattedRows = rows.map(r => {
      const profiles = { full_name: r['profiles.full_name'] };
      delete r['profiles.full_name'];
      return { ...r, profiles };
    });

    res.json(formattedRows);
  } catch (err) {
    console.error("DB Error (get lead activities):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/leads/:id/quotations - Fetch lead quotations
router.get('/:id/quotations', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, quotation_number, status, created_at, amount, currency FROM quotations WHERE lead_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("DB Error (get lead quotations):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/leads/:id/activities - Add activity
router.post('/:id/activities', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    data.lead_id = req.params.id;
    data.created_by = req.user.sub || req.user.id;

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');

    const query = `INSERT INTO lead_activities (${columns}) VALUES (${placeholders}) RETURNING *`;
    
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("DB Error (create lead activity):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
