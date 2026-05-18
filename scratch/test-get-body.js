import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(str => str.trim().replace(/"/g, '')))
);

import { createClient } from '@supabase/supabase-js';
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWJ5Z3hwanpudG9nenBqbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyNzkzOSwiZXhwIjoyMDkyOTAzOTM5fQ.ke2FGR_2LlFLXziLRewOH3isT6xZGQ29AQQu-u5l9eI";

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  SERVICE_ROLE_KEY
);

async function run() {
  const { data: emails } = await supabase
    .from('emails')
    .select('id, account_id, zoho_message_id')
    .eq('subject', 'MRA Data')
    .limit(1);

  if (!emails || emails.length === 0) {
    console.error("No MRA Data email found!");
    return;
  }

  const email = emails[0];
  console.log("Email targeted:", email.id);

  const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/get-zoho-email-body`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      accountId: email.account_id,
      messageId: email.zoho_message_id,
      emailId: email.id
    })
  });

  const resData = await response.json();
  fs.writeFileSync('scratch/response.json', JSON.stringify(resData, null, 2));
  console.log("Successfully wrote response to scratch/response.json!");
}

run();
