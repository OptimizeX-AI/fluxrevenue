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
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { taskId, siteId, userId, immediate, batch } = await req1.json();
    console.log('Optimizer Engine called', {
      taskId,
      siteId,
      immediate,
      batch
    });
    // 1. PROCESSAR TASK ESPECÍFICA
    if (taskId) {
      const result = await processSpecificTask(supabase, taskId);
      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // 2. PROCESSAR TASKS PENDING (BATCH)
    const batchResult = await processPendingTasks(supabase);
    return new Response(JSON.stringify(batchResult), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Optimizer engine error:', error);
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
async function processSpecificTask(supabase, taskId) {
  const { data: task, error: taskError } = await supabase.from('optimization_tasks').select('*').eq('id', taskId).single();
  if (taskError || !task) {
    throw new Error(`Task not found: ${taskId}`);
  }
  return await executeOptimizationTask(supabase, task);
}
async function processPendingTasks(supabase) {
  const { data: pendingTasks, error } = await supabase.from('optimization_tasks').select('*').eq('status', 'pending').lt('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString()).order('created_at', {
    ascending: true
  }).limit(10);
  if (error || !pendingTasks?.length) {
    return {
      processed: 0,
      pending_tasks: pendingTasks?.length || 0
    };
  }
  console.log(`Processing ${pendingTasks.length} pending tasks`);
  const results = [];
  for (const task of pendingTasks){
    try {
      const result = await executeOptimizationTask(supabase, task);
      results.push({
        task_id: task.id,
        status: 'completed',
        result
      });
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
      results.push({
        task_id: task.id,
        status: 'error',
        error: error.message
      });
    }
  }
  return {
    processed: results.length,
    results
  };
}
async function executeOptimizationTask(supabase, task) {
  const startTime = Date.now();
  try {
    await supabase.from('optimization_tasks').update({
      status: 'processing',
      started_at: new Date().toISOString()
    }).eq('id', task.id);
    const optimizationResults = await processOptimizationActions(task);
    const configData = {
      site_id: task.site_id,
      task_id: task.id,
      mobile_optimization: optimizationResults.mobile_optimization,
      ad_placement_rules: optimizationResults.ad_placement_rules,
      lazy_loading_config: optimizationResults.lazy_loading_config,
      active: true,
      created_at: new Date().toISOString()
    };
    const { data: config, error: configError } = await supabase.from('optimizer_configs').insert(configData).select('id').single();
    if (configError) {
      throw new Error(`Failed to save optimizer config: ${configError.message}`);
    }
    const processingTime = Date.now() - startTime;
    await supabase.from('optimization_tasks').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      processing_time_ms: processingTime,
      results: optimizationResults
    }).eq('id', task.id);
    console.log(`Task ${task.id} completed in ${processingTime}ms`);
    return {
      success: true,
      task_id: task.id,
      config_id: config.id,
      processing_time_ms: processingTime,
      optimizations_applied: Object.keys(optimizationResults).length
    };
  } catch (error) {
    await supabase.from('optimization_tasks').update({
      status: 'error',
      completed_at: new Date().toISOString(),
      error_message: error.message
    }).eq('id', task.id);
    throw error;
  }
}
async function processOptimizationActions(task) {
  return {
    mobile_optimization: {
      enabled: true,
      responsive_ads: true,
      touch_friendly: true,
      viewport_optimization: true
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
    applied_at: new Date().toISOString(),
    source_actions: task.actions
  };
}
