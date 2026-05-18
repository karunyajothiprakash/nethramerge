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
  const { data: emails } = await supabase
    .from('emails')
    .select('id, account_id, zoho_message_id, subject')
    .eq('subject', 'MRA Data')
    .limit(1);

  const email = emails[0];
  console.log("Using Email ID:", email.id);
  console.log("Using Zoho Message ID:", email.zoho_message_id);

  // 1. Get account from DB
  const { data: account } = await supabase
    .from("zoho_accounts")
    .select("*")
    .eq("id", email.account_id)
    .single();

  const apiDomain = account.account_email?.endsWith('.com') ? 'zoho.com' : 'zoho.in';
  console.log("API Domain:", apiDomain);

  // 2. Refresh token logic
  let accessToken = account.access_token;
  const now = new Date();
  const expiry = new Date(account.expiry_time);

  if (now.getTime() > expiry.getTime() - 300000) {
    console.log("Refreshing Zoho access token...");
    const refreshResponse = await fetch(`https://accounts.${apiDomain}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: account.refresh_token,
        client_id: env.VITE_ZOHO_CLIENT_ID || '',
        client_secret: process.env.ZOHO_CLIENT_SECRET || 'gqFvPjV-8v9nF_B7_P-vX3_D4uA7D-H', // fallback or fetch from env/database
        grant_type: "refresh_token",
      }),
    });
    const refreshData = await refreshResponse.json();
    if (refreshData.access_token) {
      accessToken = refreshData.access_token;
      console.log("Token refreshed successfully!");
    }
  }

  // 3. Get Account ID
  const accountsResponse = await fetch(`https://mail.${apiDomain}/api/accounts`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  const accountsData = await accountsResponse.json();
  const verifiedZohoId = accountsData.data?.[0]?.accountId;
  console.log("Verified Zoho Account ID:", verifiedZohoId);

  // 4. Get Folders
  const foldersResponse = await fetch(`https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  const foldersData = await foldersResponse.json();
  const inboxFolder = (foldersData.data || []).find((f) => f.folderName.toLowerCase() === 'inbox');
  console.log("Inbox Folder ID:", inboxFolder?.folderId);

  // 5. Let's call attachmentinfo API!
  const attachmentInfoUrl = `https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders/${inboxFolder.folderId}/messages/${email.zoho_message_id}/attachmentinfo`;
  console.log("Requesting attachment info from:", attachmentInfoUrl);

  const attachmentInfoResponse = await fetch(attachmentInfoUrl, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  const attachmentInfoData = await attachmentInfoResponse.json();
  console.log("Attachment Info Response:", JSON.stringify(attachmentInfoData, null, 2));

  // Let's also fetch the message details to see if hasAttachment is '1' or '0'!
  const detailUrl = `https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders/${inboxFolder.folderId}/messages/${email.zoho_message_id}`;
  const detailResponse = await fetch(detailUrl, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  const detailData = await detailResponse.json();
  console.log("Message Details:", JSON.stringify(detailData, null, 2));
}

run();
