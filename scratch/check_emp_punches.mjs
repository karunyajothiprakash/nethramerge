import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('=== AttLogs for Employee 1003 today ===');
const { data: attlogs, error: err1 } = await sb
  .from('AttLogs')
  .select('*')
  .eq('EmployeeCode', '1003')
  .order('LogDateTime', { ascending: true });

if (err1) {
  console.error('AttLogs error:', err1);
} else {
  console.log(attlogs);
}

console.log('\n=== attendance_logs for Employee 1003 today ===');
// Jayasri S profile ID is '77c6a842-dca1-4765-851a-d5d066cb876d'
const { data: attendance, error: err2 } = await sb
  .from('attendance_logs')
  .select('*')
  .eq('employee_id', '77c6a842-dca1-4765-851a-d5d066cb876d')
  .eq('date', '2026-06-02');

if (err2) {
  console.error('attendance_logs error:', err2);
} else {
  console.log(attendance);
}
