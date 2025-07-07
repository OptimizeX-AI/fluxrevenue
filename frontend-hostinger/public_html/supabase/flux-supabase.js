// public/supabase/flux-supabase.js - LANDING PAGE

(function() {
  'use strict';
  // ✅ CRÍTICO: Prevenir múltiplas inicializações
  if (window.fluxSupabaseLandingInitialized) {
    console.log('🔄 [Flux Landing] flux-supabase já inicializado');
    return;
  }
  window.fluxSupabaseLandingInitialized = true;

  console.log('🔄 [Flux Landing] Inicializando flux-supabase...');

  function createCookieStorage() {
    return {
      getItem: (key) => {
        try {
          const cookie = document.cookie
            .split(';')
            .find(c => c.trim().startsWith(`${key}=`));
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
        } catch (error) {
          console.error('❌ [Landing] Erro ao ler cookie:', key, error);
          return null;
        }
      },
      
      setItem: (key, value) => {
        try {
          const config = window.FluxConfig?.flux?.cookieOptions || {};
          const cookieString = [
            `${key}=${encodeURIComponent(value)}`,
            `Domain=${config.domain || '.fluxrevenue.com.br'}`,
            `Path=${config.path || '/'}`,
            `Max-Age=${config.maxAge || 31536000}`,
            `SameSite=${config.sameSite || 'Lax'}`,
            config.secure !== false ? 'Secure' : ''
          ].filter(Boolean).join('; ');
          
          document.cookie = cookieString;
        } catch (error) {
          console.error('❌ [Landing] Erro ao salvar cookie:', key, error);
        }
      },
      
      removeItem: (key) => {
        try {
          const config = window.FluxConfig?.flux?.cookieOptions || {};
          document.cookie = `${key}=; Domain=${config.domain}; Path=${config.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        } catch (error) {
          console.error('❌ [Landing] Erro ao remover cookie:', key, error);
        }
      }
    };
  }

  function initializeSupabase() {
    if (window.supabase && typeof window.supabase.auth?.signInWithPassword === 'function') {
      console.log('✅ [Landing] Usando instância Supabase existente');
      return;
    }

    if (!window.FluxConfig) {
      setTimeout(initializeSupabase, 200);
      return;
    }

    const globalSupabase = window.Supabase || window.supabase;
    if (!globalSupabase?.createClient) {
      setTimeout(initializeSupabase, 200);
      return;
    }

    try {
      const { createClient } = globalSupabase;
      const { url, anonKey } = window.FluxConfig.supabase;
      
      const supabaseClient = createClient(url, anonKey, {
        auth: {
          storage: createCookieStorage(),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: 'pkce'
        }
      });

      window.supabase = supabaseClient;
      console.log('✅ [Landing] Supabase inicializado para landing page');

      // ✅ Função de login específica para landing
      window.fluxLogin = async (email, password) => {
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) throw error;
          
          console.log('✅ [Landing] Login realizado, redirecionando...');
          
          // ✅ Redirecionamento para app após login
          setTimeout(() => {
            window.location.href = 'https://app.fluxrevenue.com.br';
          }, 500);
          
          return { success: true, data };
        } catch (error) {
          console.error('❌ [Landing] Erro no login:', error);
          return { success: false, error };
        }
      };

    } catch (error) {
      console.error('❌ [Landing] Erro inicialização:', error);
    }
  }

  initializeSupabase();
})();
