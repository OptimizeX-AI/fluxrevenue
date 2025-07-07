// src/lib/supabaseClient.ts - ENTERPRISE GRADE CLIENT CORRIGIDO

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';
import type { Database } from '../types/database';

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

// === CONFIGURAÇÃO ENTERPRISE ===
const getConfig = (): FluxSupabaseConfig => {
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
  const isStaging = window.location.hostname.includes('staging') || window.location.hostname.includes('dev');
  
  return {
    url: 'https://cykfgwzzvlnkqundyxrq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2Znd3p6dmxua3F1bmR5eHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTk4NDEsImV4cCI6MjA2NTM5NTg0MX0.WRUOjlQfcxLsbu5JuF_7LbCOsY3cuTZwdCAkdiOQXPg',
    environment: isDevelopment ? 'development' : isStaging ? 'staging' : 'production',
    debug: isDevelopment,
    retryAttempts: 3,
    retryDelay: 1000,
    cookieDomain: isDevelopment ? 'localhost' : '.fluxrevenue.com.br'
  };
};

// === STORAGE CUSTOMIZADO CROSS-DOMAIN ===
const createCustomStorage = (): CustomStorage => {
  const config = getConfig();
  
  return {
    getItem: (key: string): string | null => {
      try {
        // Tentar localStorage primeiro
        const localValue = localStorage.getItem(key);
        if (localValue) return localValue;
        
        // Fallback para cookies
        const cookie = document.cookie
          .split(';')
          .find(c => c.trim().startsWith(`${key}=`));
        
        if (cookie) {
          return decodeURIComponent(cookie.split('=')[1]);
        }
        
        return null;
      } catch (error) {
        console.warn(`⚠️ Erro ao ler storage [${key}]:`, error);
        return null;
      }
    },

    setItem: (key: string, value: string): void => {
      try {
        // Salvar no localStorage
        localStorage.setItem(key, value);
        
        // Salvar no cookie para cross-domain
        const maxAge = 365 * 24 * 60 * 60; // 1 ano
        const secure = window.location.protocol === 'https:';
        const domain = config.cookieDomain;
        
        document.cookie = `${key}=${encodeURIComponent(value)}; Domain=${domain}; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secure ? 'Secure' : ''}`;
        
        if (config.debug) {
          console.log(`✅ Storage salvo [${key}] domain=${domain}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao salvar storage [${key}]:`, error);
      }
    },

    removeItem: (key: string): void => {
      try {
        // Remover do localStorage
        localStorage.removeItem(key);
        
        // Remover do cookie
        const domain = config.cookieDomain;
        document.cookie = `${key}=; Domain=${domain}; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        
        if (config.debug) {
          console.log(`🗑️ Storage removido [${key}]`);
        }
      } catch (error) {
        console.error(`❌ Erro ao remover storage [${key}]:`, error);
      }
    }
  };
};

// === HEALTH CHECK SISTEMA ===
class SupabaseHealthMonitor {
  private health: ConnectionHealth = {
    isConnected: false,
    lastCheck: 0,
    errorCount: 0,
    latency: 0
  };

  async checkHealth(client: SupabaseClient): Promise<ConnectionHealth> {
    const startTime = performance.now();
    
    try {
      const { error } = await client.from('clients').select('id').limit(1);
      const latency = performance.now() - startTime;
      
      this.health = {
        isConnected: !error,
        lastCheck: Date.now(),
        errorCount: error ? this.health.errorCount + 1 : 0,
        latency
      };
      
      if (error) {
        console.warn('⚠️ Supabase health check failed:', error);
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
      this.health = {
        isConnected: false,
        lastCheck: Date.now(),
        errorCount: this.health.errorCount + 1,
        latency: 0
      };
    }
    
    return this.health;
  }

  getHealth(): ConnectionHealth {
    return this.health;
  }
}

// === RETRY LOGIC ENTERPRISE ===
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Tentativa ${attempt}/${maxAttempts} falhou:`, error);
      
      if (attempt === maxAttempts) break;
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError || new Error('Operação falhou após múltiplas tentativas');
};

// === BROWSER CAPABILITIES ===
const checkBrowserCapabilities = () => {
  const capabilities = {
    localStorage: false,
    sessionStorage: false,
    cookies: false,
    indexedDB: false,
    webAssembly: false
  };

  try {
    capabilities.localStorage = typeof localStorage !== 'undefined';
    capabilities.sessionStorage = typeof sessionStorage !== 'undefined';
    capabilities.cookies = navigator.cookieEnabled;
    capabilities.indexedDB = typeof indexedDB !== 'undefined';
    capabilities.webAssembly = typeof WebAssembly !== 'undefined';
  } catch (error) {
    console.warn('⚠️ Erro verificando capabilities:', error);
  }

  return capabilities;
};

// === SINGLETON CLIENT ===
let supabaseInstance: SupabaseClient<Database> | null = null;
let healthMonitor: SupabaseHealthMonitor | null = null;

const createSupabaseClient = (): SupabaseClient<Database> => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const config = getConfig();
  const capabilities = checkBrowserCapabilities();
  
  if (config.debug) {
    console.log('🔧 Inicializando Supabase Client:', {
      environment: config.environment,
      capabilities,
      domain: config.cookieDomain
    });
  }

  // ✅ CORREÇÃO: Syntax error corrigido
  const client = createBrowserClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: `sb-flux-session`, // PADRONIZADO
      autoRefreshToken: true,
      flowType: 'pkce',
      debug: config.debug,
      storage: createCustomStorage()
    },
    global: {
      headers: {
        'X-Client-Info': 'flux-revenue-dashboard',
        'X-Client-Version': '2.0.0',
        'X-Environment': config.environment
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  // Initialize health monitor
  healthMonitor = new SupabaseHealthMonitor();
  
  // Health check inicial
  setTimeout(() => {
    healthMonitor?.checkHealth(client);
  }, 2000);

  // Health check periódico (5 minutos)
  setInterval(() => {
    healthMonitor?.checkHealth(client);
  }, 5 * 60 * 1000);

  supabaseInstance = client;
  
  if (config.debug) {
    console.log('✅ Supabase Client inicializado com sucesso');
  }

  return client;
};

// === QUERY HELPERS ENTERPRISE ===
export const createQuery = <T>(queryFn: () => Promise<T>) => {
  return withRetry(queryFn, getConfig().retryAttempts, getConfig().retryDelay);
};

export const getConnectionHealth = (): ConnectionHealth | null => {
  return healthMonitor?.getHealth() || null;
};

export const refreshHealthCheck = async (): Promise<ConnectionHealth | null> => {
  if (!healthMonitor || !supabaseInstance) return null;
  return await healthMonitor.checkHealth(supabaseInstance);
};

// === EXPORTS ===
export const supabase = createSupabaseClient();
export type SupabaseClientType = typeof supabase;
export default supabase;

// Global error handler para Supabase
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('supabase') || event.reason?.message?.includes('postgrest')) {
    console.error('❌ Supabase unhandled error:', event.reason);
    // Incrementar error count se disponível
    if (healthMonitor) {
      const currentHealth = healthMonitor.getHealth();
      currentHealth.errorCount += 1;
    }
  }
});

