// supabase/functions/health-check/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const allowedOrigins = [
  'https://fluxrevenue.com.br',
  'https://app.fluxrevenue.com.br'
];
const requestOrigin = req.headers.get('origin');
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
Deno.serve(async (req1)=>{
  if (req1.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  const startTime = Date.now();
  const checks = {
    database: false,
    auth: false,
    rls: false,
    timestamp: new Date().toISOString()
  };
  try {
    // Verificar conexão com banco
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Teste 1: Conexão básica
    const { data: dbTest, error: dbError } = await supabase.from('clients').select('count').limit(1);
    checks.database = !dbError;
    // Teste 2: Autenticação
    const { data: authTest, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    checks.auth = !authError;
    // Teste 3: RLS
    const supabaseAnon = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const { error: rlsError } = await supabaseAnon.from('clients').select('id').limit(1);
    // RLS deve bloquear acesso anônimo (erro esperado)
    checks.rls = rlsError?.message?.includes('RLS') || rlsError?.message?.includes('policy');
    const processingTime = Date.now() - startTime;
    const allHealthy = checks.database && checks.auth && checks.rls;
    return new Response(JSON.stringify({
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      processing_time_ms: processingTime,
      version: '1.0.0'
    }), {
      status: allHealthy ? 200 : 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message,
      checks,
      processing_time_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
