import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("InfinitePay webhook received:", JSON.stringify(payload));

    const orderNsu = payload.order_nsu || payload.orderNsu;
    const status = payload.status;

    if (!orderNsu) {
      return new Response(JSON.stringify({ error: "order_nsu missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find match by payment_nsu
    const { data: match, error: fetchError } = await supabase
      .from("matches")
      .select("id, status")
      .eq("payment_nsu", orderNsu)
      .single();

    if (fetchError || !match) {
      console.error("Match not found for NSU:", orderNsu);
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update match as confirmed
    if (status === "approved" || status === "paid" || status === "completed") {
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          status: "confirmed",
          payment_method: payload.capture_method || "pix",
          paid_at: new Date().toISOString(),
        })
        .eq("id", match.id);

      if (updateError) {
        console.error("Error updating match:", updateError);
        return new Response(JSON.stringify({ error: "Update failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Match confirmed via webhook:", match.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
