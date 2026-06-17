const { Client } = require('pg');
const client = new Client('postgresql://erp_admin:Shastika2026@195.35.22.13:5432/shastika_erp');

client.connect().then(() => {
  return client.query("SELECT * FROM journal_entries");
}).then(res => {
  console.log(JSON.stringify(res.rows, null, 2));
}).catch(console.error).finally(() => client.end());
