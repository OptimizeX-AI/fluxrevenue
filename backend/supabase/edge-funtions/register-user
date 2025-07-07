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
  // Handle CORS preflight
  if (req1.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { email, password, company } = await req1.json();
    if (!email || !password || !company) {
      throw new Error('Email, senha e empresa são obrigatórios');
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Verificar se usuário já existe
    const { data: existingUser } = await supabase.from('clients').select('email').eq('email', email).single();
    if (existingUser) {
      throw new Error('A user with this email address has already been registered');
    }
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (authError) {
      throw new Error(authError.message);
    }
    // ✅ CALCULAR DATAS DO TRIAL (7 DIAS)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 dias a partir de hoje
    // Criar perfil na tabela clients com dados do trial
    const { data: client, error: clientError } = await supabase.from('clients').insert({
      id: authData.user.id,
      email: email,
      company: company,
      plan: 'trial',
      status: 'active',
      subscription_status: 'trial',
      trial_start_date: trialStartDate.toISOString(),
      trial_end_date: trialEndDate.toISOString()
    }).select().single();
    if (clientError) {
      throw new Error(clientError.message);
    }
    // ✅ RETORNAR DADOS COMPLETOS INCLUINDO INFO DO TRIAL
    return new Response(JSON.stringify({
      user: authData.user,
      client: client,
      trial_info: {
        trial_start: trialStartDate.toISOString(),
        trial_end: trialEndDate.toISOString(),
        days_remaining: 7,
        subscription_status: 'trial'
      }
    }), {
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
