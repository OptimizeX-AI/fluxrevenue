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
  try {
    // --- Validação manual do JWT ---
    const authHeader = req1.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token de autorização não fornecido');
    }
    const token = authHeader.replace('Bearer ', '');
    let userId, payload;
    try {
      payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.sub) throw new Error('Token inválido');
      userId = payload.sub;
    } catch (error) {
      throw new Error('Token inválido');
    }
    // --- Recebe dados do site ---
    const { url, monthly_pageviews, current_rpm } = await req1.json();
    if (!url || !monthly_pageviews || !current_rpm) {
      throw new Error('URL, pageviews mensais e RPM atual são obrigatórios');
    }
    // --- Gera IDs únicos ---
    const siteId = `site_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const optimization_token = `flux_${userId.substring(0, 8)}_${crypto.randomUUID()}`;
    const target_rpm = current_rpm * 1.37;
    // --- Usa Service Role Key para inserir ---
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: newSite, error: insertError } = await supabaseAdmin.from('sites').insert({
      id: siteId,
      client_id: userId,
      url: url,
      monthly_pageviews: monthly_pageviews,
      current_rpm: current_rpm,
      target_rpm: target_rpm,
      optimization_token: optimization_token,
      script_installed: false,
      created_at: new Date().toISOString()
    }).select().single();
    if (insertError) {
      throw new Error(`Erro ao criar site: ${insertError.message}`);
    }
    return new Response(JSON.stringify(newSite), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 201
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
