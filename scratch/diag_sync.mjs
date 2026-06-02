import mssql from 'mssql';

const pool = await mssql.connect({
  server: 'localhost', user: 'sa', password: 'essl@123',
  database: 'etimetracklite1',
  options: { encrypt: false, trustServerCertificate: true, instanceName: 'SQLEXPRESS' }
});

// 1. Latest 5 punches in DB
const r1 = await pool.request().query('SELECT TOP 5 EmployeeCode, LogDateTime, Direction FROM Attlogs ORDER BY LogDateTime DESC');
console.log('=== Latest 5 punches in DB ===');
for (const row of r1.recordset) console.log(row);

// 2. SQL Server current time
const r2 = await pool.request().query('SELECT CAST(GETDATE() AS VARCHAR) as sqlnow');
console.log('\n=== SQL Server current time ===', r2.recordset[0].sqlnow);

// 3. Count punches for today by SQL GETDATE()
const r3 = await pool.request().query('SELECT COUNT(*) as cnt FROM Attlogs WHERE CAST(LogDateTime AS DATE) = CAST(GETDATE() AS DATE)');
console.log('=== Punches for today (SQL GETDATE()) ===', r3.recordset[0].cnt);

// 4. What the sync "sinceDate" filter returns
const sinceDate = new Date('2026-06-01T04:10:46.000Z');
console.log('\n=== sinceDate used by sync (UTC) ===', sinceDate.toISOString());
console.log('=== sinceDate as local ===', sinceDate.toLocaleString('en-IN'));
const r4 = await pool.request()
  .input('sinceDate', mssql.DateTime2, sinceDate)
  .query('SELECT COUNT(*) as cnt FROM Attlogs WHERE LogDateTime >= @sinceDate');
console.log('=== Punches found since last sync ===', r4.recordset[0].cnt);

// 5. Node.js timezone info
console.log('\n=== Node.js timezone offset (mins) ===', new Date().getTimezoneOffset());
console.log('=== Node.js "now" UTC ===', new Date().toISOString());
console.log('=== Node.js "now" local ===', new Date().toLocaleString('en-IN'));

await pool.close();
