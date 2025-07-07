import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
Deno.serve(async (req)=>{
  // CORS dinâmico seguro para produção
  const allowedOrigins = [
    "https://fluxrevenue.com.br",
    "https://app.fluxrevenue.com.br"
  ];
  const origin = req.headers.get("origin") ?? "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400"
  };
  // Trata a requisição OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200
    });
  }
  try {
    console.log('1. Iniciando check-trial-status');
    // CORREÇÃO AQUI:
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token de autorização não fornecido');
    }
    const token = authHeader.replace('Bearer ', '');
    console.log('2. Token extraído');
    // ✅ VALIDAÇÃO JWT MELHORADA
    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new Error('Token expirado');
      }
      if (!payload.sub) {
        throw new Error('Token inválido - sem subject');
      }
      userId = payload.sub;
      console.log('Payload JWT:', payload);
      console.log('3. Token validado manualmente, userId:', userId);
    } catch (error) {
      throw new Error(`Token inválido: ${error.message}`);
    }
    // ✅ BUSCAR CLIENTE COM SERVICE_ROLE_KEY
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    console.log('4. Buscando cliente na tabela');
    const { data: client, error: clientError } = await supabaseAdmin.from('clients').select('*').eq('id', userId).single();
    if (clientError) {
      console.error('5. Erro ao buscar cliente:', clientError);
      throw new Error(`Cliente não encontrado: ${clientError.message}`);
    }
    if (!client) {
      throw new Error('Cliente não existe na tabela');
    }
    console.log('6. Cliente encontrado:', client.email);
    // ✅ VERIFICAR E CORRIGIR TRIAL_END_DATE
    if (!client.trial_end_date) {
      console.log('7. trial_end_date não existe, criando...');
      const trialStart = client.trial_start_date ? new Date(client.trial_start_date) : new Date(client.created_at);
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 7);
      const { error: updateError } = await supabaseAdmin.from('clients').update({
        trial_end_date: trialEnd.toISOString(),
        trial_start_date: trialStart.toISOString()
      }).eq('id', userId);
      if (updateError) {
        console.error('Erro ao atualizar trial dates:', updateError);
      } else {
        client.trial_end_date = trialEnd.toISOString();
        client.trial_start_date = trialStart.toISOString();
      }
    }
    // ✅ CALCULAR STATUS DO TRIAL COM MELHOR PRECISÃO
    const now = new Date();
    const trialEnd = new Date(client.trial_end_date);
    const timeDiff = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    console.log('8. Calculando status do trial');
    const trialStatus = {
      subscription_status: client.subscription_status || 'trial',
      trial_active: (client.subscription_status === 'trial' || !client.subscription_status) && now < trialEnd,
      trial_expired: (client.subscription_status === 'trial' || !client.subscription_status) && now >= trialEnd,
      days_remaining: Math.max(0, daysRemaining),
      hours_remaining: Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60))),
      trial_end_date: client.trial_end_date,
      trial_start_date: client.trial_start_date,
      company: client.company,
      user_id: userId,
      checked_at: new Date().toISOString()
    };
    // ✅ ATUALIZAR STATUS SE TRIAL EXPIROU
    if (trialStatus.trial_expired && (client.subscription_status === 'trial' || !client.subscription_status)) {
      console.log('9. Atualizando status para expirado');
      const { error: expireError } = await supabaseAdmin.from('clients').update({
        subscription_status: 'expired'
      }).eq('id', userId);
      if (!expireError) {
        trialStatus.subscription_status = 'expired';
      }
    }
    console.log('10. Retornando status:', JSON.stringify(trialStatus, null, 2));
    return new Response(JSON.stringify(trialStatus), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erro na função check-trial-status:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.toString(),
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
