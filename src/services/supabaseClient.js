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

        const SUPABASE_URL = 'https://zgnyabbjvfnwchpwzfgl.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbnlhYmJqdmZud2NocHd6ZmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDA0NDcsImV4cCI6MjA4MjYxNjQ0N30.NbIB_JUrCco-ZNex4rnE-ImApQjA-zljWKy3qVIbtDU';

        const global = (typeof window !== 'undefined')
            ? window
            : (typeof self !== 'undefined' ? self : globalThis);

        if (!global.supabase) {
            console.warn('Supabase JS library not found. Ensure the UMD bundle is included in index.html.');
            return null;
        }

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase URL/anon key not configured. Edit src/services/supabaseClient.js.');
            return null;
        }

        client = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return client;
    }

    return {
        getSupabaseClient
    };
}));


