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
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
    `);
    console.log("PROFILES COLUMNS:");
    console.log(res.rows);
  } catch (err) {
    console.error("FAILED:", err.message);
  } finally {
    await pool.end();
  }
}
run();
