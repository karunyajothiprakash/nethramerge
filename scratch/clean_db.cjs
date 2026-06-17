const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://erp_admin:Shastika2026@195.35.22.13:5432/shastika_erp'
});

async function run() {
  await client.connect();
  
  try {
    // Ensure is_deleted and deleted_at exist
    console.log("Altering tables...");
    await client.query(`
      ALTER TABLE farmers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
      ALTER TABLE farmers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      
      ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
      ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    `);
    
    console.log("Deleting dummy export orders...");
    // Delete dummy export orders
    const deleteOrders = await client.query(`
      DELETE FROM export_orders WHERE id IN ('159c447b-ac1b-46e0-8975-f3649fe7293a', 'f3f01e0e-2990-458d-bb3d-3778e3d955b5')
    `);
    console.log(`Deleted ${deleteOrders.rowCount} dummy export orders.`);
    
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

run();
