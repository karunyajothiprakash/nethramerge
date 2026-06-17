const db = require('./db');
(async () => {
  try {
    const companyId = '00000000-0000-0000-0000-00000000ae01';
    console.log('Checking sidebar_counts query');
    const acqRes = await db.query("SELECT COUNT(*) as count FROM client_acquisition ca WHERE ca.is_deleted IS NOT TRUE");
    console.log('acqRes', acqRes.rows[0]);
    const acqRes2 = await db.query("SELECT COUNT(*) as count FROM client_acquisition ca JOIN leads l ON ca.lead_id = l.id WHERE ca.is_deleted IS NOT TRUE AND l.company_id = $1", [companyId]);
    console.log('acqRes2', acqRes2.rows[0]);
    const convRes = await db.query("SELECT COUNT(*) as count FROM leads WHERE is_deleted IS NOT TRUE AND stage IN ('Won', 'Client Successfully Acquired') AND company_id = $1", [companyId]);
    console.log('convRes', convRes.rows[0]);
    const custRes = await db.query("SELECT COUNT(*) as count FROM customers WHERE is_deleted IS NOT TRUE AND company_id = $1", [companyId]);
    console.log('custRes', custRes.rows[0]);
    console.log('Checking vehicles table');
    const vehicleCols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='vehicles' ORDER BY ordinal_position");
    console.log('vehicle cols', vehicleCols.rows.map(r => r.column_name));
    const vehicleCount = await db.query('SELECT COUNT(*) as count FROM vehicles');
    console.log('vehicle count', vehicleCount.rows[0]);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
