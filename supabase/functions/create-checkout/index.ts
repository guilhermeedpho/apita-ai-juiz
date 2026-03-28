import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INFINITEPAY_HANDLE = "nagattoclimatizacoes";
const CHECKOUT_API = "https://api.infinitepay.io/invoices/public/checkout/links";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { match_id } = await req.json();
    if (!match_id) {
      return new Response(JSON.stringify({ error: "match_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch match details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", match_id)
      .eq("requester_id", user.id)
      .single();

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: "Partida não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a unique NSU for this payment
    const paymentNsu = `APITAJA-${match_id.slice(0, 8).toUpperCase()}`;

    // Build redirect URL  
    const projectId = Deno.env.get("SUPABASE_URL")?.match(/\/\/(.*?)\.supabase/)?.[1] || "";
    const appUrl = req.headers.get("origin") || `https://apita-ai-juiz.lovable.app`;
    const redirectUrl = `${appUrl}/pagamento-confirmado?match_id=${match_id}&nsu=${paymentNsu}`;

    // Build InfinitePay checkout URL
    const items = [
      {
        name: `Árbitro - ${(match as any).field_type} ${(match as any).duration}min`,
        price: (match as any).price * 100, // InfinitePay uses cents
        quantity: 1,
      },
    ];

    const checkoutUrl = `https://checkout.infinitepay.io/${INFINITEPAY_HANDLE}?items=${encodeURIComponent(JSON.stringify(items))}&order_nsu=${paymentNsu}&redirect_url=${encodeURIComponent(redirectUrl)}`;

    // Save the payment NSU to the match
    await supabase
      .from("matches")
      .update({ payment_nsu: paymentNsu })
      .eq("id", match_id);

    return new Response(
      JSON.stringify({ checkout_url: checkoutUrl, payment_nsu: paymentNsu }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao criar checkout" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
