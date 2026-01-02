(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PharmaSync = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    /**
     * Very small, generic sync shell. The goal is to keep the app working 100% offline
     * while allowing you to plug in Supabase as the online source of truth.
     *
     * This implementation currently performs a **one-way pull** from Supabase → local:
     * it loads the latest data for the current tenant and overwrites the in‑memory
     * arrays (`store.drugs`, `store.sales`, etc.), then persists them via store.saveData.
     *
     * Two‑way conflict‑resolving sync (pushing offline edits back to Supabase) would
     * require extra metadata (per‑row sync timestamps / versions) and is not included
     * here to avoid data corruption.
     */

    async function syncTable(store, supabaseClient, localKey, tableName) {
        // Optional: support multi‑tenant by tenant_id if the store exposes one
        const tenantId = store.currentTenantId || store.tenantId || null;

        let query = supabaseClient.from(tableName).select('*');
        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query;
        if (error) {
            console.warn(`PharmaSync: failed to load ${tableName} from Supabase`, error);
            return;
        }

        if (!Array.isArray(data)) return;

        try {
            // Overwrite local in‑memory state
            store[localKey] = data;

            // Persist to localStorage if the app exposes saveData
            if (typeof store.saveData === 'function') {
                store.saveData(localKey, data);
            }

            console.log(`PharmaSync: synced ${data.length} row(s) for ${tableName}`);
        } catch (e) {
            console.error(`PharmaSync: error applying ${tableName} data locally`, e);
        }
    }

    async function pushDirtyData(store, supabaseClient, localKey, tableName, idField = 'id') {
        const tenantId = store.currentTenantId || store.tenantId || null;
        if (!tenantId) return;

        const data = store[localKey] || [];
        const dirty = data.filter(d => d && d._pendingSync);
        if (!dirty.length) return;

        const payload = dirty.map(d => {
            const clone = { ...d };
            // Ensure tenant_id is set for Supabase
            clone.tenant_id = clone.tenant_id || tenantId;
            // Strip local-only flags
            delete clone._pendingSync;
            return clone;
        });

        const { error } = await supabaseClient
            .from(tableName)
            .upsert(payload, { onConflict: idField });

        if (error) {
            console.warn(`PharmaSync: failed to push dirty ${tableName}`, error);
            return;
        }

        // Clear _pendingSync flag locally
        store[localKey] = data.map(d =>
            d && d._pendingSync ? { ...d, _pendingSync: false } : d
        );
        if (typeof store.saveData === 'function') {
            store.saveData(localKey, store[localKey]);
        }

        console.log(`PharmaSync: pushed ${dirty.length} dirty ${tableName} to Supabase`);
    }

    async function syncAll(store) {
        if (!store || typeof store !== 'object') return;

        // Respect the app-level flag so we don't unexpectedly overwrite local data
        if (!store.cloudSyncEnabled) {
            console.log('PharmaSync: cloud sync disabled (store.cloudSyncEnabled = false). Skipping.');
            return;
        }
        const supabaseClient = (root.PharmaSupabase && root.PharmaSupabase.getSupabaseClient)
            ? root.PharmaSupabase.getSupabaseClient()
            : null;

        if (!supabaseClient) {
            console.warn('PharmaSync: Supabase client not available, skipping online sync.');
            return;
        }

        try {
            // Two-way sync: push local dirty rows, then pull fresh state
            await pushDirtyData(store, supabaseClient, 'drugs', 'drugs');
            await pushDirtyData(store, supabaseClient, 'sales', 'sales');
            await pushDirtyData(store, supabaseClient, 'stockAdjustments', 'stock_adjustments');
            await pushDirtyData(store, supabaseClient, 'pettyCash', 'petty_cash');
            await pushDirtyData(store, supabaseClient, 'employees', 'employees');
            await pushDirtyData(store, supabaseClient, 'salaryPayments', 'salary_payments');

            await syncTable(store, supabaseClient, 'drugs', 'drugs');
            await syncTable(store, supabaseClient, 'sales', 'sales');
            await syncTable(store, supabaseClient, 'stockAdjustments', 'stock_adjustments');
            await syncTable(store, supabaseClient, 'pettyCash', 'petty_cash');
            await syncTable(store, supabaseClient, 'employees', 'employees');
            await syncTable(store, supabaseClient, 'salaryPayments', 'salary_payments');

            console.log('PharmaSync: syncAll completed (two-way sync).');
        } catch (e) {
            console.error('PharmaSync: syncAll failed', e);
        }
    }

    return {
        syncAll
    };
}));
