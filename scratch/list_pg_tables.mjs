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
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log("TABLES:");
    console.log(res.rows.map(r => r.table_name));
  } catch (err) {
    console.error("FAILED:", err.message);
  } finally {
    await pool.end();
  }
}
run();
