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
     * The actual Supabase read/write logic should be implemented where the TODOs are.
     */

    async function syncAll(store) {
        if (!store || typeof store !== 'object') return;
        const supabaseClient = (root.PharmaSupabase && root.PharmaSupabase.getSupabaseClient)
            ? root.PharmaSupabase.getSupabaseClient()
            : null;

        if (!supabaseClient) {
            console.warn('PharmaSync: Supabase client not available, skipping online sync.');
            return;
        }

        try {
            // Example: you can push & pull each dataset here.
            // The details depend on how you choose to track per‑record sync state.

            // await syncTable(store, supabaseClient, 'drugs', 'drugs');
            // await syncTable(store, supabaseClient, 'sales', 'sales');
            // await syncTable(store, supabaseClient, 'stockAdjustments', 'stock_adjustments');
            // await syncTable(store, supabaseClient, 'pettyCash', 'petty_cash');
            // await syncTable(store, supabaseClient, 'employees', 'employees');
            // await syncTable(store, supabaseClient, 'salaryPayments', 'salary_payments');

            console.log('PharmaSync: syncAll completed (stub). Implement Supabase upsert logic here.');
        } catch (e) {
            console.error('PharmaSync: syncAll failed', e);
        }
    }

    return {
        syncAll
    };
}));


