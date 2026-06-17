const db = require('./db');
(async () => {
  try {
    const tables = ['client_acquisition', 'leads', 'customers', 'vehicles'];
    for (const table of tables) {
      const exists = await db.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) AS exists", [table]);
      console.log(table, exists.rows[0].exists);
      if (exists.rows[0].exists) {
        const count = await db.query(`SELECT COUNT(*) as cnt FROM ${table}`);
        console.log(table, 'count=', count.rows[0].cnt);
      }
    }
  } catch (err) {
    console.error('ERROR:', err);
  }
})();
