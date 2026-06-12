import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sxebygxpjzntogzpjnga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWJ5Z3hwanpudG9nenBqbmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjc5MzksImV4cCI6MjA5MjkwMzkzOX0.rtClmtuPuNicVQvBkITzY6PfFsh8yOYq3ykWoL9Ab_4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data: cols, error: colError } = await supabase
    .from('shipment_dispatches')
    .select('*')
    .limit(1);
    
  if (colError) console.error("shipment_dispatches error", colError);
  else console.log("shipment_dispatches exists", cols);

  const { data: v, error: vErr } = await supabase.from('vehicles').select('*').limit(1);
  if (vErr) console.error(vErr);
  else console.log("vehicles exists", v);

  const { data: d, error: dErr } = await supabase.from('drivers').select('*').limit(1);
  if (dErr) console.error(dErr);
  else console.log("drivers exists", d);
}
main();
