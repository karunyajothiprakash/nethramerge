import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEST_EMP_CODE = '1003'; // Jayasri S
const TEST_DATE = '2026-06-03'; // Use a future date to avoid messing up existing logs

console.log('--- Step 1: Clean up any existing test records for 2026-06-03 ---');
await sb.from('AttLogs').delete().eq('EmployeeCode', TEST_EMP_CODE).gte('LogDateTime', `${TEST_DATE}T00:00:00`);
const profilesRes = await sb.from('profiles').select('id').eq('biometric_id', TEST_EMP_CODE);
const profileId = profilesRes.data[0]?.id;
if (profileId) {
  await sb.from('attendance_logs').delete().eq('employee_id', profileId).eq('date', TEST_DATE);
}

console.log('--- Step 2: Insert IN punch at 08:00:00 ---');
const inRes = await sb.from('AttLogs').insert({
  EmployeeCode: TEST_EMP_CODE,
  LogDateTime: `${TEST_DATE}T08:00:00`,
  DownloadDateTime: new Date().toISOString(),
  Direction: 'in',
  DeviceId: 'TEST_DIR'
}).select().single();

console.log('Inserted IN:', inRes.data);

await new Promise(r => setTimeout(r, 1000));

console.log('--- Step 3: Check attendance_logs for IN punch ---');
let attRes = await sb.from('attendance_logs').select('*').eq('employee_id', profileId).eq('date', TEST_DATE).maybeSingle();
console.log('Attendance Log after IN:', attRes.data);

console.log('--- Step 4: Insert OUT punch at 17:00:00 ---');
const outRes = await sb.from('AttLogs').insert({
  EmployeeCode: TEST_EMP_CODE,
  LogDateTime: `${TEST_DATE}T17:00:00`,
  DownloadDateTime: new Date().toISOString(),
  Direction: 'out',
  DeviceId: 'TEST_DIR'
}).select().single();

console.log('Inserted OUT:', outRes.data);

await new Promise(r => setTimeout(r, 1000));

console.log('--- Step 5: Check attendance_logs for OUT punch ---');
attRes = await sb.from('attendance_logs').select('*').eq('employee_id', profileId).eq('date', TEST_DATE).maybeSingle();
console.log('Attendance Log after OUT:', attRes.data);

console.log('--- Step 6: Clean up ---');
if (inRes.data?.id) await sb.from('AttLogs').delete().eq('id', inRes.data.id);
if (outRes.data?.id) await sb.from('AttLogs').delete().eq('id', outRes.data.id);
if (profileId) await sb.from('attendance_logs').delete().eq('employee_id', profileId).eq('date', TEST_DATE);
console.log('Cleaned up successfully.');
