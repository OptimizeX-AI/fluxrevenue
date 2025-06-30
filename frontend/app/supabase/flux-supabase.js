// public/app/supabase/flux-supabase.js

(function() {
  'use strict';

  // Attempt to initialize Supabase once the CDN has loaded
  function initializeSupabase() {
    // The CDN script should expose createClient as window.Supabase.createClient
    const globalSupabase = window.Supabase || window.supabase;
    if (!globalSupabase || typeof globalSupabase.createClient !== 'function') {
      return setTimeout(initializeSupabase, 100);
    }

    const { createClient } = globalSupabase;
    const { url, anonKey, options } = window.FluxConfig.supabase;

    // Create the client with cookie storage adapter
    const supabaseClient = createClient(url, anonKey, {
      auth: {
        // custom cookie-based storage
        storage: {
          getItem: key => {
            const cookie = document.cookie
              .split(';')
              .find(c => c.trim().startsWith(`${key}=`));
            return cookie
              ? decodeURIComponent(cookie.split('=')[1])
              : null;
          },
          setItem: (key, value) => {
            const maxAge = 60 * 60 * 24 * 365; // 1 year
            document.cookie = `${key}=${encodeURIComponent(value)}; Domain=${window.FluxConfig.flux.domain}; SameSite=${window.FluxConfig.flux.cookieOptions.sameSite}; Secure; Max-Age=${maxAge}; Path=${window.FluxConfig.flux.cookieOptions.path}`;
          },
          removeItem: key => {
            document.cookie = `${key}=; Domain=${window.FluxConfig.flux.domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${window.FluxConfig.flux.cookieOptions.path}`;
          }
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

    // Expose the initialized client globally
    window.supabase = supabaseClient;
    window.fluxConfig = window.FluxConfig;
    console.log('✅ Supabase inicializado com autenticação cross-domain');

    // Helper functions
    window.get_flux_token = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session?.access_token || null;
      } catch {
        return null;
      }
    };

    window.set_flux_token = () => {
      console.log('Token gerenciado automaticamente via cookies');
    };
  }

  // Hook initialization to DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
  } else {
    initializeSupabase();
  }
})();
