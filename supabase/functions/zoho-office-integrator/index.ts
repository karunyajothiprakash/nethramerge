import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const apiKey = Deno.env.get("ZOHO_OFFICE_INTEGRATOR_API_KEY");
    const domain = Deno.env.get("ZOHO_OFFICE_INTEGRATOR_DOMAIN") || "zoho.in"; // Can be zoho.com or zoho.in

    if (!apiKey) {
      throw new Error("ZOHO_OFFICE_INTEGRATOR_API_KEY is not set in Supabase Secrets.");
    }

    // ==========================================
    // ACTION: SAVE (Zoho Webhook Callback)
    // ==========================================
    if (action === "save") {
      const storagePath = url.searchParams.get("path");
      if (!storagePath) throw new Error("Missing storage path for save action.");

      console.log(`Received save webhook from Zoho for path: ${storagePath}`);

      // Zoho sends the updated file in a multipart form-data under the 'content' field
      const formData = await req.formData();
      const file = formData.get("content");

      if (!file || !(file instanceof File)) {
        throw new Error("No file content found in Zoho callback payload.");
      }

      const fileBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);

      // Save updated document back to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("email-attachments")
        .upload(storagePath, uint8Array, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        console.error("Failed to save updated file from Zoho back to Storage:", uploadError);
        return new Response(JSON.stringify({ status: "failure", error: uploadError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`Successfully saved updated sheet to Supabase Storage path: ${storagePath}`);
      return new Response(JSON.stringify({ status: "success" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ==========================================
    // ACTION: CREATE SESSION
    // ==========================================
    const { path, filename, displayName, userId } = await req.json();

    if (!path || !filename) {
      throw new Error("Missing required parameters: path or filename.");
    }

    console.log(`Creating Zoho Office Integrator session for: ${filename} (${path})`);

    // 1. Download file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("email-attachments")
      .download(path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download attachment from storage: ${downloadError?.message || "File empty"}`);
    }

    // 2. Prepare Zoho request
    const zohoFormData = new FormData();
    zohoFormData.append("apikey", apiKey);
    
    // Convert Blob to File object so Deno fetch sends it correctly as multipart
    const blobFile = new File([fileData], filename, { type: fileData.type });
    zohoFormData.append("document", blobFile);

    const docId = path.replace(/[^a-zA-Z0-9]/g, "-"); // Create clean document ID
    zohoFormData.append(
      "document_info",
      JSON.stringify({
        document_id: docId,
        document_name: filename,
      })
    );

    // Save URL links back to this same function with action=save
    const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/zoho-office-integrator?action=save&path=${encodeURIComponent(path)}`;
    zohoFormData.append(
      "callback_settings",
      JSON.stringify({
        save_url: functionUrl,
        save_format: "xlsx",
      })
    );

    zohoFormData.append(
      "user_info",
      JSON.stringify({
        user_id: userId || "erp-user",
        display_name: displayName || "ERP User",
      })
    );

    zohoFormData.append(
      "editor_settings",
      JSON.stringify({
        language: "en",
      })
    );

    // 3. Request Session URL from Zoho Office Integrator
    const zohoUrl = `https://officeintegrator.${domain}/officeintegrator/api/v1/spreadsheet`;
    console.log(`Sending session request to Zoho URL: ${zohoUrl}`);
    
    const zohoResponse = await fetch(zohoUrl, {
      method: "POST",
      body: zohoFormData,
    });

    const zohoResult = await zohoResponse.json();

    if (!zohoResponse.ok) {
      throw new Error(`Zoho API Error: ${zohoResult.message || JSON.stringify(zohoResult)}`);
    }

    console.log(`Successfully created Zoho session. Editor URL: ${zohoResult.document_url}`);

    return new Response(JSON.stringify({ 
      success: true, 
      document_url: zohoResult.document_url 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Zoho Office Integrator Session Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
