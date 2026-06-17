const { Client } = require('pg');
const client = new Client('postgresql://erp_admin:Shastika2026@195.35.22.13:5432/shastika_erp');

const tables = ['inventory_batches', 'export_shipments', 'products', 'warehouses'];

client.connect().then(async () => {
  for (const table of tables) {
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
    console.log(`Table ${table}:`, res.rows.map(r => r.column_name).join(', '));
  }
}).catch(console.error).finally(() => client.end());
