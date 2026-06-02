import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Check AttLogs table columns exactly
const { data, error } = await sb.from('AttLogs').select('*').limit(1);
if (error) {
  console.log('AttLogs error:', error.message);
} else {
  console.log('AttLogs columns:', Object.keys(data[0] || {}));
  console.log('Sample row:', data[0]);
}

// Also check Attlogs (lowercase l)
const { data: d2, error: e2 } = await sb.from('Attlogs').select('*').limit(1);
if (e2) console.log('Attlogs (lowercase l) error:', e2.message);
else console.log('Attlogs (lowercase) sample:', d2?.[0]);
