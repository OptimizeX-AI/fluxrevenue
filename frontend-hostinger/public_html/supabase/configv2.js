// public/supabase/configv2.js - UNIVERSAL VERSION (Landing + App)

(function() {
  'use strict';

  // Detectar contexto automaticamente
  const isApp = window.location.pathname.includes('/app/') || window.location.hostname.includes('app.');
  const context = isApp ? 'app' : 'landing';
  
  console.log(`🔄 [Flux ${context}] Carregando configv2.js...`);

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

  // ✅ redirectToLogin adaptativo para landing/app
  let redirectInProgress = false;
  window.redirectToLogin = function(reason = 'auth_required') {
    if (redirectInProgress) {
      console.log(`🔄 [Flux ${context}] Redirect já em andamento...`);
      return;
    }
    
    redirectInProgress = true;
    console.log(`🔄 [Flux ${context}] redirectToLogin executada:`, reason);
    
    if (window.fluxAuthTimer) {
      clearTimeout(window.fluxAuthTimer);
    }
    
    setTimeout(() => {
      if (isApp) {
        // Se está no app, redirecionar para login
        window.location.href = FLUX_CONFIG.app.loginUrl;
      } else if (window.location.pathname !== '/login.html') {
        // Se está na landing, redirecionar para login
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

  // ✅ FUNÇÃO DE REDIRECIONAMENTO PÓS-LOGIN ADAPTATIVA
  window.redirectToApp = function(delay = 500) {
    console.log(`🚀 [Flux ${context}] Redirecionando para dashboard...`);
    setTimeout(() => {
      if (!isApp) {
        window.location.href = FLUX_CONFIG.app.url;
      } else {
        // Se já está no app, apenas recarregar para garantir estado limpo
        window.location.reload();
      }
    }, delay);
  };

  // ✅ CONFIGURAÇÃO GLOBAL ADAPTATIVA
  window.FluxConfig = { 
    supabase: SUPABASE_CONFIG, 
    flux: FLUX_CONFIG, 
    app: FLUX_CONFIG.app,
    redirectToLogin: window.redirectToLogin,
    redirectToApp: window.redirectToApp,
    initialized: true,
    version: '2.0.2',
    context: context, // ✅ Contexto detectado dinamicamente
    isApp: isApp
  };
  
  console.log(`✅ [Flux ${context}] ConfigV2 carregado - versão`, window.FluxConfig.version);
  
  // ✅ Event adaptativo para contexto
  window.dispatchEvent(new CustomEvent(`flux-config-${context}-ready`, {
    detail: { context: context, version: '2.0.2', isApp: isApp }
  }));

})();
