import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
// Headers CORS
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
// Função para buscar otimizações ativas
async function getActiveOptimizations(siteId, supabase) {
  try {
    console.log('Fetching optimizations for site:', siteId);
    const { data: configs, error } = await supabase.from('optimizer_configs').select('*').eq('site_id', siteId).eq('is_active', true);
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    console.log('Found configurations:', configs?.length || 0);
    return configs || [];
  } catch (error) {
    console.error('Error fetching optimizations:', error);
    return [];
  }
}
// Função para gerar script otimizado
function generateOptimizedScript(configs) {
  console.log('Generating script for configs:', configs.length);
  let script = `// Flux Revenue - Optimization Script\n`;
  script += `// Generated: ${new Date().toISOString()}\n`;
  script += `// Site optimizations: ${configs.length} active\n\n`;
  if (configs.length === 0) {
    script += `console.log('Flux Revenue: No active optimizations found');\n`;
    return script;
  }
  configs.forEach((config, index)=>{
    script += `// ${config.config_name.toUpperCase()} OPTIMIZATION (${index + 1}/${configs.length})\n`;
    if (config.config && config.config.code) {
      script += config.config.code + '\n\n';
    } else {
      script += `console.log('Flux Revenue: ${config.config_name} optimization loaded');\n\n`;
    }
  });
  script += `// Flux Revenue optimization script completed\n`;
  script += `console.log('Flux Revenue: ${configs.length} optimizations applied successfully');\n`;
  return script;
}
// Função principal da Edge Function
Deno.serve(async (req1)=>{
  // Handle CORS preflight
  if (req1.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  const startTime = Date.now();
  try {
    console.log('Script generation request started:', {
      method: req1.method,
      url: req1.url,
      timestamp: new Date().toISOString()
    });
    // Validar método HTTP
    if (req1.method !== 'GET') {
      throw new Error('Method not allowed. Use GET.');
    }
    // Extrair parâmetros da URL
    const url = new URL(req1.url);
    const siteId = url.searchParams.get('site');
    const version = url.searchParams.get('v') || 'latest';
    if (!siteId) {
      throw new Error('Parameter "site" is required');
    }
    console.log('Processing request for site:', siteId);
    // Inicializar cliente Supabase
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Buscar configurações ativas
    const configs = await getActiveOptimizations(siteId, supabase);
    // Gerar script otimizado
    const optimizedScript = generateOptimizedScript(configs);
    const processingTime = Date.now() - startTime;
    console.log('Script generated successfully:', {
      siteId,
      configsCount: configs.length,
      scriptLength: optimizedScript.length,
      processingTime
    });
    // Retornar script com headers apropriados
    return new Response(optimizedScript, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Flux-Version': version,
        'X-Flux-Configs': configs.length.toString(),
        'X-Flux-Processing-Time': processingTime.toString()
      }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Script generation failed:', {
      error: error.message,
      stack: error.stack,
      processingTime
    });
    // Retornar script de erro
    const errorScript = `// Flux Revenue - Error\n// ${error.message}\nconsole.error('Flux Revenue Error: ${error.message}');`;
    return new Response(errorScript, {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript; charset=utf-8',
        'X-Flux-Error': error.message
      }
    });
  }
});
