// public/supabase/configv2.js - LANDING PAGE VERSION

(function() {
  'use strict';

  console.log('🔄 [Flux Landing] Carregando configv2.js...');

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

  // ✅ CRÍTICO: redirectToLogin específico para LANDING
  let redirectInProgress = false;
  window.redirectToLogin = function(reason = 'auth_required') {
    if (redirectInProgress) {
      console.log('🔄 [Flux Landing] Redirect já em andamento...');
      return;
    }
    
    redirectInProgress = true;
    console.log('🔄 [Flux Landing] redirectToLogin executada:', reason);
    
    if (window.fluxAuthTimer) {
      clearTimeout(window.fluxAuthTimer);
    }
    
    // ✅ Landing apenas foca no formulário de login
    setTimeout(() => {
      if (window.location.pathname !== '/login.html') {
        window.location.href = FLUX_CONFIG.app.loginUrl;
      } else {
        // Se já está na página de login, apenas focar no campo
        const emailInput = document.querySelector('#email, [name="email"], input[type="email"]');
        if (emailInput) {
          emailInput.focus();
        }
      }
    }, 100);
  };

  // ✅ FUNÇÃO DE REDIRECIONAMENTO PÓS-LOGIN ESPECÍFICA
  window.redirectToApp = function(delay = 500) {
    console.log('🚀 [Flux Landing] Redirecionando para dashboard...');
    setTimeout(() => {
      window.location.href = FLUX_CONFIG.app.url;
    }, delay);
  };

  // ✅ CONFIGURAÇÃO GLOBAL COM CONTEXTO
  window.FluxConfig = { 
    supabase: SUPABASE_CONFIG, 
    flux: FLUX_CONFIG, 
    app: FLUX_CONFIG.app,
    redirectToLogin: window.redirectToLogin,
    redirectToApp: window.redirectToApp, // ✅ Função específica da landing
    initialized: true,
    version: '2.0.1',
    context: 'landing' // ✅ Identificador de contexto
  };
  
  console.log('✅ [Flux Landing] ConfigV2 carregado - versão', window.FluxConfig.version);
  
  // ✅ Event específico para landing
  window.dispatchEvent(new CustomEvent('flux-config-landing-ready', {
    detail: { context: 'landing', version: '2.0.1' }
  }));

})();
