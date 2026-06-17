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
    const profiles = await pool.query(`
      SELECT id, email, full_name, company_id
      FROM public.profiles
    `);
    console.log("PROFILES:");
    console.log(profiles.rows);

    const companies = await pool.query(`
      SELECT id, name
      FROM public.companies
    `);
    console.log("COMPANIES:");
    console.log(companies.rows);

    const productCompanies = await pool.query(`
      SELECT DISTINCT company_id
      FROM public.products
    `);
    console.log("PRODUCT COMPANIES:");
    console.log(productCompanies.rows);

  } catch (err) {
    console.error("FAILED:", err.message);
  } finally {
    await pool.end();
  }
}
run();
