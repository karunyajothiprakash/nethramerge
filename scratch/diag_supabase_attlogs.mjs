import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Check what's in AttLogs table today
const { data: attLogs, error: attErr } = await supabase
  .from('AttLogs')
  .select('*')
  .gte('LogDateTime', new Date().toISOString().slice(0, 10))
  .order('LogDateTime', { ascending: false })
  .limit(10);

if (attErr) {
  console.log('AttLogs error:', attErr.message);
} else {
  console.log(`=== AttLogs today (${attLogs.length} rows) ===`);
  if (attLogs.length > 0) {
    console.log('Columns:', Object.keys(attLogs[0]));
    for (const r of attLogs) console.log(r);
  }
}

// 2. Check attendance_logs for today
const { data: attLogsERP, error: erpErr } = await supabase
  .from('attendance_logs')
  .select('id, employee_id, date, clock_in, clock_out, status')
  .eq('date', new Date().toISOString().slice(0, 10));

if (erpErr) {
  console.log('attendance_logs error:', erpErr.message);
} else {
  console.log(`\n=== attendance_logs today (${attLogsERP.length} rows) ===`);
  for (const r of attLogsERP) console.log(r);
}

// 3. Check profiles with biometric_id
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, biometric_id, company_id')
  .not('biometric_id', 'is', null);

console.log(`\n=== Profiles with biometric_id (${profiles?.length}) ===`);
for (const p of profiles || []) console.log(p);
