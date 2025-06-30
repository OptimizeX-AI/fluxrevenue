import { createBrowserClient } from '@supabase/ssr'

// Variáveis de ambiente injetadas pelo webpack
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

console.log('Initializing Supabase with:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey 
});

// Criar cliente Supabase usando o novo @supabase/ssr
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

if (typeof window !== 'undefined') (globalThis as any).supabase = supabase


