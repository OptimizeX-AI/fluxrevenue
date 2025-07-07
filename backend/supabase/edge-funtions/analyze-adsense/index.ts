import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts';
// ===== CONFIGURAÇÕES E CONSTANTES =====
const allowedOrigins = [
  'https://fluxrevenue.com.br',
  'https://app.fluxrevenue.com.br'
];
const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const getCorsHeaders = (req)=>{
  const requestOrigin = req.headers.get('origin');
  return {
    ...baseCorsHeaders,
    'Access-Control-Allow-Origin': allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0]
  };
};
const CACHE_CONFIG = {
  prefix: 'flux_analysis',
  ttl: {
    small_dataset: 86400,
    medium_dataset: 43200,
    large_dataset: 21600
  }
};
const HEALTH_METRICS = {
  performance: {
    target_response_time: 3000,
    alert_threshold: 8000,
    error_rate_threshold: 0.05
  }
};
const BRAZIL_REGIONAL_BENCHMARKS = {
  'br_sp_capital': {
    name: 'São Paulo Capital',
    tier: 1,
    multiplier: 1.0,
    avgCTR: 0.0317,
    avgCPC_USD: 0.85,
    avgRPM_USD: 26.8,
    description: 'Maior mercado publicitário do país'
  },
  'br_rj_capital': {
    name: 'Rio de Janeiro Capital',
    tier: 1,
    multiplier: 0.95,
    avgCTR: 0.0298,
    avgCPC_USD: 0.80,
    avgRPM_USD: 23.8,
    description: 'Segundo maior mercado do país'
  },
  'br_sp_interior': {
    name: 'São Paulo Interior',
    tier: 2,
    multiplier: 0.75,
    avgCTR: 0.0285,
    avgCPC_USD: 0.65,
    avgRPM_USD: 18.5,
    description: 'Interior paulista - alto poder aquisitivo'
  },
  'br_sul': {
    name: 'Região Sul',
    tier: 2,
    multiplier: 0.70,
    avgCTR: 0.0275,
    avgCPC_USD: 0.60,
    avgRPM_USD: 16.5,
    description: 'RS, SC, PR - mercado estável'
  },
  'br_nordeste': {
    name: 'Região Nordeste',
    tier: 3,
    multiplier: 0.50,
    avgCTR: 0.0255,
    avgCPC_USD: 0.40,
    avgRPM_USD: 10.2,
    description: 'Mercado em crescimento'
  },
  'br_outros': {
    name: 'Outras Regiões',
    tier: 3,
    multiplier: 0.45,
    avgCTR: 0.0245,
    avgCPC_USD: 0.35,
    avgRPM_USD: 8.6,
    description: 'Demais estados brasileiros'
  }
};
const INDUSTRY_BENCHMARKS = {
  finance_insurance_legal: {
    name: 'Finanças, Seguros e Jurídico',
    avgCTR: 0.0291,
    cpcMultiplier: 2.5,
    rpmMultiplier: 3.2,
    tier: 'premium',
    description: 'Nicho de maior valor - LTV extremamente alto',
    keywords: [
      {
        term: 'seguro',
        weight: 3
      },
      {
        term: 'empréstimo',
        weight: 3
      },
      {
        term: 'financiamento',
        weight: 3
      },
      {
        term: 'advogado',
        weight: 3
      },
      {
        term: 'jurídico',
        weight: 3
      },
      {
        term: 'banco',
        weight: 2
      },
      {
        term: 'investimento',
        weight: 2
      },
      {
        term: 'cartão',
        weight: 2
      },
      {
        term: 'crédito',
        weight: 2
      }
    ]
  },
  technology_b2b: {
    name: 'Tecnologia e B2B',
    avgCTR: 0.0209,
    cpcMultiplier: 1.8,
    rpmMultiplier: 2.1,
    tier: 'high',
    description: 'Software, SaaS e serviços B2B de alto valor',
    keywords: [
      {
        term: 'software',
        weight: 3
      },
      {
        term: 'saas',
        weight: 3
      },
      {
        term: 'tecnologia',
        weight: 3
      },
      {
        term: 'sistema',
        weight: 2
      },
      {
        term: 'app',
        weight: 2
      },
      {
        term: 'api',
        weight: 2
      },
      {
        term: 'desenvolvimento',
        weight: 2
      },
      {
        term: 'programação',
        weight: 2
      }
    ]
  },
  health_wellness: {
    name: 'Saúde e Bem-Estar',
    avgCTR: 0.0327,
    cpcMultiplier: 1.5,
    rpmMultiplier: 1.8,
    tier: 'high',
    description: 'Nicho YMYL - Exige E-A-T rigoroso',
    keywords: [
      {
        term: 'saúde',
        weight: 3
      },
      {
        term: 'médico',
        weight: 3
      },
      {
        term: 'hospital',
        weight: 3
      },
      {
        term: 'tratamento',
        weight: 2
      },
      {
        term: 'medicina',
        weight: 2
      },
      {
        term: 'wellness',
        weight: 2
      },
      {
        term: 'fitness',
        weight: 2
      },
      {
        term: 'nutri',
        weight: 2
      }
    ]
  },
  real_estate: {
    name: 'Imobiliário',
    avgCTR: 0.0619,
    cpcMultiplier: 1.3,
    rpmMultiplier: 2.8,
    tier: 'medium-high',
    description: 'Transações de alto valor com sazonalidade',
    keywords: [
      {
        term: 'imóvel',
        weight: 3
      },
      {
        term: 'casa',
        weight: 3
      },
      {
        term: 'apartamento',
        weight: 3
      },
      {
        term: 'venda',
        weight: 2
      },
      {
        term: 'aluguel',
        weight: 2
      },
      {
        term: 'construção',
        weight: 2
      },
      {
        term: 'terreno',
        weight: 2
      }
    ]
  },
  education: {
    name: 'Educação',
    avgCTR: 0.0378,
    cpcMultiplier: 1.2,
    rpmMultiplier: 1.9,
    tier: 'medium',
    description: 'Cursos online em crescimento constante',
    keywords: [
      {
        term: 'curso',
        weight: 3
      },
      {
        term: 'educação',
        weight: 3
      },
      {
        term: 'ensino',
        weight: 3
      },
      {
        term: 'faculdade',
        weight: 2
      },
      {
        term: 'escola',
        weight: 2
      },
      {
        term: 'training',
        weight: 2
      },
      {
        term: 'aula',
        weight: 2
      }
    ]
  },
  entertainment_lifestyle: {
    name: 'Entretenimento e Lifestyle',
    avgCTR: 0.0783,
    cpcMultiplier: 0.4,
    rpmMultiplier: 0.7,
    tier: 'volume',
    description: 'Alto engajamento, modelo baseado em volume',
    keywords: [
      {
        term: 'entretenimento',
        weight: 3
      },
      {
        term: 'música',
        weight: 3
      },
      {
        term: 'filme',
        weight: 3
      },
      {
        term: 'celebrity',
        weight: 2
      },
      {
        term: 'lifestyle',
        weight: 2
      },
      {
        term: 'moda',
        weight: 2
      },
      {
        term: 'game',
        weight: 2
      }
    ]
  },
  general: {
    name: 'Geral',
    avgCTR: 0.0317,
    cpcMultiplier: 1.0,
    rpmMultiplier: 1.0,
    tier: 'medium',
    description: 'Benchmark médio da indústria',
    keywords: []
  }
};
// ===== FUNÇÕES AUXILIARES COMPLETAS =====
const createLogger = ()=>({
    info: (message, data)=>console.log(JSON.stringify({
        level: 'INFO',
        message,
        data,
        timestamp: new Date().toISOString()
      })),
    warn: (message, data)=>console.warn(JSON.stringify({
        level: 'WARN',
        message,
        data,
        timestamp: new Date().toISOString()
      })),
    error: (message, error)=>console.error(JSON.stringify({
        level: 'ERROR',
        message,
        error: error?.message || error,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      }))
  });
