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
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS corporate_subnets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        ip_cidr TEXT NOT NULL,
        label TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_deleted BOOLEAN DEFAULT false,
        deleted_at TIMESTAMPTZ
      );
    `);
    console.log(`✅ Created corporate_subnets`);
  } catch (err) {
    console.error("General error:", err);
  } finally {
    pool.end();
  }
}

run();
