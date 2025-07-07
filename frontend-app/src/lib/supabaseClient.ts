// src/lib/supabaseClient.ts - ENTERPRISE GRADE CLIENT CORRIGIDO E REFAVORADO

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';
import type { Database } from '../types/database'; // Presume que este tipo existe e está correto

// === TIPOS ENTERPRISE ===
interface FluxSupabaseConfig {
  url: string;
  anonKey: string;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
  retryAttempts: number;
  retryDelay: number;
  cookieDomain: string;
}

interface CustomStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface ConnectionHealth {
  isConnected: boolean;
  lastCheck: number;
  errorCount: number;
  latency: number;
}

// === CONFIGURAÇÃO ENTERPRISE - REFAVORADA PARA USAR ENV VARS ===
const getConfig = (): FluxSupabaseConfig => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error("❌ REACT_APP_SUPABASE_URL não está definida nas variáveis de ambiente!");
    throw new Error("Supabase URL não configurada. Verifique seu arquivo .env ou configurações de ambiente.");
  }
  if (!supabaseAnonKey) {
    console.error("❌ REACT_APP_SUPABASE_ANON_KEY não está definida nas variáveis de ambiente!");
    throw new Error("Supabase Anon Key não configurada. Verifique seu arquivo .env ou configurações de ambiente.");
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  // A lógica para staging pode precisar ser ajustada se não houver uma variável de ambiente específica para isso.
  // Por enquanto, vamos assumir que qualquer coisa que não seja 'development' é 'production' para o cookieDomain.
  const isStaging = window.location.hostname.includes('staging') || window.location.hostname.includes('dev');

  let environment: 'development' | 'staging' | 'production';
  if (isDevelopment) {
    environment = 'development';
  } else if (isStaging) {
    environment = 'staging';
  } else {
    environment = 'production';
  }
  
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    environment: environment,
    debug: isDevelopment, // Habilitar debug apenas em desenvolvimento
    retryAttempts: 3,
    retryDelay: 1000,
    // Ajuste para cookieDomain: localhost para desenvolvimento, .fluxrevenue.com.br para outros.
    cookieDomain: isDevelopment ? 'localhost' : '.fluxrevenue.com.br'
  };
};

