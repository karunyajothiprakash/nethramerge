const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://erp_admin:Shastika2026@195.35.22.13:5432/shastika_erp'
});

async function run() {
  await client.connect();
  
  await client.query(`
    ALTER TABLE payments 
    ADD COLUMN IF NOT EXISTS payment_number text,
    ADD COLUMN IF NOT EXISTS payer_name text,
    ADD COLUMN IF NOT EXISTS reference_number text,
    ADD COLUMN IF NOT EXISTS created_by uuid,
    ADD COLUMN IF NOT EXISTS notes text;
  `);
  console.log("Columns added successfully");
  await client.end();
}

run().catch(console.error);
