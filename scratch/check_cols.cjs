const { Client } = require('pg');
const client = new Client('postgresql://erp_admin:Shastika2026@195.35.22.13:5432/shastika_erp');

client.connect().then(() => {
  return client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'purchase_orders'");
}).then(res => {
  console.log(res.rows.map(r=>r.column_name).join(','));
}).catch(console.error).finally(() => client.end());
