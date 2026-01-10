import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client bound to caller's JWT
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user: caller },
    } = await anonClient.auth.getUser();

    if (!caller) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Service client for privileged operations
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: member, error: memberError } = await serviceClient
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: "Caller has no tenant membership" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["owner", "admin"].includes(member.role)) {
      return new Response(JSON.stringify({ error: "Not allowed to invite users" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").toString().trim();
    const role = (body.role || "user").toString().trim();
    const password = (body.password || "").toString();

    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["owner", "admin", "user"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Auth user via admin API
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password: password || undefined,
      email_confirm: !!password,
    });

    if (createError || !newUser.user) {
      console.error("invite-tenant-user createUser error", createError);
      return new Response(JSON.stringify({ error: "Failed to create Supabase user" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: linkError } = await serviceClient.from("tenant_users").insert({
      tenant_id: member.tenant_id,
      user_id: newUser.user.id,
      role,
    });

    if (linkError) {
      console.error("invite-tenant-user linkError", linkError);
      return new Response(JSON.stringify({ error: "Failed to link user to tenant" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user_id: newUser.user.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("invite-tenant-user unexpected error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
