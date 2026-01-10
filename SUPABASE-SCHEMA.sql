-- SUPABASE multi-tenant schema (shared-schema approach)
-- Purpose: Add tenant mapping, user preferences, tenant-scoped example tables, RLS and admin helper functions.
-- Apply via Supabase SQL editor or as part of DB migrations.
-- NOTE: Do NOT expose service_role key to clients. Use server-side functions / Edge Functions for tenant creation.

-- Enable required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- tenants: maps stores/owners
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- tenant_users: map auth.users.id to tenants with roles (owner, admin, user)
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, -- should match auth.users.id
  role text NOT NULL CHECK (role IN ('owner','admin','user')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- user_preferences: per-user, per-tenant last device/view state to restore UI across devices
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- auth.users.id
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  last_device text,
  last_route text,
  last_view_state jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

-- Example tenant-scoped application table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  price numeric,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on tenant-scoped tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policy: allow SELECT on products only for users who belong to the tenant
CREATE POLICY IF NOT EXISTS products_select_for_tenant
  ON public.products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = public.products.tenant_id
        AND tu.user_id = auth.uid()
    )
  );

-- RLS policies: allow INSERT/UPDATE/DELETE for owner or admin in the tenant
CREATE POLICY IF NOT EXISTS products_modify_for_admins
  ON public.products
  FOR INSERT, UPDATE, DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = public.products.tenant_id
        AND tu.user_id = auth.uid()
        AND tu.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = public.products.tenant_id
        AND tu.user_id = auth.uid()
        AND tu.role IN ('owner','admin')
    )
  );

-- RLS policies for user_preferences: users can only read/write their own preferences
CREATE POLICY IF NOT EXISTS user_prefs_select
  ON public.user_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS user_prefs_modify
  ON public.user_preferences
  FOR INSERT, UPDATE, DELETE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Helper function: create tenant and assign owner (requires service role / server-side call)
CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name text,
  p_slug text,
  p_owner uuid
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant uuid;
BEGIN
  -- create tenant record
  INSERT INTO public.tenants (name, slug) VALUES (p_name, p_slug)
    RETURNING id INTO v_tenant;

  -- map owner to tenant with owner role
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
    VALUES (v_tenant, p_owner, 'owner');

  RETURN v_tenant;
END;
$$;

-- IMPORTANT: mark this function's owner appropriately and restrict who can call it.
-- Only call create_tenant from server-side code or Supabase Edge Functions that run with the service_role key.

-- Optional advanced: create schema-per-tenant (commented, advanced operational overhead)
-- Example skeleton: create schema and example table inside it. Use with caution.
-- CREATE OR REPLACE FUNCTION public.create_tenant_schema(p_slug text)
-- RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   EXECUTE format('CREATE SCHEMA IF NOT EXISTS tenant_%I', p_slug);
--   EXECUTE format($$CREATE TABLE IF NOT EXISTS tenant_%I.products (
--       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--       name text NOT NULL,
--       price numeric,
--       created_at timestamptz DEFAULT now()
--     );$$, p_slug);
-- END;
-- $$;

-- Note: schema-per-tenant implies migrations per schema and search_path handling. Prefer shared-schema with RLS unless strict isolation required.

-- Optional: convenience view to get current user's tenants
CREATE OR REPLACE VIEW public.current_user_tenants AS
SELECT t.id AS tenant_id, t.name, t.slug, tu.role
FROM public.tenants t
JOIN public.tenant_users tu ON tu.tenant_id = t.id
WHERE tu.user_id = auth.uid();

-- End of SUPABASE-SCHEMA.sql
