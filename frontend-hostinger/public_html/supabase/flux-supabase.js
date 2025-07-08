// public/supabase/flux-supabase.js - UNIVERSAL VERSION (Landing + App)

(function() {
  'use strict';
  
  // Detectar contexto automaticamente
  const isApp = window.location.pathname.includes('/app/') || window.location.hostname.includes('app.');
  const context = isApp ? 'app' : 'landing';
  
  // ✅ CRÍTICO: Prevenir múltiplas inicializações
  if (window.fluxSupabaseInitialized) {
    console.log(`🔄 [Flux ${context}] flux-supabase já inicializado`);
    return;
  }
  window.fluxSupabaseInitialized = true;

  console.log(`🔄 [Flux ${context}] Inicializando flux-supabase...`);

  function createCookieStorage() {
    return {
      getItem: (key) => {
        try {
          const cookie = document.cookie
            .split(';')
            .find(c => c.trim().startsWith(`${key}=`));
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
        } catch (error) {
          console.error(`❌ [${context}] Erro ao ler cookie:`, key, error);
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
          console.error(`❌ [${context}] Erro ao salvar cookie:`, key, error);
        }
      },
      
      removeItem: (key) => {
        try {
          const config = window.FluxConfig?.flux?.cookieOptions || {};
          document.cookie = `${key}=; Domain=${config.domain}; Path=${config.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        } catch (error) {
          console.error(`❌ [${context}] Erro ao remover cookie:`, key, error);
        }
      }
    };
  }

  function initializeSupabase() {
    if (window.supabase && typeof window.supabase.auth?.signInWithPassword === 'function') {
      console.log(`✅ [${context}] Usando instância Supabase existente`);
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
      console.log(`✅ [${context}] Supabase inicializado com sucesso`);

      // ✅ Função de login adaptativa
      window.fluxLogin = async (email, password) => {
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) throw error;
          
          console.log(`✅ [${context}] Login realizado com sucesso`);
          
          // ✅ Redirecionamento adaptativo
          if (!isApp) {
            console.log(`🚀 [${context}] Redirecionando para app...`);
            setTimeout(() => {
              window.location.href = 'https://app.fluxrevenue.com.br';
            }, 500);
          } else {
            console.log(`✅ [${context}] Usuário logado no app`);
            // Se já está no app, apenas emitir evento para atualizar estado
            window.dispatchEvent(new CustomEvent('flux-auth-success', {
              detail: { user: data.user, session: data.session }
            }));
          }
          
          return { success: true, data };
        } catch (error) {
          console.error(`❌ [${context}] Erro no login:`, error);
          return { success: false, error };
        }
      };

    } catch (error) {
      console.error(`❌ [${context}] Erro na inicialização:`, error);
    }
  }

  initializeSupabase();
})();
