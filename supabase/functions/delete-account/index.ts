import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "No authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get user from token
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("Invalid token:", userError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("Deleting account for user:", user.id);
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get referee id if exists
    const { data: referee } = await adminClient.from("referees").select("id").eq("user_id", user.id).maybeSingle();
    console.log("Referee record:", referee);

    // Collect all match IDs involving this user
    const matchIds: string[] = [];
    const { data: requesterMatches } = await adminClient.from("matches").select("id").eq("requester_id", user.id);
    if (requesterMatches) matchIds.push(...requesterMatches.map(m => m.id));

    if (referee) {
      const { data: refereeMatches } = await adminClient.from("matches").select("id").eq("referee_id", referee.id);
      if (refereeMatches) matchIds.push(...refereeMatches.map(m => m.id));
    }
    console.log("Match IDs to clean:", matchIds.length);

    // Delete messages on user's matches
    if (matchIds.length > 0) {
      const { error: msgErr } = await adminClient.from("messages").delete().in("match_id", matchIds);
      if (msgErr) console.error("Error deleting match messages:", msgErr.message);
    }
    // Delete messages sent by user elsewhere
    const { error: msgErr2 } = await adminClient.from("messages").delete().eq("sender_id", user.id);
    if (msgErr2) console.error("Error deleting sender messages:", msgErr2.message);

    // Delete reviews
    const { error: revErr1 } = await adminClient.from("reviews").delete().eq("reviewer_id", user.id);
    if (revErr1) console.error("Error deleting reviewer reviews:", revErr1.message);
    if (referee) {
      const { error: revErr2 } = await adminClient.from("reviews").delete().eq("referee_id", referee.id);
      if (revErr2) console.error("Error deleting referee reviews:", revErr2.message);
    }

    // Delete matches
    if (referee) {
      const { error: mErr1 } = await adminClient.from("matches").delete().eq("referee_id", referee.id);
      if (mErr1) console.error("Error deleting referee matches:", mErr1.message);
    }
    const { error: mErr2 } = await adminClient.from("matches").delete().eq("requester_id", user.id);
    if (mErr2) console.error("Error deleting requester matches:", mErr2.message);

    // Delete remaining data
    const tables = [
      { table: "referees", col: "user_id" },
      { table: "identity_verifications", col: "user_id" },
      { table: "support_messages", col: "user_id" },
      { table: "user_roles", col: "user_id" },
      { table: "profiles", col: "user_id" },
    ];

    for (const { table, col } of tables) {
      const { error } = await adminClient.from(table).delete().eq(col, user.id);
      if (error) console.error(`Error deleting from ${table}:`, error.message);
    }

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError.message);
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("Account deleted successfully");
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
