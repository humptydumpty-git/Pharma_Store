## Supabase integration guide for PharmaStore (online + offline)

This guide explains how to connect the existing offline PharmaStore app to Supabase so it can work **both online and offline** with multi‑tenant support (one store per “tenant”).

---

### 1. Create a Supabase project

1. Go to `https://supabase.com` and create an account.
2. Create a **new project**:
   - Choose a strong database password.
   - Region: closest to your main users.
3. Once created, go to **Project Settings → API** and note:
   - **Project URL**
   - **anon public key**

You’ll paste these into `src/services/supabaseClient.js` later.

---

### 2. Apply the database schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Create a new query and paste the contents of `SUPABASE-SCHEMA.sql` from this repo.
3. Run the script:
   - This creates:
     - `tenants`, `tenant_members`
     - `drugs`, `sales`, `stock_adjustments`, `petty_cash`
     - `employees`, `salary_payments`, `audit_log`
   - It also enables **Row Level Security (RLS)** so each user only sees their own tenant’s data.

---

### 3. Configure Supabase Auth (signup, email verification)

1. Go to **Authentication → Providers → Email**:
   - Turn **Email** provider **ON**.
   - Enable **Confirm email**.
   - Set **Site URL** / redirect URLs (e.g. `https://yourdomain.com` or `http://localhost:3000` for local testing).
2. Optionally customize email templates (verification link + wording).

Flow we recommend:

- **Sign up (store owner)**:
  - Frontend calls `supabase.auth.signUp({ email, password, options: { data: { owner_name, store_name, phone } } })`.
  - On success, Supabase sends an email with a **verification link**.
  - After the owner clicks the link and the session is active, you:
    - Create a row in `tenants` (store info).
    - Create a row in `tenant_members` for `(tenant_id, auth.uid(), 'owner')`.

- **Sign in**:
  - Use `supabase.auth.signInWithPassword({ email, password })`.
  - The JWT from Supabase automatically enforces RLS for that user.

---

### 4. Add Supabase client in the frontend

We use a small wrapper in `src/services/supabaseClient.js`. Create/update this file like this:

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PharmaSupabase = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  let client = null;

  function getSupabaseClient() {
    if (client) return client;

    const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
    const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';

    if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Supabase JS library or config missing.');
      return null;
    }

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  }

  return { getSupabaseClient };
}));
```

Then in `index.html` `<head>` add (above `app.js`):

```html
<script src="https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script defer src="src/services/supabaseClient.js"></script>
<script defer src="src/services/syncService.js"></script>
```

> Note: Keep your **service_role** key only on the server, never in the browser. We only use the **anon public key** here.

---

### 5. Online/offline sync design

The current app is **offline‑first** with `localStorage`. To make it online+offline:

- **Local source of truth**: Keep using local arrays (`this.drugs`, `this.sales`, etc.) and `localStorage` so the app works with no network.
- **Sync layer** (see `src/services/syncService.js`):
  - When the browser goes **online**:
    - For each table (`drugs`, `sales`, `stockAdjustments`, `pettyCash`, `employees`, `salaryPayments`):
      - Push **new/updated local rows** to Supabase (`upsert`).
      - Pull **new/updated remote rows** since last sync timestamp.
      - Merge results into local state and re‑save to `localStorage`.
  - When **offline**:
    - All operations write only to local arrays + `localStorage`.
    - A small “dirty” flag per record (e.g. `_pendingSync: true`) can mark items that must be sent later.

You already have `isOnline` and `setupOnlineOfflineListeners()` in `app.js`. When `online` fires, call:

```js
if (window.PharmaSync && window.PharmaSupabase) {
  PharmaSync.syncAll(pharmaStore);
}
```

---

### 6. Multi‑tenant behaviour per store

Using the schema:

- Every row in business tables has `tenant_id`.
- When a user is authenticated, RLS uses `auth.uid()` and `tenant_members` to decide:
  - Which `tenant_id` rows they can see.
  - Which rows they can insert/update.
- On the frontend:
  - After login, fetch the tenant record for the current user and store it locally:
    - Display the **store name** prominently on the dashboard (e.g. “Dashboard – [Store Name]”).
  - When creating new rows (drug, sale, petty cash, etc.), always include `tenant_id` from the current tenant.

For different stores (tenants), they never see each other’s data thanks to:

- `tenant_id` foreign key.
- RLS policies in `SUPABASE-SCHEMA.sql`.

---

### 7. Landing page: sign‑in / sign‑up flow

You can evolve the current login section in `index.html` into a two‑tab form:

- **Sign Up (Store owner)**:
  - Fields:
    - Store name
    - Owner name
    - Email
    - Telephone
    - Password + Confirm password
  - Flow:
    1. Call `supabase.auth.signUp({ email, password, options: { data: { owner_name, store_name, phone } } })`.
    2. Show message “Check your email to verify your account.”
    3. After email verification, on the redirect page:
       - Call a **Supabase Edge Function** or `insert` logic to:
         - Create `tenants` row.
         - Create `tenant_members` row with `role = 'owner'`.

- **Sign In**:
  - Fields: email + password.
  - Use `supabase.auth.signInWithPassword`.
  - On success:
    - Get the user’s tenant via `tenant_members`.
    - Initialize the app with that `tenant_id`.

You can keep the existing internal user management (per store) or move all store users into `tenant_members` and use Supabase auth for everyone.

---

### 8. Online/offline behaviour

- When **online**:
  - On login, load initial data from Supabase into local arrays (`this.drugs`, `this.sales`, etc.).
  - Periodically or on demand, call `PharmaSync.syncAll(pharmaStore)` to keep local and remote in sync.
- When **offline**:
  - All views and actions still work against `localStorage`.
  - New changes are marked as pending and will be pushed on the next successful sync.

This lets each tenant keep working in bad or no network, and catch up when the connection returns.

---

### 9. Theming & UX recommendations

- Update CSS variables in `style.css` to use a **white / green / blue** palette:
  - `--accent-primary`: a deep blue.
  - `--accent-secondary`: a rich green.
  - Backgrounds: light gray/white.
- Keep layout responsive:
  - The current app already uses flexible layouts; test on mobile/tablet and tweak breakpoints if needed.
- SEO:
  - When you deploy as a multi‑tenant SaaS, add:
    - Proper `<title>` and `<meta>` tags.
    - Open Graph tags.
    - A marketing landing page (separate from the in‑app dashboard) for public SEO.

---

### 10. Summary of steps

1. Create Supabase project and apply `SUPABASE-SCHEMA.sql`.
2. Configure Email Auth with verification.
3. Add Supabase JS and `supabaseClient.js` + `syncService.js` to the frontend.
4. Implement sign‑up and sign‑in flows using Supabase Auth.
5. Use `tenant_id` everywhere and respect RLS for multi‑tenant isolation.
6. Hook `PharmaSync.syncAll()` into the existing online/offline listeners for automatic sync.
7. Update styling to the white/green/blue theme and show the current tenant (store) name on the dashboard.


