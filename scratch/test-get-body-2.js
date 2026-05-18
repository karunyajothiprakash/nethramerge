import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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
  // 1. Reset the cached body and attachments for 'MRA Data' emails
  const { error: updateError } = await supabase
    .from('emails')
    .update({ body_html: null, attachments: null })
    .eq('subject', 'MRA Data');
  
  if (updateError) {
    console.error("Failed to reset:", updateError);
    return;
  }
  console.log("Successfully reset cached body and attachments for MRA Data emails.");

  // 2. Fetch the email again to get the ID
  const { data: emails } = await supabase
    .from('emails')
    .select('id, account_id, zoho_message_id')
    .eq('subject', 'MRA Data')
    .limit(1);

  if (!emails || emails.length === 0) return;
  const email = emails[0];
  console.log("Re-fetching for Email ID:", email.id);

  // 3. Call the updated Edge Function
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
  console.log("Edge Function Response:", JSON.stringify(resData, null, 2));

  // 4. Verify in DB
  const { data: updatedEmail } = await supabase
    .from('emails')
    .select('attachments')
    .eq('id', email.id)
    .single();

  console.log("Final Attachments in DB:", JSON.stringify(updatedEmail?.attachments, null, 2));
}

run();
