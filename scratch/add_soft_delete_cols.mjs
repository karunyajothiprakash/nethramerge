import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'erp_admin',
  host: '195.35.22.13',
  database: 'shastika_erp',
  password: 'Shastika2026',
  port: 5432,
});

async function run() {
  const tables = [
    'leads',
    'crm_tasks',
    'emails',
    'zoho_accounts',
    'corporate_subnets',
    'audit_logs'
  ];

  try {
    for (const table of tables) {
      console.log(`Checking table ${table}...`);
      try {
        await pool.query(`
          ALTER TABLE ${table} 
          ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
        `);
        console.log(`✅ Added is_deleted/deleted_at to ${table} (if it didn't exist)`);
      } catch (err) {
        if (err.message.includes('does not exist')) {
            console.log(`⚠️ Table ${table} does not exist, skipping.`);
        } else {
            console.error(`❌ Error updating ${table}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("General error:", err);
  } finally {
    pool.end();
  }
}

run();
