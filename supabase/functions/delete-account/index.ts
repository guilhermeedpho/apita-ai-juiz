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

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get referee id if user is a referee
    const { data: referee } = await adminClient.from("referees").select("id").eq("user_id", user.id).maybeSingle();

    // Get all match IDs where user is requester or referee (to delete related messages)
    const matchIds: string[] = [];
    const { data: requesterMatches } = await adminClient.from("matches").select("id").eq("requester_id", user.id);
    if (requesterMatches) matchIds.push(...requesterMatches.map(m => m.id));
    
    if (referee) {
      const { data: refereeMatches } = await adminClient.from("matches").select("id").eq("referee_id", referee.id);
      if (refereeMatches) matchIds.push(...refereeMatches.map(m => m.id));
    }

    // Delete ALL messages on user's matches (including from other users)
    if (matchIds.length > 0) {
      await adminClient.from("messages").delete().in("match_id", matchIds);
    }
    // Also delete messages sent by user in other matches
    await adminClient.from("messages").delete().eq("sender_id", user.id);

    // Delete reviews: by reviewer AND reviews about this referee
    await adminClient.from("reviews").delete().eq("reviewer_id", user.id);
    if (referee) {
      await adminClient.from("reviews").delete().eq("referee_id", referee.id);
    }

    // Now safe to delete matches
    if (referee) {
      await adminClient.from("matches").delete().eq("referee_id", referee.id);
    }
    await adminClient.from("matches").delete().eq("requester_id", user.id);

    // Delete remaining data
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
