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
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isStaging = hostname.includes('staging') || hostname.includes('dev');

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
    cookieDomain: isDevelopment ? 'localhost' : '.fluxrevenue.com.br'
  };
};

// === STORAGE CUSTOMIZADO CROSS-DOMAIN (Mantido como estava, mas usará config atualizada) ===
const createCustomStorage = (): CustomStorage => {
  const config = getConfig();
  
  return {
    getItem: (key: string): string | null => {
      try {
        const localValue = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        if (localValue) return localValue;
        
        if (typeof document !== 'undefined') {
            const cookie = document.cookie.split(';').find(c => c.trim().startsWith(`${key}=`));
            if (cookie) return decodeURIComponent(cookie.split('=')[1]);
        }
        return null;
      } catch (error) {
        console.warn(`⚠️ Erro ao ler storage [${key}]:`, error);
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, value);
        }
        if (typeof document !== 'undefined') {
            const maxAge = 365 * 24 * 60 * 60;
            const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const domain = config.cookieDomain;
            document.cookie = `${key}=${encodeURIComponent(value)}; Domain=${domain}; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secure ? 'Secure' : ''}`;
            if (config.debug) console.log(`✅ Storage salvo [${key}] domain=${domain}`);
        }
      } catch (error) { console.error(`❌ Erro ao salvar storage [${key}]:`, error); }
    },
    removeItem: (key: string): void => {
      try {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
        }
        if (typeof document !== 'undefined') {
            const domain = config.cookieDomain;
            document.cookie = `${key}=; Domain=${domain}; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            if (config.debug) console.log(`🗑️ Storage removido [${key}]`);
        }
      } catch (error) { console.error(`❌ Erro ao remover storage [${key}]:`, error); }
    }
  };
};

// === HEALTH CHECK SISTEMA (Mantido como estava) ===
class SupabaseHealthMonitor {
  private health: ConnectionHealth = { isConnected: false, lastCheck: 0, errorCount: 0, latency: 0 };
  async checkHealth(client: SupabaseClient): Promise<ConnectionHealth> {  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now(); try { const { error } = await client.from('clients').select('id', {count: 'exact', head: true}).limit(1); const latency = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime; this.health = { isConnected: !error, lastCheck: Date.now(), errorCount: error ? this.health.errorCount + 1 : 0, latency }; if (error) { console.warn('⚠️ Supabase health check failed:', error); } } catch (error) { console.error('❌ Health check error:', error); this.health = { isConnected: false, lastCheck: Date.now(), errorCount: this.health.errorCount + 1, latency: 0 }; } return this.health; }
  getHealth = (): ConnectionHealth => this.health;
}

// === RETRY LOGIC ENTERPRISE (Mantido como estava) ===
const withRetry = async <T>(fn: () => Promise<T>, maxAttempts: number = 3, delay: number = 1000): Promise<T> => {  let lastError: Error | null = null; for (let attempt = 1; attempt <= maxAttempts; attempt++) { try { return await fn(); } catch (error) { lastError = error as Error; console.warn(`⚠️ Tentativa ${attempt}/${maxAttempts} falhou:`, error); if (attempt === maxAttempts) break; const waitTime = delay * Math.pow(2, attempt - 1); await new Promise(resolve => setTimeout(resolve, waitTime)); } } throw lastError || new Error('Operação falhou após múltiplas tentativas'); };

// === BROWSER CAPABILITIES (Mantido como estava) ===
const checkBrowserCapabilities = () => {  const capabilities = { localStorage: false, sessionStorage: false, cookies: false, indexedDB: false, webAssembly: false }; try { capabilities.localStorage = typeof localStorage !== 'undefined'; capabilities.sessionStorage = typeof sessionStorage !== 'undefined'; capabilities.cookies = typeof navigator !== 'undefined' && navigator.cookieEnabled; capabilities.indexedDB = typeof indexedDB !== 'undefined'; capabilities.webAssembly = typeof WebAssembly !== 'undefined'; } catch (error) { console.warn('⚠️ Erro verificando capabilities:', error); } return capabilities; };

// === SINGLETON CLIENT ===
let supabaseInstance: SupabaseClient<Database> | null = null;
let healthMonitorInstance: SupabaseHealthMonitor | null = null; // Renomeado para evitar conflito

const createSupabaseClientOnce = (): SupabaseClient<Database> => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const config = getConfig();
  const capabilities = checkBrowserCapabilities();
  
  if (config.debug) {
    console.log('🔧 Inicializando Supabase Client:', {
      environment: config.environment,
      urlUsed: config.url,
      anonKeyUsed: config.anonKey ? `${config.anonKey.substring(0, 10)}...` : 'N/A', // Logar apenas parte da chave
      capabilities,
      cookieDomain: config.cookieDomain
    });
  }

  const client = createBrowserClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: `sb-flux-session`,
      autoRefreshToken: true,
      flowType: 'pkce',
      debug: config.debug,
      storage: createCustomStorage()
    },
    global: {
      headers: {
        'X-Client-Info': 'flux-revenue-dashboard',
        'X-Client-Version': '2.0.2', // Version bump
        'X-Environment': config.environment
      }
    },
    realtime: { params: { eventsPerSecond: 10 } }
  });

  if (typeof window !== 'undefined') { // Health check só no browser
    healthMonitorInstance = new SupabaseHealthMonitor();
    setTimeout(() => { healthMonitorInstance?.checkHealth(client); }, 2000);
    setInterval(() => { healthMonitorInstance?.checkHealth(client); }, 5 * 60 * 1000);
  }

  supabaseInstance = client;
  if (config.debug) {
    console.log('✅ Supabase Client inicializado com sucesso usando variáveis de ambiente.');
  }
  return client;
};

// === QUERY HELPERS ENTERPRISE (Mantidos como estavam) ===
export const createQuery = <T>(queryFn: () => Promise<T>) => {  return withRetry(queryFn, getConfig().retryAttempts, getConfig().retryDelay); };
export const getConnectionHealth = (): ConnectionHealth | null => {  return healthMonitorInstance?.getHealth() || null; };
export const refreshHealthCheck = async (): Promise<ConnectionHealth | null> => {  if (!healthMonitorInstance || !supabaseInstance) return null; return await healthMonitorInstance.checkHealth(supabaseInstance); };

// === EXPORTS ===
export const supabase = createSupabaseClientOnce();
export type SupabaseClientType = typeof supabase;

// Global error handler (Mantido como estava, mas com verificação de window)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {  if (event.reason?.message?.includes('supabase') || event.reason?.message?.includes('postgrest')) { console.error('❌ Supabase unhandled error:', event.reason); if (healthMonitorInstance) { const currentHealth = healthMonitorInstance.getHealth(); currentHealth.errorCount += 1; } } });
}