const logger = createLogger();
// ✅ CORREÇÃO 1: Função getDaysBetween corrigida
const getDaysBetween = (startDate, endDate)=>{
  if (!startDate || !endDate) return 30; // default 30 dias
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // ✅ +1 para incluir último dia
  return Math.max(1, diffDays);
};
const checkAtomicRateLimit = async (supabase, userId, userPlan)=>{
  try {
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: userId,
      p_plan: userPlan,
      p_operation: 'analysis'
    });
    if (error) {
      logger.error('Rate limit RPC error', error);
      throw new Error(`Rate limit error: ${error.message}`);
    }
    if (!data.allowed) {
      throw new Error(`Limite de ${data.limit} análises por dia atingido. Restam: ${data.remaining}`);
    }
    logger.info('Rate limit checked', {
      user_id: userId,
      current_count: data.current_count,
      limit: data.limit,
      remaining: data.remaining
    });
    return data;
  } catch (error) {
    logger.warn('Falling back to legacy rate limit method', {
      error: error.message
    });
    return await legacyRateLimit(supabase, userId, userPlan);
  }
};
const legacyRateLimit = async (supabase, userId, userPlan)=>{
  const limits = {
    trial: 100,
    basic: 100,
    premium: 100
  };
  const today = new Date().toDateString();
  const key = `${userId}:${today}`;
  const { data: existing } = await supabase.from('rate_limits').select('count').eq('key', key).single();
  const currentCount = existing?.count || 0;
  const limit = limits[userPlan] || limits.trial;
  if (currentCount >= limit) {
    throw new Error(`Limite de ${limit} análises por dia atingido para plano ${userPlan}`);
  }
  await supabase.from('rate_limits').upsert({
    key,
    user_id: userId,
    count: currentCount + 1,
    date: today,
    updated_at: new Date().toISOString()
  });
  return {
    allowed: true,
    current_count: currentCount + 1,
    limit,
    remaining: limit - (currentCount + 1)
  };
};
const detectBrazilianRegion = (geoDistribution)=>{
  if (!geoDistribution || !Array.isArray(geoDistribution)) {
    return {
      region: 'br_outros',
      confidence: 0,
      breakdown: {}
    };
  }
  const regionScores = {
    'br_sp_capital': 0,
    'br_rj_capital': 0,
    'br_sp_interior': 0,
    'br_sul': 0,
    'br_nordeste': 0,
    'br_outros': 0
  };
  const regionKeywords = {
    'br_sp_capital': [
      'são paulo',
      'sp capital',
      'grande sp',
      'guarulhos',
      'osasco'
    ],
    'br_rj_capital': [
      'rio de janeiro',
      'rj capital',
      'grande rio',
      'niterói'
    ],
    'br_sp_interior': [
      'sp interior',
      'interior paulista',
      'campinas',
      'santos',
      'sorocaba'
    ],
    'br_sul': [
      'rs',
      'sc',
      'pr',
      'rio grande',
      'santa catarina',
      'paraná',
      'porto alegre',
      'curitiba',
      'florianópolis'
    ],
    'br_nordeste': [
      'ba',
      'pe',
      'ce',
      'pb',
      'rn',
      'al',
      'se',
      'ma',
      'pi',
      'salvador',
      'recife',
      'fortaleza'
    ]
  };
  let totalWeight = 0;
  for (const geo of geoDistribution){
    const region = (geo.region || '').toLowerCase();
    const percentage = geo.percentage || 0;
    totalWeight += percentage;
    for (const [regionKey, keywords] of Object.entries(regionKeywords)){
      for (const keyword of keywords){
        if (region.includes(keyword)) {
          regionScores[regionKey] += percentage * 2;
          break;
        }
      }
    }
  }
  if (Object.values(regionScores).every((score)=>score === 0)) {
    regionScores['br_outros'] = totalWeight;
  }
  const sortedRegions = Object.entries(regionScores).sort(([, a], [, b])=>b - a).map(([region, score])=>({
      region,
      score
    }));
  const topRegion = sortedRegions[0];
  const confidence = totalWeight > 0 ? topRegion.score / totalWeight : 0;
  return {
    region: topRegion.region,
    confidence: Math.min(confidence, 1),
    breakdown: regionScores
  };
};
const detectNicheWithScoring = (siteUrl, siteContent)=>{
  const url = siteUrl.toLowerCase();
  const content = (siteContent || '').toLowerCase();
  const text = `${url} ${content}`;
  const scores = {};
  for (const [niche, data] of Object.entries(INDUSTRY_BENCHMARKS)){
    scores[niche] = 0;
    if (data.keywords) {
      for (const keyword of data.keywords){
        const term = keyword.term;
        const weight = keyword.weight || 1;
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = (text.match(regex) || []).length;
        const urlMatches = (url.match(regex) || []).length;
        const contentMatches = matches - urlMatches;
        scores[niche] += urlMatches * weight * 3 + contentMatches * weight * 1;
      }
    }
  }
  const sortedNiches = Object.entries(scores).sort(([, a], [, b])=>b - a).map(([niche, score])=>({
      niche,
      score
    }));
  const topNiche = sortedNiches[0];
  const secondNiche = sortedNiches[1];
  let confidence = 0;
  if (topNiche.score > 0) {
    if (secondNiche && secondNiche.score > 0) {
      confidence = topNiche.score / (topNiche.score + secondNiche.score);
    } else {
      confidence = Math.min(topNiche.score / 5, 1);
    }
  }
  const finalNiche = confidence > 0.3 ? topNiche.niche : 'general';
  return {
    niche: finalNiche,
    confidence,
    alternatives: sortedNiches.slice(1, 4).filter((n)=>n.score > 0),
    breakdown: scores
  };
};
const getCacheKey = (csvHash, siteId, niche)=>{
  return `${CACHE_CONFIG.prefix}:${csvHash}:${siteId}:${niche}`;
};
const getCacheMaxAge = (dailyPageviews)=>{
  if (dailyPageviews < 1000) return CACHE_CONFIG.ttl.small_dataset * 1000;
  if (dailyPageviews < 10000) return CACHE_CONFIG.ttl.medium_dataset * 1000;
  return CACHE_CONFIG.ttl.large_dataset * 1000;
};
// ✅ CORREÇÃO 2: Validação corrigida
const validateAdSenseData = (parsedData)=>{
  const errors = [];
  const warnings = [];
  // ✅ Verificar summary em vez de data array
  if (!parsedData.summary) {
    errors.push('Dados de resumo inválidos ou ausentes');
    return {
      isValid: false,
      errors,
      warnings
    };
  }
  // ✅ CRÍTICO: Usar totalDays do summary em vez de data.length
  if (parsedData.summary.totalDays < 7) {
    errors.push('Período mínimo de 7 dias necessário para análise confiável');
  }
  const totalPageviews = parsedData.summary?.totalPageviews || 0;
  const totalEarnings = parsedData.summary?.totalEarnings || 0;
  const avgRPM = parsedData.summary?.avgRPM || 0;
  if (totalPageviews < 100) {
    errors.push('Volume mínimo de 100 pageviews necessário para análise');
  }
  if (totalEarnings < 0.01) {
    warnings.push('Receita muito baixa - pode indicar problemas na monetização');
  }
  if (avgRPM > 50) {
    warnings.push('RPM muito alto - verifique se os dados estão corretos');
  } else if (avgRPM < 0.50) {
    warnings.push('RPM abaixo da média do mercado - há potencial significativo de otimização');
  }
  if (parsedData.summary?.avgCTR && parsedData.summary.avgCTR < 0.005) {
    warnings.push('CTR muito baixo - posicionamento dos anúncios pode estar inadequado');
  }
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
const performDetailedAnalysis = async (csvData, geoBenchmark, nicheBenchmark, nicheDetection, geoDetection, siteData)=>{
  const usdToBrl = 5.20;
  const currentMetrics = {
    dailyAvgPageviews: csvData.summary.dailyAvgPageviews,
    monthlyPageviews: csvData.summary.dailyAvgPageviews * 30,
    avgRPM: csvData.summary.avgRPM,
    avgCTR: csvData.summary.avgCTR || 0.01,
    avgEarnings: csvData.summary.dailyAvgEarnings,
    monthlyEarnings: csvData.summary.dailyAvgEarnings * 30
  };
  const adjustedBenchmark = {
    ...geoBenchmark,
    avgCPC: geoBenchmark.avgCPC_USD * usdToBrl * nicheBenchmark.cpcMultiplier,
    avgRPM: geoBenchmark.avgRPM_USD * usdToBrl * nicheBenchmark.rpmMultiplier,
    avgCTR: nicheBenchmark.avgCTR
  };
  const ctrGap = Math.max(0, (adjustedBenchmark.avgCTR - currentMetrics.avgCTR) / currentMetrics.avgCTR);
  const rpmGap = Math.max(0, (adjustedBenchmark.avgRPM - currentMetrics.avgRPM) / currentMetrics.avgRPM);
  const confidenceFactor = (nicheDetection.confidence + geoDetection.confidence) / 2;
  const conservativeFactor = 0.7 * confidenceFactor;
  const projectedCTRIncrease = Math.min(ctrGap * conservativeFactor, 2.0);
  const projectedRPMIncrease = Math.min(rpmGap * conservativeFactor, 1.5);
  const projectedMetrics = {
    avgCTR: currentMetrics.avgCTR * (1 + projectedCTRIncrease),
    avgRPM: currentMetrics.avgRPM * (1 + projectedRPMIncrease),
    monthlyEarnings: currentMetrics.monthlyEarnings * (1 + projectedRPMIncrease)
  };
  const ctrScore = Math.min(currentMetrics.avgCTR / adjustedBenchmark.avgCTR * 100, 100);
  const rpmScore = Math.min(currentMetrics.avgRPM / adjustedBenchmark.avgRPM * 100, 100);
  const volumeScore = Math.min(currentMetrics.dailyAvgPageviews / 1000 * 10, 100);
  const performanceScore = Math.round(ctrScore * 0.4 + rpmScore * 0.4 + volumeScore * 0.2);
  const optimizationActions = generateOptimizationActions(currentMetrics, adjustedBenchmark, nicheBenchmark, ctrGap, rpmGap, nicheDetection.confidence);
  return {
    performance_score: Math.max(performanceScore, 20),
    current_metrics: currentMetrics,
    projected_metrics: projectedMetrics,
    benchmarks: {
      industry: nicheBenchmark,
      geographic: geoBenchmark,
      adjusted: adjustedBenchmark
    },
    detection: {
      niche: nicheDetection,
      geographic: geoDetection
    },
    opportunity: {
      monthly_gain: projectedMetrics.monthlyEarnings - currentMetrics.monthlyEarnings,
      annual_gain: (projectedMetrics.monthlyEarnings - currentMetrics.monthlyEarnings) * 12,
      ctr_improvement_potential: projectedCTRIncrease,
      rpm_improvement_potential: projectedRPMIncrease
    },
    optimization_actions: {
      immediate: optimizationActions.immediate,
      medium_term: optimizationActions.mediumTerm,
      long_term: optimizationActions.longTerm
    },
    confidence: {
      level: performanceScore > 70 ? 'High' : performanceScore > 40 ? 'Medium' : 'Low',
      score: performanceScore,
      niche_confidence: nicheDetection.confidence,
      geo_confidence: geoDetection.confidence,
      factors: [
        `${csvData.summary.totalDays} dias de dados`,
        `Nicho: ${nicheBenchmark.name} (${(nicheDetection.confidence * 100).toFixed(0)}%)`,
        `Região: ${geoBenchmark.name} (${(geoDetection.confidence * 100).toFixed(0)}%)`
      ]
    },
    metadata: {
      analysis_date: new Date().toISOString(),
      data_points: csvData.summary.totalDays,
      niche_detected: nicheBenchmark.name,
      geographic_tier: geoBenchmark.tier,
      usd_to_brl_rate: usdToBrl,
      processing_version: '2.0'
    }
  };
};
const generateOptimizationActions = (current, benchmark, niche, ctrGap, rpmGap, nicheConfidence)=>{
  const actions = {
    immediate: [],
    mediumTerm: [],
    longTerm: []
  };
  if (ctrGap > 0.5) {
    actions.immediate.push({
      type: 'ad_placement_optimization',
      priority: 'Critical',
      description: 'Otimizar posicionamento de anúncios - above the fold e entre conteúdo',
      expected_improvement: {
        ctr: Math.min(ctrGap * 0.4, 0.8),
        rpm: Math.min(ctrGap * 0.3, 0.6)
      },
      confidence: nicheConfidence > 0.7 ? 'high' : 'medium',
      implementation_time: '1-2 semanas',
      expected_monthly_gain: current.monthlyEarnings * Math.min(ctrGap * 0.3, 0.6)
    });
  }
  if (rpmGap > 0.3) {
    actions.immediate.push({
      type: 'ad_format_optimization',
      priority: 'High',
      description: 'Implementar formatos de anúncio de alta performance (responsive, matched content)',
      expected_improvement: {
        ctr: Math.min(rpmGap * 0.2, 0.4),
        rpm: Math.min(rpmGap * 0.4, 0.7)
      },
      confidence: 'high',
      implementation_time: '1 semana',
      expected_monthly_gain: current.monthlyEarnings * Math.min(rpmGap * 0.4, 0.7)
    });
  }
  if (niche.tier === 'premium' && nicheConfidence > 0.6) {
    actions.immediate.push({
      type: 'high_value_keyword_targeting',
      priority: 'Critical',
      description: `Focar em palavras-chave de alta intenção comercial do nicho ${niche.name}`,
      expected_improvement: {
        ctr: 0.15,
        rpm: 0.40
      },
      confidence: 'high',
      implementation_time: '2-4 semanas',
      expected_monthly_gain: current.monthlyEarnings * 0.40
    });
  }
  return actions;
};
const trackAnalysisMetrics = async (supabase, startTime, success, error)=>{
  const endTime = Date.now();
  const duration = endTime - startTime;
  logger.info('Analysis completed', {
    success,
    duration_ms: duration,
    error: error || null
  });
  if (supabase) {
    try {
      await supabase.from('system_metrics').insert({
        operation: 'analyze_adsense',
        duration_ms: duration,
        success,
        error_message: error || null,
        timestamp: new Date().toISOString()
      });
    } catch (metricsError) {
      logger.warn('Failed to save metrics', {
        error: metricsError.message
      });
    }
  }
  if (duration > HEALTH_METRICS.performance.alert_threshold) {
    logger.warn(`PERFORMANCE ALERT: Analysis took ${duration}ms`, {
      threshold: HEALTH_METRICS.performance.alert_threshold
    });
  }
};
// ===== MAIN FUNCTION CORRIGIDA =====
Deno.serve(async (req)=>{
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  const startTime = Date.now();
  let analysisSuccess = false;
  try {
    logger.info('Starting AdSense analysis', {
      method: req.method,
      url: req.url
    });
    // ✅ CORREÇÃO PRINCIPAL: Aceitar dados processados
    const { site_id, user_id, file_name, period_start, period_end, total_pageviews, total_impressions, total_clicks, total_revenue, avg_ctr, avg_rpm, avg_cpc } = await req.json();
    // ✅ CORREÇÃO: Validação atualizada
    if (!site_id || !user_id || !total_pageviews || !total_revenue) {
      throw new Error('Parâmetros obrigatórios: site_id, user_id, total_pageviews, total_revenue');
    }
    // ✅ CORREÇÃO: Converter para formato interno
    const totalDays = getDaysBetween(period_start, period_end);
    const csv_data = {
      data: [],
      summary: {
        totalPageviews: Number(total_pageviews) || 0,
        totalEarnings: Number(total_revenue) || 0,
        avgRPM: Number(avg_rpm) || 0,
        avgCTR: Number(avg_ctr) || 0.01,
        dailyAvgPageviews: (Number(total_pageviews) || 0) / totalDays,
        dailyAvgEarnings: (Number(total_revenue) || 0) / totalDays,
        totalDays: totalDays
      }
    };
    // ✅ Clientes Supabase separados
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // ✅ Verificar autenticação
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user || user.id !== user_id) {
      throw new Error('Usuário não autenticado');
    }
    // ✅ Verificar cliente
    const { data: clientData, error: clientError } = await supabaseAdmin.from('clients').select('plan, subscription_status').eq('id', user_id).single();
    if (clientError || !clientData) throw new Error('Usuário não encontrado');
    // ✅ Rate limiting
    await checkAtomicRateLimit(supabaseAdmin, user_id, clientData.plan);
    // ✅ Validação corrigida
    const validation = validateAdSenseData(csv_data);
    if (!validation.isValid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }
    // ✅ Verificar site
    const { data: siteData, error: siteError } = await supabaseAdmin.from('sites').select('url, monthly_pageviews, geographic_distribution, content_niche').eq('id', site_id).eq('client_id', user_id).single();
    if (siteError || !siteData) {
      throw new Error('Site não encontrado ou você não tem permissão para acessá-lo');
    }
    // ✅ Detecção de região e nicho
    const geoDetection = detectBrazilianRegion(siteData.geographic_distribution);
    const nicheDetection = detectNicheWithScoring(siteData.url, siteData.content_niche);
    const geoBenchmark = BRAZIL_REGIONAL_BENCHMARKS[geoDetection.region] ?? BRAZIL_REGIONAL_BENCHMARKS.br_outros;
    const nicheBenchmark = INDUSTRY_BENCHMARKS[nicheDetection.niche] ?? INDUSTRY_BENCHMARKS.general;
    // ✅ Cache
    const csvHash = createHash('md5').update(JSON.stringify(csv_data)).digest('hex');
    const cacheKey = getCacheKey(csvHash, site_id, nicheDetection.niche);
    const { data: cached } = await supabaseAdmin.from('analysis_cache').select('result, created_at').eq('cache_key', cacheKey).maybeSingle();
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      if (cacheAge < getCacheMaxAge(csv_data.summary.dailyAvgPageviews)) {
        analysisSuccess = true;
        await trackAnalysisMetrics(supabaseAdmin, startTime, true);
        return new Response(JSON.stringify({
          success: true,
          ...cached.result,
          from_cache: true,
          cache_age_hours: Math.round(cacheAge / 3600000)
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // ✅ Realizar análise
    const analysisResult = await performDetailedAnalysis(csv_data, geoBenchmark, nicheBenchmark, nicheDetection, geoDetection, siteData);
    // ✅ Salvar no cache
    try {
      await supabaseAdmin.from('analysis_cache').upsert({
        cache_key: cacheKey,
        site_id,
        user_id,
        result: analysisResult,
        created_at: new Date().toISOString()
      });
      logger.info('Result cached', {
        cache_key: cacheKey
      });
    } catch (cacheError) {
      logger.warn('Failed to cache result', {
        error: cacheError.message
      });
    }
    // ✅ Salvar histórico
    try {
      const { data: historyRecord, error: historyError } = await supabaseAdmin.from('analysis_history').insert({
        site_id,
        user_id,
        csv_data_hash: csvHash,
        analysis_result: analysisResult,
        niche: nicheDetection.niche,
        niche_confidence: nicheDetection.confidence,
        geographic_tier: geoDetection.region,
        geo_confidence: geoDetection.confidence,
        created_at: new Date().toISOString()
      }).select('id').single();
      if (!historyError && historyRecord) {
        const features = {
          analysis_id: historyRecord.id,
          days_of_data: csv_data.summary.totalDays,
          seasonality_month: new Date().getMonth() + 1,
          seasonality_quarter: Math.ceil((new Date().getMonth() + 1) / 3),
          current_rpm: csv_data.summary.avgRPM,
          current_ctr: csv_data.summary.avgCTR,
          current_pageviews: csv_data.summary.dailyAvgPageviews,
          current_earnings: csv_data.summary.dailyAvgEarnings,
          niche: nicheDetection.niche,
          niche_confidence: nicheDetection.confidence,
          geographic_tier: geoDetection.region,
          geo_confidence: geoDetection.confidence,
          performance_tier: analysisResult.performance_score > 70 ? 'high' : analysisResult.performance_score > 40 ? 'medium' : 'low',
          ctr_gap: (analysisResult.benchmarks.adjusted.avgCTR - csv_data.summary.avgCTR) / csv_data.summary.avgCTR,
          rpm_gap: (analysisResult.benchmarks.adjusted.avgRPM - csv_data.summary.avgRPM) / csv_data.summary.avgRPM,
          traffic_volume_tier: csv_data.summary.dailyAvgPageviews < 1000 ? 'small' : csv_data.summary.dailyAvgPageviews < 10000 ? 'medium' : 'large',
          actual_improvement_ctr: null,
          actual_improvement_rpm: null,
          actual_monthly_gain: null,
          created_at: new Date().toISOString()
        };
        await supabaseAdmin.from('ml_features').insert(features);
        logger.info('ML features extracted', {
          analysis_id: historyRecord.id
        });
      }
    } catch (historyError) {
      logger.warn('Failed to save analysis history', {
        error: historyError.message
      });
    }
    analysisSuccess = true;
    await trackAnalysisMetrics(supabaseAdmin, startTime, true);
    return new Response(JSON.stringify({
      success: true,
      ...analysisResult,
      benchmark_used: {
        geographic: geoBenchmark,
        industry: nicheBenchmark
      },
      validation_warnings: validation.warnings,
      processing_time_ms: Date.now() - startTime,
      from_cache: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    logger.error('Analysis failed', err);
    await trackAnalysisMetrics(null, startTime, false, err.message);
    let status = 400;
    if (err.message.includes('não encontrado')) status = 404;
    if (err.message.includes('Limite de')) status = 429;
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status
    });
  }
});
