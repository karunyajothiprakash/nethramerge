const db = require('../db');

async function run(){
  try{
    const { rows: comps } = await db.query('SELECT id FROM companies LIMIT 1');
    if (!comps || comps.length === 0) {
      console.error('No companies present to associate test farmer with');
      process.exit(1);
    }
    const companyId = comps[0].id;
    const pc = ['Turmeric','Cardamom'];
    const vals = [companyId, 'TST001','Test Farmer', '9999999999','test@example.com','TestVillage','TestDistrict','TestState','India', pc, '123456','notes', true];
    const { rows } = await db.query(`INSERT INTO farmers (company_id, code, full_name, phone, email, village, district, state, country, primary_crops, bank_account, notes, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, NOW()) RETURNING *`, vals);
    console.log('Inserted:', rows[0]);
  }catch(err){
    console.error('Insert failed', err);
  }finally{
    process.exit();
  }
}

run();
