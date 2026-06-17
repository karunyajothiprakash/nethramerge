const db = require('./db');
(async () => {
  try {
    const tables = ['client_acquisition', 'leads', 'customers'];
    for (const table of tables) {
      const cols = await db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
        [table]
      );
      console.log(`\n${table} columns:`, cols.rows.map(r => r.column_name).join(', '));
    }
  } catch (err) {
    console.error('ERROR:', err);
  }
})();
