// public/app/supabase/flux-supabase.js - CORREÇÃO MÍNIMA

(function() {
  'use strict';

  if (window.fluxSupabaseAppInitialized) {
    console.log('🔄 [Flux App] flux-supabase já inicializado');
    return;
  }
  window.fluxSupabaseAppInitialized = true;

  console.log('🔄 [Flux App] Inicializando flux-supabase...');

  const supabaseUrl = 'https://cykfgwzzvlnkqundyxrq.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2Znd3p6dmxua3F1bmR5eHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk4NDEsImV4cCI6MjA2NTM5NTg0MX0.WRUOjlQfcxLsbu5JuF_7LbCOsY3cuTZwdCAkdiOQXPg';
  
  // ✅ ORIGINAL: Verificar se já existe client
  if (window.supabase && typeof window.supabase.auth?.getSession === 'function') {
    console.log('✅ [App] Usando instância Supabase existente');
    window.fluxSupabase = window.supabase;
    return;
  }

  // ✅ ÚNICA ADIÇÃO: Storage para ler os cookies que já existem
  const cookieStorage = {
    getItem: (key) => {
      try {
        const cookie = document.cookie
          .split(';')
          .find(c => c.trim().startsWith(`${key}=`));
        if (cookie) {
          return decodeURIComponent(cookie.split('=')[1]);
        }
        return null;
      } catch (error) {
        console.error('❌ [App] Erro ao ler cookie:', key, error);
        return null;
      }
    },
    
    setItem: (key, value) => {
      try {
        // ✅ Manter cookies como estão sendo salvos
        const maxAge = 365 * 24 * 60 * 60;
        const secure = window.location.protocol === 'https:';
        document.cookie = `${key}=${encodeURIComponent(value)}; Domain=.fluxrevenue.com.br; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secure ? 'Secure' : ''}`;
        console.log('✅ [App] Cookie salvo:', key);
      } catch (error) {
        console.error('❌ [App] Erro ao salvar cookie:', key, error);
      }
    },
    
    removeItem: (key) => {
      try {
        document.cookie = `${key}=; Domain=.fluxrevenue.com.br; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        console.log('✅ [App] Cookie removido:', key);
      } catch (error) {
        console.error('❌ [App] Erro ao remover cookie:', key, error);
      }
    }
  };

  try {
    // ✅ ORIGINAL com storage adicionado
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: cookieStorage, // ✅ ÚNICA MUDANÇA: adicionar esta linha
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      }
    });

    window.supabase = supabase;
    window.fluxSupabase = supabase;
    
    console.log('✅ [App] Supabase inicializado com cookie storage');

    // ✅ ORIGINAL: Helper functions
    window.get_flux_token = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session?.access_token || null;
      } catch (error) {
        console.warn('⚠️ [App] Erro ao obter token:', error);
        return null;
      }
    };

    // ✅ ORIGINAL: Auth state change
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 [App] Auth change:', event, {
        hasSession: !!session,
        domain: window.location.hostname
      });
      
      if (event === 'SIGNED_OUT' && !window.location.pathname.includes('login')) {
        setTimeout(() => {
          if (window.FluxConfig?.redirectToLogin) {
            window.FluxConfig.redirectToLogin('session_expired');
          }
        }, 2000);
      }
    });

  } catch (error) {
    console.error('❌ [App] Erro inicialização:', error);
  }
})();
