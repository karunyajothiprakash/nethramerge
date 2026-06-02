/**
 * Live trigger test:
 * 1. Insert a fake punch into AttLogs
 * 2. Immediately check if attendance_logs was updated by the trigger
 * 3. Clean up the test row
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Use a real biometric_id that exists (1003 = Gayathri)
const TEST_EMP_CODE = '1003';
const TEST_DATE     = new Date().toISOString().slice(0, 10); // today
// Use a test time 1 minute in the future to avoid collision
const TEST_TIME     = new Date(Date.now() + 60000).toISOString().slice(11, 19); // HH:mm:ss
const TEST_DATETIME = `${TEST_DATE}T${TEST_TIME}`; // IST local time, no tz

console.log(`\n🧪 Live Trigger Test`);
console.log(`   Employee:  ${TEST_EMP_CODE}`);
console.log(`   Test time: ${TEST_DATETIME} (IST)\n`);

// ── Step 1: Snapshot current attendance_logs for this employee ──
const { data: before } = await sb
  .from('attendance_logs')
  .select('id, clock_in, clock_out, status')
  .eq('date', TEST_DATE)
  .in('employee_id', (await sb.from('profiles').select('id').eq('biometric_id', TEST_EMP_CODE)).data.map(p => p.id))
  .maybeSingle();

console.log('📸 Before insert:', before ?? '(no record yet)');

// ── Step 2: Insert test punch into AttLogs ──
const { data: inserted, error: insertErr } = await sb
  .from('AttLogs')
  .insert({
    EmployeeCode:     TEST_EMP_CODE,
    LogDateTime:      TEST_DATETIME,
    DownloadDateTime: new Date().toISOString(),
    Direction:        'in',
    DeviceId:         'TRIGGER_TEST'
  })
  .select()
  .single();

if (insertErr) {
  console.error('❌ Insert into AttLogs failed:', insertErr.message);
  process.exit(1);
}
console.log('✅ Inserted into AttLogs → id:', inserted.id);

// ── Step 3: Check attendance_logs immediately (trigger should have fired) ──
await new Promise(r => setTimeout(r, 500)); // 500ms wait

const { data: after } = await sb
  .from('attendance_logs')
  .select('id, clock_in, clock_out, status')
  .eq('date', TEST_DATE)
  .in('employee_id', (await sb.from('profiles').select('id').eq('biometric_id', TEST_EMP_CODE)).data.map(p => p.id))
  .maybeSingle();

console.log('\n📸 After insert:', after);

if (after && after.clock_in) {
  console.log('\n🟢 TRIGGER IS LIVE! attendance_logs updated instantly.');
} else {
  console.log('\n🔴 TRIGGER NOT RUNNING. attendance_logs was NOT updated.');
  console.log('   → Go to Supabase SQL Editor and run the migration file.');
}

// ── Step 4: Clean up test row from AttLogs ──
await sb.from('AttLogs').delete().eq('id', inserted.id);
console.log('\n🧹 Test row cleaned up from AttLogs.');
