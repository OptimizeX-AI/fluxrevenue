// /supabase/functions/receive-metrics/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// O conteúdo do 'cors.ts' foi movido para cá
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
  // Trata a requisição OPTIONS para CORS
  if (req1.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // 1. Inicializa o cliente do Supabase
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // 2. Extrai os dados enviados
    const metrics = await req1.json();
    const { site_id, pageviews, impressions, clicks, revenue } = metrics;
    // 3. Validação básica
    if (!site_id || pageviews === undefined) {
      return new Response(JSON.stringify({
        error: 'Dados de métrica incompletos.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // 4. Verifica se o site existe
    const { data: siteData, error: siteError } = await supabaseAdmin.from('sites').select('id').eq('id', site_id).single();
    if (siteError || !siteData) {
      return new Response(JSON.stringify({
        error: 'Site não encontrado.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 404
      });
    }
    // 5. Calcula as métricas derivadas (CTR e RPM)
    const ctr = impressions > 0 ? clicks / impressions * 100 : 0;
    const rpm = pageviews > 0 ? revenue / pageviews * 1000 : 0;
    // 6. Insere os novos dados na tabela 'metrics'
    const { error: insertError } = await supabaseAdmin.from('metrics').insert({
      site_id,
      pageviews,
      impressions,
      clicks,
      revenue,
      ctr,
      rpm
    });
    if (insertError) {
      throw insertError;
    }
    // 7. Retorna uma resposta de sucesso
    return new Response(JSON.stringify({
      status: 'success',
      rpm: rpm,
      ctr: ctr
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    // Retorna uma resposta de erro genérica
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
