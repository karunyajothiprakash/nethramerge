import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const today = new Date().toISOString().slice(0, 10);

// 1. Check if trigger actually exists in Supabase
const { data: trigger } = await sb.rpc('exec_sql', {}).catch(() => null);
// Fallback: check via direct query
console.log('=== Checking trigger exists ===');
// Try to call pg_trigger via supabase — won't work directly, so we test by checking attendance_logs

// 2. Compare AttLogs vs attendance_logs for today
console.log('\n=== AttLogs for today ===');
const { data: logs } = await sb
  .from('AttLogs')
  .select('EmployeeCode, LogDateTime, Direction')
  .gte('LogDateTime', `${today}T00:00:00`)
  .order('LogDateTime', { ascending: false });
console.log(`Total punches in AttLogs today: ${logs?.length}`);
for (const l of logs || []) {
  console.log(`  [${l.EmployeeCode}] ${l.LogDateTime.slice(11,19)} → ${l.Direction}`);
}

// 3. attendance_logs for today
console.log('\n=== attendance_logs for today ===');
const { data: profiles } = await sb.from('profiles').select('id, biometric_id, full_name').not('biometric_id', 'is', null);
const profileMap = Object.fromEntries((profiles||[]).map(p => [p.id, p]));

const { data: att } = await sb
  .from('attendance_logs')
  .select('employee_id, clock_in, clock_out, status')
  .eq('date', today);

for (const a of att || []) {
  const p = profileMap[a.employee_id];
  const inTime  = a.clock_in  ? new Date(a.clock_in).toLocaleTimeString('en-IN')  : 'none';
  const outTime = a.clock_out ? new Date(a.clock_out).toLocaleTimeString('en-IN') : 'none';
  console.log(`  [${p?.biometric_id}] ${p?.full_name} → In: ${inTime} | Out: ${outTime}`);
}

// 4. Find gaps - who has AttLogs but no attendance_log or wrong clock_out
console.log('\n=== GAPS: AttLogs "out" punches NOT reflected in attendance_logs ===');
const profileByBio = Object.fromEntries((profiles||[]).map(p => [p.biometric_id, p]));
const attByEmpId   = Object.fromEntries((att||[]).map(a => [a.employee_id, a]));

for (const log of (logs||[]).filter(l => l.Direction === 'out')) {
  const profile = profileByBio[log.EmployeeCode];
  if (!profile) continue;
  const attRec = attByEmpId[profile.id];
  const logUtc = new Date(log.LogDateTime + '+05:30');
  if (!attRec?.clock_out || new Date(attRec.clock_out) < logUtc) {
    console.log(`  ❌ [${log.EmployeeCode}] ${profile.full_name}: AttLogs out=${log.LogDateTime.slice(11,19)} IST | attendance_logs out=${attRec?.clock_out ? new Date(attRec.clock_out).toLocaleTimeString('en-IN') : 'MISSING'}`);
  }
}
console.log('Done.');
