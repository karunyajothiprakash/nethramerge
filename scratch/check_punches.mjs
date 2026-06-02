import mssql from 'mssql';

const pool = await mssql.connect({
  server: 'localhost',
  user: 'sa',
  password: 'essl@123',
  database: 'etimetracklite1',
  options: { encrypt: false, trustServerCertificate: true, instanceName: 'SQLEXPRESS' }
});

const today = new Date().toISOString().slice(0, 10); // e.g. "2026-06-02"

const r = await pool.request().query(`
  SELECT EmployeeCode, LogDateTime, Direction 
  FROM Attlogs 
  WHERE CAST(LogDateTime AS DATE) = '${today}' 
  ORDER BY EmployeeCode, LogDateTime
`);

console.log(`Total punches today: ${r.recordset.length}`);
for (const row of r.recordset) {
  const dt = new Date(row.LogDateTime);
  const time = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`  EmpCode: ${row.EmployeeCode}  |  ${time}  |  Direction: ${row.Direction}`);
}

await pool.close();
