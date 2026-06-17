const db = require('./db');
(async () => {
  try {
    const cols = await db.query("SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name='purchase_orders' ORDER BY ordinal_position");
    console.log('COLUMNS:', JSON.stringify(cols.rows, null, 2));
    const count = await db.query('SELECT COUNT(*) as count FROM purchase_orders');
    console.log('COUNT:', JSON.stringify(count.rows, null, 2));
    const sample = await db.query('SELECT id, po_number, company_id, farmer_id, status, order_date, total, currency, is_deleted, deleted_at, deleted_by, created_at FROM purchase_orders ORDER BY created_at DESC LIMIT 20');
    console.log('SAMPLE:', JSON.stringify(sample.rows, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
