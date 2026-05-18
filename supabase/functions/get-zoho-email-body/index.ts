import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const { accountId, messageId, emailId, folderName } = await req.json();

    if (!accountId || !messageId || !emailId) {
      throw new Error("Missing required parameters");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get account from DB
    const { data: account, error: accError } = await supabase
      .from("zoho_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (accError || !account) throw new Error("Account record not found.");

    const apiDomain = account.account_email?.endsWith('.com') ? 'zoho.com' : 'zoho.in';
    
    // 2. Refresh token logic
    let accessToken = account.access_token;
    const now = new Date();
    const expiry = new Date(account.expiry_time);

    if (now.getTime() > expiry.getTime() - 300000) {
      const refreshResponse = await fetch(`https://accounts.${apiDomain}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: account.refresh_token,
          client_id: Deno.env.get("ZOHO_CLIENT_ID")!,
          client_secret: Deno.env.get("ZOHO_CLIENT_SECRET")!,
          grant_type: "refresh_token",
        }),
      });
      const refreshData = await refreshResponse.json();
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
        const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
        await supabase.from("zoho_accounts").update({
          access_token: accessToken,
          expiry_time: newExpiry,
        }).eq("id", accountId);
      }
    }

    // 3. Get Account ID from Zoho API
    const accountsResponse = await fetch(`https://mail.${apiDomain}/api/accounts`, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });
    const accountsData = await accountsResponse.json();
    const verifiedZohoId = accountsData.data?.[0]?.accountId;
    if (!verifiedZohoId) throw new Error("No verified Zoho account ID found.");

    // 4. Get Folders to find the target folderId
    const foldersResponse = await fetch(`https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders`, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });
    const foldersData = await foldersResponse.json();
    
    const targetFolderName = (folderName || 'inbox').toLowerCase();
    let targetFolder = (foldersData.data || []).find((f: any) => f.folderName.toLowerCase() === targetFolderName);
    
    // If exact match fails, maybe it's nested or we just fallback to searching
    if (!targetFolder) {
       targetFolder = (foldersData.data || []).find((f: any) => f.folderName.toLowerCase().includes(targetFolderName));
    }
    
    // Default to inbox if still not found
    if (!targetFolder) {
       targetFolder = (foldersData.data || []).find((f: any) => f.folderName.toLowerCase() === 'inbox');
    }

    if (!targetFolder) throw new Error(`Could not find ${targetFolderName} or Inbox folder.`);

    // 5. Fetch specific message content
    const contentUrl = `https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders/${targetFolder.folderId}/messages/${messageId}/content`;
    const contentResponse = await fetch(contentUrl, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });
    const contentData = await contentResponse.json();

    if (!contentResponse.ok) {
      throw new Error(`Zoho Content Error: ${contentData.status?.description || JSON.stringify(contentData)}`);
    }

    let htmlContent = contentData.data?.content || "No content found in this message.";

    // If the content is plain text, preserve its formatting and newlines
    if (!htmlContent.includes("<html") && !htmlContent.includes("<body") && !htmlContent.includes("<div") && !htmlContent.includes("<p>") && !htmlContent.includes("<br")) {
      htmlContent = `<div style="font-family: sans-serif; white-space: pre-wrap; font-size: 14px; padding: 12px;">${htmlContent}</div>`;
    }

    // 6. Fetch attachments info and download them
    const attachmentInfoUrl = `https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders/${inboxFolder.folderId}/messages/${messageId}/attachmentinfo`;
    const attachmentInfoResponse = await fetch(attachmentInfoUrl, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });
    
    let dbAttachments: any[] = [];
    let attachmentDebugInfo = null;
    if (attachmentInfoResponse.ok) {
      const attachmentInfoData = await attachmentInfoResponse.json();
      attachmentDebugInfo = attachmentInfoData;
      let attachmentsList: any[] = [];
      
      // Handle different Zoho API response structures
      if (Array.isArray(attachmentInfoData.data)) {
        attachmentsList = attachmentInfoData.data;
      } else if (attachmentInfoData.data && Array.isArray(attachmentInfoData.data.attachments)) {
        attachmentsList = attachmentInfoData.data.attachments;
      }
      
      if (attachmentsList.length > 0) {
        console.log(`Found ${attachmentsList.length} attachments to download...`);
        for (const att of attachmentsList) {
          const storagePath = `mailbox/zoho-${messageId}-${att.attachmentId}-${att.attachmentName}`;
          
          // Download attachment content from Zoho
          const downloadUrl = `https://mail.${apiDomain}/api/accounts/${verifiedZohoId}/folders/${inboxFolder.folderId}/messages/${messageId}/attachments/${att.attachmentId}`;
          const downloadResponse = await fetch(downloadUrl, {
            headers: { 
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              Accept: "application/octet-stream"
            },
          });
          
          if (downloadResponse.ok) {
            const blob = await downloadResponse.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const fileData = new Uint8Array(arrayBuffer);
            
            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from("email-attachments")
              .upload(storagePath, fileData, {
                contentType: att.contentType || "application/octet-stream",
                upsert: true
              });
              
            if (uploadError) {
              console.error(`Failed to upload attachment ${att.attachmentName} to Supabase Storage:`, uploadError);
            } else {
              console.log(`Successfully uploaded ${att.attachmentName} to Supabase Storage!`);
              dbAttachments.push({
                filename: att.attachmentName,
                path: storagePath,
                contentType: att.contentType || "application/octet-stream"
              });
            }
          } else {
            console.error(`Failed to download attachment ${att.attachmentName} from Zoho. Status: ${downloadResponse.status}`);
          }
        }
      }
    }

    // 7. Cache the HTML body & attachments in our database so we don't fetch it again!
    const updatePayload: any = {
      body_html: htmlContent
    };
    if (dbAttachments.length > 0) {
      updatePayload.attachments = dbAttachments;
    }
    
    await supabase.from("emails").update(updatePayload).eq("id", emailId);

    return new Response(JSON.stringify({ 
      success: true, 
      content: htmlContent,
      attachments: dbAttachments.length > 0 ? dbAttachments : null,
      debug: attachmentDebugInfo
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
