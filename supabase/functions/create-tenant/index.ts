import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client bound to the caller's JWT
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    // Service client for privileged inserts (bypasses RLS)
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const storeName = (body.store_name || user.user_metadata?.store_name || "").toString().trim();
    const ownerName = (body.owner_name || user.user_metadata?.owner_name || user.email || "").toString().trim();
    const phone = (body.phone || user.user_metadata?.phone || "").toString().trim();

    if (!storeName) {
      return new Response(JSON.stringify({ error: "store_name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // create a slug for the tenant
    const slug = storeName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50);

    // Use DB function to create tenant and map the owner. Requires service role.
    const { data: rpcData, error: rpcError } = await serviceClient.rpc("create_tenant", {
      p_name: storeName,
      p_slug: slug,
      p_owner: user.id,
    });

    if (rpcError) {
      console.error("create-tenant rpcError", rpcError);
      return new Response(JSON.stringify({ error: "Failed to create tenant (rpc)" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // rpc may return the tenant id depending on function; fetch tenant by slug to be safe
    const { data: tenant, error: tenantError } = await serviceClient
      .from("tenants")
      .select("id, name")
      .eq("slug", slug)
      .maybeSingle();

    if (tenantError || !tenant) {
      console.error("create-tenant fetch tenant error", tenantError);
      return new Response(JSON.stringify({ error: "Failed to retrieve tenant" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ tenant_id: tenant.id, name: tenant.name }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-tenant unexpected error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
