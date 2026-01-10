(function () {
    let client = null;

    function getSupabaseClient() {
        if (client) return client;

        const SUPABASE_URL = 'https://zgnyabbjvfnwchpwzfgl.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbnlhYmJqdmZud2NocHd6ZmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDA0NDcsImV4cCI6MjA4MjYxNjQ0N30.NbIB_JUrCco-ZNex4rnE-ImApQjA-zljWKy3qVIbtDU';

        if (typeof window === 'undefined' || !window.supabase) {
            console.warn('Supabase JS library not found. Ensure the UMD bundle is included in index.html.');
            return null;
        }

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase URL/anon key not configured. Edit src/services/supabaseClient.js.');
            return null;
        }

        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return client;
    }

    // Fetch list of tenants the current authenticated user belongs to.
    async function getUserTenants() {
        const supabase = getSupabaseClient();
        if (!supabase) return null;
        const { data, error } = await supabase.from('current_user_tenants').select('*');
        if (error) {
            console.warn('getUserTenants error', error);
            return null;
        }
        return data || [];
    }

    // Load preferences for the current user+tenant (maybeSingle expected)
    async function loadUserPreferences(tenantId) {
        const supabase = getSupabaseClient();
        if (!supabase) return null;

        // make sure user is signed in
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData.user) {
            console.warn('loadUserPreferences: no authenticated user', userErr);
            return null;
        }

        const userId = userData.user.id;
        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (error) {
            console.warn('loadUserPreferences error', error);
            return null;
        }
        return data || null;
    }

    // Upsert user preferences for current user and tenant
    async function saveUserPreferences(tenantId, prefs) {
        const supabase = getSupabaseClient();
        if (!supabase) return { error: 'no-client' };

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData.user) {
            return { error: 'not-authenticated' };
        }
        const userId = userData.user.id;

        const payload = {
            user_id: userId,
            tenant_id: tenantId,
            last_device: prefs.last_device || null,
            last_route: prefs.last_route || null,
            last_view_state: prefs.last_view_state || {},
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('user_preferences')
            .upsert(payload, { onConflict: 'user_id,tenant_id' })
            .select()
            .maybeSingle();

        if (error) {
            console.warn('saveUserPreferences error', error);
            return { error };
        }

        return { data };
    }

    // Convenience: set current tenant id in local app store (caller implements store)
    async function applyLastSeenForUser(store) {
        if (!store) return;
        const tenants = await getUserTenants();
        if (!tenants || !tenants.length) {
            console.log('applyLastSeenForUser: no tenant membership found.');
            return;
        }

        // choose the tenant to apply: prefer store.currentTenantId if present, otherwise first tenant
        const tenantToUse = store.currentTenantId || tenants[0].tenant_id;

        const prefs = await loadUserPreferences(tenantToUse);
        if (prefs) {
            store.currentTenantId = tenantToUse;
            // restore last_route and view state into the app store if available
            if (prefs.last_route) store.currentRoute = prefs.last_route;
            if (prefs.last_view_state) store.currentViewState = prefs.last_view_state;
            store.lastDevice = prefs.last_device || store.lastDevice;
        } else {
            // set defaults
            store.currentTenantId = tenantToUse;
        }

        // persist selection locally if app exposes saveData
        if (typeof store.saveData === 'function') {
            store.saveData('appState', {
                currentTenantId: store.currentTenantId,
                currentRoute: store.currentRoute,
                currentViewState: store.currentViewState,
            });
        }
    }

    window.PharmaSupabase = {
        getSupabaseClient,
        getUserTenants,
        loadUserPreferences,
        saveUserPreferences,
        applyLastSeenForUser
    };
})();