// === STORAGE CUSTOMIZADO CROSS-DOMAIN (Mantido como estava, mas usará config atualizada) ===
const createCustomStorage = (): CustomStorage => {
  const config = getConfig(); // getConfig agora lê de process.env
  
  return {
    getItem: (key: string): string | null => {
      try {
        const localValue = localStorage.getItem(key);
        if (localValue) return localValue;
        
        const cookie = document.cookie.split(';').find(c => c.trim().startsWith(`${key}=`));
        if (cookie) return decodeURIComponent(cookie.split('=')[1]);
        
        return null;
      } catch (error) {
        console.warn(`⚠️ Erro ao ler storage [${key}]:`, error);
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        localStorage.setItem(key, value);
        const maxAge = 365 * 24 * 60 * 60; // 1 ano
        const secure = window.location.protocol === 'https:';
        const domain = config.cookieDomain;
        document.cookie = `${key}=${encodeURIComponent(value)}; Domain=${domain}; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secure ? 'Secure' : ''}`;
        if (config.debug) console.log(`✅ Storage salvo [${key}] domain=${domain}`);
      } catch (error) { console.error(`❌ Erro ao salvar storage [${key}]:`, error); }
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
        const domain = config.cookieDomain;
        document.cookie = `${key}=; Domain=${domain}; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        if (config.debug) console.log(`🗑️ Storage removido [${key}]`);
      } catch (error) { console.error(`❌ Erro ao remover storage [${key}]:`, error); }
    }
  };
};

// === HEALTH CHECK SISTEMA (Mantido como estava) ===
class SupabaseHealthMonitor {
  private health: ConnectionHealth = { isConnected: false, lastCheck: 0, errorCount: 0, latency: 0 };
  async checkHealth(client: SupabaseClient): Promise<ConnectionHealth> { /* ... (sem mudanças) ... */ const startTime = performance.now(); try { const { error } = await client.from('clients').select('id').limit(1); const latency = performance.now() - startTime; this.health = { isConnected: !error, lastCheck: Date.now(), errorCount: error ? this.health.errorCount + 1 : 0, latency }; if (error) { console.warn('⚠️ Supabase health check failed:', error); } } catch (error) { console.error('❌ Health check error:', error); this.health = { isConnected: false, lastCheck: Date.now(), errorCount: this.health.errorCount + 1, latency: 0 }; } return this.health; }
  getHealth = (): ConnectionHealth => this.health;
}

// === RETRY LOGIC ENTERPRISE (Mantido como estava) ===
const withRetry = async <T>(fn: () => Promise<T>, maxAttempts: number = 3, delay: number = 1000): Promise<T> => { /* ... (sem mudanças) ... */ let lastError: Error | null = null; for (let attempt = 1; attempt <= maxAttempts; attempt++) { try { return await fn(); } catch (error) { lastError = error as Error; console.warn(`⚠️ Tentativa ${attempt}/${maxAttempts} falhou:`, error); if (attempt === maxAttempts) break; const waitTime = delay * Math.pow(2, attempt - 1); await new Promise(resolve => setTimeout(resolve, waitTime)); } } throw lastError || new Error('Operação falhou após múltiplas tentativas'); };

// === BROWSER CAPABILITIES (Mantido como estava) ===
const checkBrowserCapabilities = () => { /* ... (sem mudanças) ... */ const capabilities = { localStorage: false, sessionStorage: false, cookies: false, indexedDB: false, webAssembly: false }; try { capabilities.localStorage = typeof localStorage !== 'undefined'; capabilities.sessionStorage = typeof sessionStorage !== 'undefined'; capabilities.cookies = navigator.cookieEnabled; capabilities.indexedDB = typeof indexedDB !== 'undefined'; capabilities.webAssembly = typeof WebAssembly !== 'undefined'; } catch (error) { console.warn('⚠️ Erro verificando capabilities:', error); } return capabilities; };

// === SINGLETON CLIENT ===
let supabaseInstance: SupabaseClient<Database> | null = null;
let healthMonitor: SupabaseHealthMonitor | null = null;

const createSupabaseClientOnce = (): SupabaseClient<Database> => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const config = getConfig(); // Agora lê de process.env
  const capabilities = checkBrowserCapabilities();
  
  if (config.debug) {
    console.log('🔧 Inicializando Supabase Client:', {
      environment: config.environment,
      url: config.url, // Logar a URL usada
      capabilities,
      domain: config.cookieDomain
    });
  }

  const client = createBrowserClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true, // Importante para fluxos OAuth e PKCE
      storageKey: `sb-flux-session`, // Padronizado anteriormente
      autoRefreshToken: true,
      flowType: 'pkce',
      debug: config.debug,
      storage: createCustomStorage()
    },
    global: {
      headers: {
        'X-Client-Info': 'flux-revenue-dashboard',
        'X-Client-Version': '2.0.1', // Version bump
        'X-Environment': config.environment
      }
    },
    realtime: { params: { eventsPerSecond: 10 } }
  });

  healthMonitor = new SupabaseHealthMonitor();
  setTimeout(() => { healthMonitor?.checkHealth(client); }, 2000);
  setInterval(() => { healthMonitor?.checkHealth(client); }, 5 * 60 * 1000);

  supabaseInstance = client;
  if (config.debug) {
    console.log('✅ Supabase Client inicializado com sucesso usando variáveis de ambiente.');
  }
  return client;
};

// === QUERY HELPERS ENTERPRISE (Mantidos como estavam) ===
export const createQuery = <T>(queryFn: () => Promise<T>) => { /* ... (sem mudanças) ... */ return withRetry(queryFn, getConfig().retryAttempts, getConfig().retryDelay); };
export const getConnectionHealth = (): ConnectionHealth | null => { /* ... (sem mudanças) ... */ return healthMonitor?.getHealth() || null; };
export const refreshHealthCheck = async (): Promise<ConnectionHealth | null> => { /* ... (sem mudanças) ... */ if (!healthMonitor || !supabaseInstance) return null; return await healthMonitor.checkHealth(supabaseInstance); };

// === EXPORTS ===
export const supabase = createSupabaseClientOnce();
export type SupabaseClientType = typeof supabase;
// export default supabase; // Removido para consistência, usar export nomeado

// Global error handler (Mantido como estava)
window.addEventListener('unhandledrejection', (event) => { /* ... (sem mudanças) ... */ if (event.reason?.message?.includes('supabase') || event.reason?.message?.includes('postgrest')) { console.error('❌ Supabase unhandled error:', event.reason); if (healthMonitor) { const currentHealth = healthMonitor.getHealth(); currentHealth.errorCount += 1; } } });
