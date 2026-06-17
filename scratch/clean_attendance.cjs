const { Client } = require('pg');
const client = new Client('postgresql://erp_admin:Shastika2026@195.35.22.13:5432/shastika_erp');

client.connect().then(() => {
  return client.query("DELETE FROM attendance_logs WHERE date = CURRENT_DATE");
}).then(res => {
  console.log(`Deleted ${res.rowCount} dummy attendance logs.`);
}).catch(console.error).finally(() => client.end());
