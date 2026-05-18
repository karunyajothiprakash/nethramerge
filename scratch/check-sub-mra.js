import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(str => str.trim().replace(/"/g, '')))
);

const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWJ5Z3hwanpudG9nenBqbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyNzkzOSwiZXhwIjoyMDkyOTAzOTM5fQ.ke2FGR_2LlFLXziLRewOH3isT6xZGQ29AQQu-u5l9eI";

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('emails')
    .select('id, subject, body_text, body_html, attachments, zoho_message_id')
    .ilike('body_text', '%Uma.K%');

  console.log("Error:", error);
  console.log("Found emails count:", data ? data.length : 0);
  if (data && data.length > 0) {
    data.forEach((email, i) => {
      console.log(`${i}. ID: ${email.id}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Body text: ${email.body_text}`);
      console.log(`   Attachments:`, JSON.stringify(email.attachments));
      console.log(`   Zoho ID: ${email.zoho_message_id}`);
      console.log("-----------------------------------------");
    });
  }
}

run();
