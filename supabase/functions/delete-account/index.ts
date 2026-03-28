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
      return new Response(JSON.stringify({ error: "No authorization" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
    }

    // Use service role to delete user data and auth account
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete in order: messages, matches, reviews, referees, verifications, roles, profiles, then auth user
    await adminClient.from("messages").delete().eq("sender_id", user.id);
    await adminClient.from("reviews").delete().eq("reviewer_id", user.id);
    
    // Get referee id to delete related matches
    const { data: referee } = await adminClient.from("referees").select("id").eq("user_id", user.id).maybeSingle();
    if (referee) {
      await adminClient.from("matches").delete().eq("referee_id", referee.id);
    }
    await adminClient.from("matches").delete().eq("requester_id", user.id);
    await adminClient.from("referees").delete().eq("user_id", user.id);
    await adminClient.from("identity_verifications").delete().eq("user_id", user.id);
    await adminClient.from("support_messages").delete().eq("user_id", user.id);
    await adminClient.from("user_roles").delete().eq("user_id", user.id);
    await adminClient.from("profiles").delete().eq("user_id", user.id);

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
