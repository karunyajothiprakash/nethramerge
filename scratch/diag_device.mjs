import mssql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const pool = await mssql.connect({
  server: 'localhost', user: 'sa', password: 'essl@123',
  database: 'etimetracklite1',
  options: { encrypt: false, trustServerCertificate: true, instanceName: 'SQLEXPRESS' }
});

// 1. What columns does DeviceLogs_6_2026 actually have?
console.log('=== DeviceLogs_6_2026 columns & data ===');
const dl6 = await pool.request().query('SELECT TOP 3 * FROM DeviceLogs_6_2026');
if (dl6.recordset.length) {
  console.log('Columns:', Object.keys(dl6.recordset[0]));
  for (const r of dl6.recordset) console.log(r);
} else {
  console.log('TABLE IS EMPTY - No device logs received for June 2026!');
}

// 2. What's in the actual Devices table for the real device?
console.log('\n=== All Devices (IpAddress, LastLogDownloadDate) ===');
const devs = await pool.request().query('SELECT DeviceId, DeviceFName, IpAddress, LastLogDownloadDate FROM Devices WHERE IpAddress != \'\'');
for (const r of devs.recordset) console.log(r);

// 3. Check DevicesStatus - latest status for device
console.log('\n=== DevicesStatus - all entries (latest 10) ===');
const dstat = await pool.request().query('SELECT TOP 10 * FROM DevicesStatus ORDER BY LastDeviceStatusOn DESC');
for (const r of dstat.recordset) console.log(r);

await pool.close();
