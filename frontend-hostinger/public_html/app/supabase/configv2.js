// public/app/supabase/configv2.js - DASHBOARD VERSION

(function() {
  'use strict';

  console.log('🔄 [Flux App] Carregando configv2.js...');

  const SUPABASE_CONFIG = {
    url: 'https://cykfgwzzvlnkqundyxrq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2Znd3p6dmxua3F1bmR5eHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk4NDEsImV4cCI6MjA2NTM5NTg0MX0.WRUOjlQfcxLsbu5JuF_7LbCOsY3cuTZwdCAkdiOQXPg',
    options: {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
        autoRefreshToken: true,
        storage: null
      }
    }
  };

  const FLUX_CONFIG = {
    domain: '.fluxrevenue.com.br',
    cookieOptions: {
      domain: '.fluxrevenue.com.br',
      secure: window.location.protocol === 'https:',
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    },
    app: {
      url: 'https://app.fluxrevenue.com.br',
      loginUrl: 'https://fluxrevenue.com.br/login.html',
      signupUrl: 'https://fluxrevenue.com.br/signup.html'
    }
  };

  // ✅ CRÍTICO: redirectToLogin específico para DASHBOARD
  let redirectInProgress = false;
  window.redirectToLogin = function(reason = 'auth_required') {
    if (redirectInProgress) {
      console.log('🔄 [Flux App] Redirect já em andamento, ignorando...');
      return;
    }
    
    redirectInProgress = true;
    console.log('🔄 [Flux App] redirectToLogin executada:', reason);
    
    if (window.fluxAuthTimer) {
      clearTimeout(window.fluxAuthTimer);
    }
    
    // ✅ Dashboard redireciona para landing login
    setTimeout(() => {
      window.location.href = FLUX_CONFIG.app.loginUrl;
    }, 100);
  };

  // ✅ CONFIGURAÇÃO GLOBAL COM CONTEXTO
  window.FluxConfig = { 
    supabase: SUPABASE_CONFIG, 
    flux: FLUX_CONFIG,
    app: FLUX_CONFIG.app,
    redirectToLogin: window.redirectToLogin,
    initialized: true,
    version: '2.0.1',
    context: 'dashboard' // ✅ Identificador de contexto
  };
  
  console.log('✅ [Flux App] ConfigV2 carregado - versão', window.FluxConfig.version);
  
  // ✅ Event específico para dashboard
  window.dispatchEvent(new CustomEvent('flux-config-app-ready', {
    detail: { context: 'dashboard', version: '2.0.1' }
  }));

})();
