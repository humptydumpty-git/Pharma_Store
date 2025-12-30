-- PharmaStore Supabase schema (multi-tenant, row-based tenancy)
-- Run this in the Supabase SQL editor after creating your project.

-- 1) Tenants (stores)
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- Store name
  owner_user_id uuid not null,        -- references auth.users.id
  owner_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- 2) Tenant members (users within a store)
create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,             -- references auth.users.id
  role text not null check (role in ('owner', 'admin', 'user')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

-- 3) Drugs
create table if not exists public.drugs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category text,
  quantity numeric not null default 0,
  price numeric(12,2) not null default 0,
  expiry date,
  supplier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) Sales
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  drug_id uuid references public.drugs(id),
  drug_name text,
  quantity numeric not null,
  price numeric(12,2) not null,
  total numeric(12,2) not null,
  customer_name text,
  payment_method text,
  date date not null,
  time time not null,
  sold_by text,
  created_at timestamptz not null default now()
);

-- 5) Stock adjustments
create table if not exists public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  drug_id uuid references public.drugs(id),
  drug_name text,
  old_quantity numeric not null,
  adjustment text not null,
  new_quantity numeric not null,
  reason text,
  notes text,
  adjusted_by text,
  timestamp timestamptz not null default now()
);

-- 6) Petty cash
create table if not exists public.petty_cash (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  date date not null,
  category text not null,
  description text not null,
  amount numeric(12,2) not null,
  type text not null check (type in ('income', 'expense')),
  payment_method text,
  notes text,
  recorded_by text,
  timestamp timestamptz not null default now()
);

-- 7) Employees
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  position text,
  gross_pay numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  ssnit numeric(12,2) not null default 0,
  insurance numeric(12,2) not null default 0,
  net_salary numeric(12,2) not null default 0,
  phone text,
  email text,
  start_date date,
  created_at timestamptz not null default now()
);

-- 8) Salary payments
create table if not exists public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid references public.employees(id),
  employee_name text,
  position text,
  month text not null,
  amount numeric(12,2) not null,
  payment_method text,
  notes text,
  processed_by text,
  timestamp timestamptz not null default now()
);

-- 9) Audit log (optional on Supabase if you want central logging)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  action text not null,
  details text,
  category text,
  user_name text,
  ip text,
  device text,
  created_at timestamptz not null default now()
);

-- ========================
-- Row Level Security (RLS)
-- ========================

-- Enable RLS
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.drugs enable row level security;
alter table public.sales enable row level security;
alter table public.stock_adjustments enable row level security;
alter table public.petty_cash enable row level security;
alter table public.employees enable row level security;
alter table public.salary_payments enable row level security;
alter table public.audit_log enable row level security;

-- Helper: ensure every authenticated user can only see tenants they belong to
create policy "tenant_members_select_own" on public.tenant_members
for select using (
  auth.uid() = user_id
);

-- Tenants: a user can see tenants where he is a member
create policy "tenants_select_own" on public.tenants
for select using (
  id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

-- Data tables: match tenant_id of member
create policy "drugs_tenant_isolation" on public.drugs
for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
)
with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy "sales_tenant_isolation" on public.sales
for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
)
with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy "stock_adjustments_tenant_isolation" on public.stock_adjustments
for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
)
with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy "petty_cash_tenant_isolation" on public.petty_cash
for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
)
with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy "employees_tenant_isolation" on public.employees
for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
)
with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy "salary_payments_tenant_isolation" on public.salary_payments
for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
)
with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy "audit_log_tenant_isolation" on public.audit_log
for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
)
with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

-- Note: you should also configure Supabase Auth email confirmation
-- and redirect URLs in the Supabase dashboard.


