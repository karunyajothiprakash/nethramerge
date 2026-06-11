import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT event_object_table, trigger_name, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table IN ('attendance_logs', 'AttLogs');
    `
  });
  if (error) {
    console.log("RPC failed:", error.message);
    // fallback check tables
    const { data: d2, error: e2 } = await supabase.from('attendance_logs').select('*').limit(1);
    console.log("attendance_logs columns:", d2 ? Object.keys(d2[0] || {}) : e2);
  } else {
    console.log("Triggers:", data);
  }
}
check();
