const db = require('../adms-sync/db');
db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'")
  .then(res => {
    console.log(res.rows.map(r => r.column_name));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
