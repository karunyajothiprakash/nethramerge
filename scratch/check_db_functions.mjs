import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

try {
  const { data, error } = await sb.rpc('exec_sql', {
    query: "SELECT proname FROM pg_proc WHERE proname = 'fn_attlog_to_attendance';"
  });
  console.log("data:", data, "error:", error);
} catch (e) {
  console.error("Exception:", e);
}
