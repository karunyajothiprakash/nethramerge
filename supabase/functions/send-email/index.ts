import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, message, leadName } = await req.json();

    if (!to || !subject || !message) {
      throw new Error("Missing required fields: to, subject, or message");
    }

    if (!RESEND_API_KEY) {
      // For development/demo purposes if API key is not set
      console.warn("RESEND_API_KEY is not set. Simulating email send.");
      console.log(`To: ${to}\nSubject: ${subject}\nMessage: ${message}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return new Response(JSON.stringify({ success: true, simulated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Call Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BDE Team <bde@shastika.com>", // Make sure this domain is verified in Resend
        to: [to],
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-w-2xl mx-auto p-4">
            <p>Hi ${leadName || 'there'},</p>
            <p style="white-space: pre-wrap;">${message}</p>
            <hr style="margin-top: 2rem; border-color: #eee;" />
            <p style="color: #666; font-size: 0.875rem;">Sent securely via Shastika ERP</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API Error:", errorData);
      throw new Error("Failed to send email via Resend");
    }

    const data = await res.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
