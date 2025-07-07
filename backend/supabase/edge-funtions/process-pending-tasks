import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
serve(async (req1)=>{
  if (req1.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  const startTime = Date.now();
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    console.log('🔄 Starting pending tasks cleanup job...');
    // 1. BUSCAR TASKS PENDENTES ANTIGAS (>10 minutos)
    const { data: pendingTasks, error: fetchError } = await supabase.from('optimization_tasks').select('id, analysis_id, site_id, created_at, actions').eq('status', 'pending').lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()).order('created_at', {
      ascending: true
    }).limit(20);
    if (fetchError) {
      throw new Error(`Failed to fetch pending tasks: ${fetchError.message}`);
    }
    const result = {
      processed: 0,
      failed: 0,
      total_pending: pendingTasks?.length || 0,
      execution_time_ms: 0,
      errors: []
    };
    console.log(`📊 Found ${result.total_pending} pending tasks to process`);
    if (!pendingTasks || pendingTasks.length === 0) {
      result.execution_time_ms = Date.now() - startTime;
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending tasks found',
        result
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // 2. PROCESSAR CADA TASK PENDENTE
    for (const task of pendingTasks){
      try {
        console.log(`⚡ Processing task: ${task.id}`);
        // Marcar como processando
        await supabase.from('optimization_tasks').update({
          status: 'processing',
          started_at: new Date().toISOString()
        }).eq('id', task.id);
        // Criar configuração de otimização
        const optimizationConfig = {
          mobile_optimization: {
            enabled: true,
            responsive_ads: true,
            touch_friendly: true
          },
          ad_placement_rules: {
            max_ads_per_page: 3,
            min_content_ratio: 0.6,
            avoid_fold_limit: true
          },
          lazy_loading_config: {
            enabled: true,
            threshold: 200,
            ads_delay: 500
          },
          cron_processed: true,
          processed_at: new Date().toISOString()
        };
        // Salvar config no optimizer_configs
        const configId = `config_cron_${task.id.split('_')[1]}_${Date.now()}`;
        const { error: configError } = await supabase.from('optimizer_configs').insert({
          id: configId,
          site_id: task.site_id,
          config_name: 'Cron Auto-Generated Config',
          config: optimizationConfig,
          is_active: true,
          auto_apply: true,
          max_daily_changes: 5,
          safety_limits: {
            max_ctr_change: 0.2,
            min_revenue_threshold: 0.95
          },
          status: 'active',
          created_at: new Date().toISOString()
        });
        if (configError) {
          throw new Error(`Failed to create config: ${configError.message}`);
        }
        // Marcar task como completed
        await supabase.from('optimization_tasks').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results: optimizationConfig
        }).eq('id', task.id);
        // Marcar análise como otimizada
        if (task.analysis_id) {
          await supabase.from('adsense_analyses').update({
            optimizer_executed: true
          }).eq('id', task.analysis_id);
        }
        result.processed++;
        console.log(`✅ Task ${task.id} processed successfully`);
      } catch (taskError) {
        console.error(`❌ Failed to process task ${task.id}:`, taskError);
        // Marcar task como erro
        await supabase.from('optimization_tasks').update({
          status: 'error',
          completed_at: new Date().toISOString(),
          error_message: taskError.message
        }).eq('id', task.id);
        result.failed++;
        result.errors.push({
          task_id: task.id,
          error: taskError.message
        });
      }
    }
    result.execution_time_ms = Date.now() - startTime;
    // 3. LOG DE RESULTADO
    console.log(`🎯 Cron job completed:`);
    console.log(`   - Processed: ${result.processed}`);
    console.log(`   - Failed: ${result.failed}`);
    console.log(`   - Execution time: ${result.execution_time_ms}ms`);
    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${result.processed} tasks, ${result.failed} failed`,
      result
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    const execution_time = Date.now() - startTime;
    console.error('💥 Cron job failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      execution_time_ms: execution_time
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
