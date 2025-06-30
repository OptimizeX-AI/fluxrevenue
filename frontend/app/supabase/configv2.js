// public/app/supabase/configv2.js

// Core Supabase credentials and options
const SUPABASE_CONFIG = {
  url: 'https://cykfgwzzvlnkqundyxrq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2Znd3p6dmxua3F1bmR5eHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk4NDEsImV4cCI6MjA2NTM5NTg0MX0.WRUOjlQfcxLsbu5JuF_7LbCOsY3cuTZwdCAkdiOQXPg',
  options: {
    auth: {
      // persistSession and URL-session detection
      persistSession: true,
      detectSessionInUrl: true,
      // Use localStorage here only for non-SSR fallback
      storage: window.localStorage,
      storageKey: 'sb-flux-session'
    }
  }
};

const FLUX_CONFIG = {
  domain: '.fluxrevenue.com.br',
  cookieOptions: {
    domain: '.fluxrevenue.com.br',
    secure: true,
    sameSite: 'Lax',
    path: '/'
  }
};

// Expose config globally for any consumer
window.FluxConfig = { supabase: SUPABASE_CONFIG, flux: FLUX_CONFIG, initialized: true };
console.log('✅ [Flux] Configuração carregada com sucesso');
