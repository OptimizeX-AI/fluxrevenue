# 📊 Documentação Completa do Backend Supabase

**Projeto:** SaaS de Otimização de Receitas via AdSense  
**URL:** https://cykfgwzzvlnkqundyxrq.supabase.co  
**Data da Análise:** 07/07/2025 11:14  
**Versão do Analisador:** 2.0

---

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
3. [Relacionamentos entre Tabelas](#relacionamentos-entre-tabelas)
4. [Segurança e RLS](#segurança-e-rls)
5. [Edge Functions](#edge-functions)
6. [Funções do Banco](#funções-do-banco)
7. [Análise por Categoria](#análise-por-categoria)
8. [Recomendações](#recomendações)

---

## 🎯 Visão Geral do Sistema

Este é um backend Supabase para um **SaaS de Otimização de Receitas via AdSense** que oferece:

- **Análise de dados do AdSense** para identificar oportunidades de otimização
- **Machine Learning** para predições e recomendações automáticas
- **Testes A/B** para validar otimizações
- **Reinforcement Learning** para otimização contínua
- **Sistema de métricas** em tempo real
- **Gerenciamento de clientes** com planos e faturamento

### 📊 Estatísticas Gerais

- **Total de Tabelas:** 18
- **Total de Relacionamentos:** 19
- **Tabelas com RLS:** 0
- **Tabelas Principais:** sites, clients, optimization_tasks

---

## 🗄️ Estrutura do Banco de Dados

### 📊 Tabelas por Categoria


#### Core Business
- **adsense_analyses** (25 colunas) - Armazena análises de dados do AdSense dos sites dos clientes
- **sites** (11 colunas) - Armazena os sites que os clientes adicionam para otimização.

#### Authentication & Users
- **user_settings** (9 colunas) - 
- **clients** (11 colunas) - Tabela com informações de perfil e faturamento dos clientes.

#### Analytics & Metrics
- **metrics** (9 colunas) - Registros de métricas de performance enviados pelo script optimizer.
- **analysis_history** (14 colunas) - Histórico de análises para treinamento de ML
- **system_metrics** (8 colunas) - Métricas de performance do sistema para monitoramento

#### Machine Learning
- **ml_features** (21 colunas) - Features extraídas para treinamento de modelos de ML
- **rl_states** (13 colunas) - 
- **rl_agents** (14 colunas) - 

#### System & Infrastructure
- **rate_limits** (8 colunas) - Controle de taxa de requisições por usuário
- **analysis_cache** (7 colunas) - Cache de análises para melhorar performance
- **v_analysis_data** (6 colunas) - 
- **notifications** (6 colunas) - 

#### Optimization
- **optimizations** (7 colunas) - Configurações de otimizações aplicadas a cada site.
- **ab_experiments** (18 colunas) - 
- **optimizer_configs** (11 colunas) - 
- **optimization_tasks** (12 colunas) - 


---

## 🔗 Relacionamentos entre Tabelas

### Tabelas Centrais (Mais Conectadas)

1. **sites** - 10 conexões (10 entrada, 0 saída)
2. **clients** - 5 conexões (5 entrada, 0 saída)
3. **optimization_tasks** - 4 conexões (2 entrada, 2 saída)
4. **adsense_analyses** - 3 conexões (1 entrada, 2 saída)
5. **analysis_history** - 3 conexões (1 entrada, 2 saída)


### Mapeamento de Relacionamentos

- **optimizations.site_id** → **sites.id** (1:N)
- **ab_experiments.site_id** → **sites.id** (1:N)
- **ab_experiments.optimization_task_id** → **optimization_tasks.id** (1:N)
- **optimizer_configs.site_id** → **sites.id** (1:N)
- **rate_limits.user_id** → **clients.id** (1:N)
- **analysis_cache.site_id** → **sites.id** (1:N)
- **analysis_cache.user_id** → **clients.id** (1:N)
- **optimization_tasks.analysis_id** → **adsense_analyses.id** (1:N)
- **optimization_tasks.site_id** → **sites.id** (1:N)
- **adsense_analyses.site_id** → **sites.id** (1:N)
- **adsense_analyses.client_id** → **clients.id** (1:N)
- **ml_features.analysis_id** → **analysis_history.id** (1:N)
- **metrics.site_id** → **sites.id** (1:N)
- **analysis_history.site_id** → **sites.id** (1:N)
- **analysis_history.user_id** → **clients.id** (1:N)
- **rl_states.site_id** → **sites.id** (1:N)
- **rl_states.optimization_task_id** → **optimization_tasks.id** (1:N)
- **rl_agents.site_id** → **sites.id** (1:N)
- **system_metrics.user_id** → **clients.id** (1:N)


---

## 🔒 Segurança e RLS (Row Level Security)

### Resumo de Segurança

- **Tabelas com RLS Ativo:** 0
- **Tabelas com Acesso Aberto:** 17
- **Tabelas Restritas:** 0

### Tabelas com RLS Habilitado



### ⚠️ Tabelas com Acesso Aberto

- **clients** ⚠️ Acesso público (sem RLS)
- **sites** ⚠️ Acesso público (sem RLS)
- **adsense_analyses** ⚠️ Acesso público (sem RLS)
- **metrics** ⚠️ Acesso público (sem RLS)
- **optimizations** ⚠️ Acesso público (sem RLS)
- **ab_experiments** ⚠️ Acesso público (sem RLS)
- **optimization_tasks** ⚠️ Acesso público (sem RLS)
- **optimizer_configs** ⚠️ Acesso público (sem RLS)
- **user_settings** ⚠️ Acesso público (sem RLS)
- **analysis_cache** ⚠️ Acesso público (sem RLS)
- **rate_limits** ⚠️ Acesso público (sem RLS)
- **ml_features** ⚠️ Acesso público (sem RLS)
- **analysis_history** ⚠️ Acesso público (sem RLS)
- **rl_states** ⚠️ Acesso público (sem RLS)
- **rl_agents** ⚠️ Acesso público (sem RLS)
- **system_metrics** ⚠️ Acesso público (sem RLS)
- **notifications** ⚠️ Acesso público (sem RLS)


---

## ⚡ Edge Functions

### Status das Edge Functions

❌ **Management API não acessível** (Status 401 - Credenciais insuficientes)

### Testes de Endpoints Comuns

- **analyze-adsense** - ✅ Existe
- **optimize-site** - ❌ Não encontrada
- **generate-report** - ❌ Não encontrada
- **process-metrics** - ❌ Não encontrada
- **ml-prediction** - ❌ Não encontrada
- **webhook-handler** - ❌ Não encontrada


---

## 🔧 Funções do Banco de Dados

### Funções RPC Testadas

- **get_schema_info** - ❌ Não acessível (Não existe)
- **get_rls_policies** - ❌ Não acessível (Não existe)
- **get_database_functions** - ❌ Não acessível (Não existe)
- **get_triggers** - ❌ Não acessível (Não existe)
- **analyze_performance** - ❌ Não acessível (Não existe)
- **optimize_site** - ❌ Não acessível (Não existe)


---

## 📊 Análise Detalhada por Tabela



### 📋 user_settings

**Descrição:** 

**Estatísticas:**
- Total de colunas: 9
- Chaves primárias: id
- Chaves estrangeiras: 0
- Campos obrigatórios: 4
- Campos JSON: 0

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | uuid | ✅ | Note: This is a Primary Key.<pk/> |
| client_id | string | uuid | ✅ |  |
| notifications_enabled | boolean | boolean | ❌ |  |
| auto_optimization | boolean | boolean | ❌ |  |
| report_frequency | string | text | ❌ |  |
| email_notifications | boolean | boolean | ❌ |  |
| sms_notifications | boolean | boolean | ❌ |  |
| created_at | string | timestamp with time zone | ✅ |  |
| updated_at | string | timestamp with time zone | ✅ |  |


### 📋 optimizations

**Descrição:** Configurações de otimizações aplicadas a cada site.

**Estatísticas:**
- Total de colunas: 7
- Chaves primárias: id
- Chaves estrangeiras: 1
- Campos obrigatórios: 2
- Campos JSON: 1

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | text | ✅ | Note: This is a Primary Key.<pk/> |
| site_id | string | text | ✅ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| type | string | text | ❌ |  |
| status | string | text | ❌ |  |
| config | unknown | jsonb | ❌ |  |
| impact_percentage | number | double precision | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |

**Relacionamentos:**
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>


### 📋 ab_experiments

**Descrição:** 

**Estatísticas:**
- Total de colunas: 18
- Chaves primárias: id
- Chaves estrangeiras: 2
- Campos obrigatórios: 2
- Campos JSON: 3

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | text | ✅ | Note: This is a Primary Key.<pk/> |
| site_id | string | text | ❌ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| optimization_task_id | string | text | ❌ | Note: This is a Foreign Key to `optimization_tasks.id`.<fk table='optimization_tasks' column='id'/> |
| experiment_name | string | text | ✅ |  |
| hypothesis | string | text | ❌ |  |
| variants | unknown | jsonb | ❌ |  |
| traffic_split | number | double precision | ❌ |  |
| target_metrics | unknown | jsonb | ❌ |  |
| minimum_sample_size | integer | integer | ❌ |  |
| duration_days | integer | integer | ❌ |  |
| device_targeting | string | text | ❌ |  |
| start_date | string | timestamp with time zone | ❌ |  |
| end_date | string | timestamp with time zone | ❌ |  |
| results | unknown | jsonb | ❌ |  |
| statistical_significance | number | double precision | ❌ |  |
| winner_variant | string | text | ❌ |  |
| status | string | text | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |

**Relacionamentos:**
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>
- **optimization_task_id**: Note:
This is a Foreign Key to `optimization_tasks.id`.<fk table='optimization_tasks' column='id'/>


### 📋 optimizer_configs

**Descrição:** 

**Estatísticas:**
- Total de colunas: 11
- Chaves primárias: id
- Chaves estrangeiras: 1
- Campos obrigatórios: 1
- Campos JSON: 2

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | text | ✅ | Note: This is a Primary Key.<pk/> |
| site_id | string | text | ❌ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| config_name | string | text | ❌ |  |
| config | unknown | jsonb | ❌ |  |
| is_active | boolean | boolean | ❌ |  |
| auto_apply | boolean | boolean | ❌ |  |
| max_daily_changes | integer | integer | ❌ |  |
| safety_limits | unknown | jsonb | ❌ |  |
| last_applied_at | string | timestamp with time zone | ❌ |  |
| status | string | text | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |

**Relacionamentos:**
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>


### 📋 rate_limits

**Descrição:** Controle de taxa de requisições por usuário

**Estatísticas:**
- Total de colunas: 8
- Chaves primárias: id
- Chaves estrangeiras: 1
- Campos obrigatórios: 6
- Campos JSON: 0

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | uuid | ✅ | Note: This is a Primary Key.<pk/> |
| key | string | text | ✅ | Chave única: user_id:date:operation |
| user_id | string | uuid | ❌ | Note: This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/> |
| count | integer | integer | ✅ | Número de operações realizadas |
| date | string | text | ✅ | Data no formato YYYY-MM-DD |
| operation | string | text | ❌ |  |
| updated_at | string | timestamp with time zone | ✅ |  |
| created_at | string | timestamp with time zone | ✅ |  |

**Relacionamentos:**
- **user_id**: Note:
This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/>


### 📋 clients

**Descrição:** Tabela com informações de perfil e faturamento dos clientes.

**Estatísticas:**
- Total de colunas: 11
- Chaves primárias: id
- Chaves estrangeiras: 0
- Campos obrigatórios: 1
- Campos JSON: 0

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | uuid | ✅ | Note: This is a Primary Key.<pk/> |
| company | string | text | ❌ |  |
| plan | string | text | ❌ |  |
| stripe_customer_id | string | text | ❌ |  |
| stripe_subscription_id | string | text | ❌ |  |
| status | string | text | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |
| email | string | text | ❌ |  |
| trial_start_date | string | timestamp without time zone | ❌ |  |
| trial_end_date | string | timestamp without time zone | ❌ |  |
| subscription_status | string | text | ❌ |  |


### 📋 analysis_cache

**Descrição:** Cache de análises para melhorar performance

**Estatísticas:**
- Total de colunas: 7
- Chaves primárias: id
- Chaves estrangeiras: 2
- Campos obrigatórios: 5
- Campos JSON: 1

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | uuid | ✅ | Note: This is a Primary Key.<pk/> |
| cache_key | string | text | ✅ | Chave única do cache baseada em hash CSV + site + nicho |
| site_id | string | text | ❌ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| user_id | string | uuid | ❌ | Note: This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/> |
| result | unknown | jsonb | ✅ | Resultado completo da análise em JSON |
| created_at | string | timestamp with time zone | ✅ |  |
| expires_at | string | timestamp with time zone | ✅ | Data de expiração do cache |

**Relacionamentos:**
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>
- **user_id**: Note:
This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/>


### 📋 v_analysis_data

**Descrição:** 

**Estatísticas:**
- Total de colunas: 6
- Chaves primárias: site_id
- Chaves estrangeiras: 0
- Campos obrigatórios: 0
- Campos JSON: 0

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| site_id | string | text | ❌ | Note: This is a Primary Key.<pk/> |
| site_url | string | text | ❌ |  |
| client_id | string | uuid | ❌ |  |
| monthly_pageviews | integer | integer | ❌ |  |
| current_rpm | number | double precision | ❌ |  |
| current_user | string | uuid | ❌ |  |


### 📋 optimization_tasks

**Descrição:** 

**Estatísticas:**
- Total de colunas: 12
- Chaves primárias: id
- Chaves estrangeiras: 2
- Campos obrigatórios: 1
- Campos JSON: 2

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | text | ✅ | Note: This is a Primary Key.<pk/> |
| analysis_id | string | text | ❌ | Note: This is a Foreign Key to `adsense_analyses.id`.<fk table='adsense_analyses' column='id'/> |
| site_id | string | text | ❌ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| status | string | text | ❌ |  |
| actions | unknown | jsonb | ❌ |  |
| results | unknown | jsonb | ❌ |  |
| error_message | string | text | ❌ |  |
| priority | integer | integer | ❌ |  |
| scheduled_at | string | timestamp with time zone | ❌ |  |
| started_at | string | timestamp with time zone | ❌ |  |
| completed_at | string | timestamp with time zone | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |

**Relacionamentos:**
- **analysis_id**: Note:
This is a Foreign Key to `adsense_analyses.id`.<fk table='adsense_analyses' column='id'/>
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>


### 📋 adsense_analyses

**Descrição:** Armazena análises de dados do AdSense dos sites dos clientes

**Estatísticas:**
- Total de colunas: 25
- Chaves primárias: id
- Chaves estrangeiras: 2
- Campos obrigatórios: 4
- Campos JSON: 4

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | text | ✅ | Note: This is a Primary Key.<pk/> |
| site_id | string | text | ✅ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| client_id | string | uuid | ✅ | Note: This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/> |
| analysis_date | string | timestamp with time zone | ❌ |  |
| file_name | string | text | ✅ |  |
| period_start | string | date | ❌ |  |
| period_end | string | date | ❌ |  |
| total_pageviews | integer | integer | ❌ |  |
| total_impressions | integer | integer | ❌ |  |
| total_clicks | integer | integer | ❌ |  |
| total_revenue | number | double precision | ❌ |  |
| avg_ctr | number | double precision | ❌ |  |
| avg_rpm | number | double precision | ❌ |  |
| avg_cpc | number | double precision | ❌ |  |
| analysis_results | unknown | jsonb | ❌ | Resultados detalhados da análise em formato JSON |
| opportunities | unknown | jsonb | ❌ | Oportunidades de otimização identificadas em formato JSON |
| projected_increase | number | double precision | ❌ | Percentual de aumento projetado de receita |
| projected_revenue | number | double precision | ❌ |  |
| benchmark_score | integer | integer | ❌ | Score da performance vs benchmarks (0-100) |
| status | string | text | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |
| optimizer_executed | boolean | boolean | ❌ |  |
| optimizer_task_id | string | text | ❌ |  |
| optimizer_results | unknown | jsonb | ❌ |  |
| optimization_actions | unknown | jsonb | ❌ |  |

**Relacionamentos:**
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>
- **client_id**: Note:
This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/>


### 📋 ml_features

**Descrição:** Features extraídas para treinamento de modelos de ML

**Estatísticas:**
- Total de colunas: 21
- Chaves primárias: id
- Chaves estrangeiras: 1
- Campos obrigatórios: 15
- Campos JSON: 0

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | uuid | ✅ | Note: This is a Primary Key.<pk/> |
| analysis_id | string | uuid | ❌ | Note: This is a Foreign Key to `analysis_history.id`.<fk table='analysis_history' column='id'/> |
| days_of_data | integer | integer | ✅ |  |
| seasonality_month | integer | integer | ✅ |  |
| seasonality_quarter | integer | integer | ✅ |  |
| current_rpm | number | numeric | ✅ |  |
| current_ctr | number | numeric | ✅ |  |
| current_pageviews | integer | integer | ✅ |  |
| current_earnings | number | numeric | ✅ |  |
| niche | string | text | ✅ |  |
| niche_confidence | number | numeric | ✅ | Confiança da detecção de nicho (0-1) |
| geographic_tier | string | text | ✅ |  |
| geo_confidence | number | numeric | ✅ | Confiança da detecção geográfica (0-1) |
| performance_tier | string | text | ✅ |  |
| ctr_gap | number | numeric | ❌ |  |
| rpm_gap | number | numeric | ❌ |  |
| traffic_volume_tier | string | text | ✅ |  |
| actual_improvement_ctr | number | numeric | ❌ | Melhoria real de CTR após implementação (para feedback loop) |
| actual_improvement_rpm | number | numeric | ❌ | Melhoria real de RPM após implementação (para feedback loop) |
| actual_monthly_gain | number | numeric | ❌ |  |
| created_at | string | timestamp with time zone | ✅ |  |

**Relacionamentos:**
- **analysis_id**: Note:
This is a Foreign Key to `analysis_history.id`.<fk table='analysis_history' column='id'/>


### 📋 sites

**Descrição:** Armazena os sites que os clientes adicionam para otimização.

**Estatísticas:**
- Total de colunas: 11
- Chaves primárias: id
- Chaves estrangeiras: 0
- Campos obrigatórios: 4
- Campos JSON: 1

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | text | ✅ | Note: This is a Primary Key.<pk/> |
| client_id | string | uuid | ✅ |  |
| url | string | text | ✅ |  |
| monthly_pageviews | integer | integer | ❌ |  |
| current_rpm | number | double precision | ❌ |  |
| target_rpm | number | double precision | ❌ |  |
| optimization_token | string | text | ✅ |  |
| script_installed | boolean | boolean | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |
| geographic_distribution | unknown | jsonb | ❌ |  |
| content_niche | string | text | ❌ |  |


### 📋 metrics

**Descrição:** Registros de métricas de performance enviados pelo script optimizer.

**Estatísticas:**
- Total de colunas: 9
- Chaves primárias: id
- Chaves estrangeiras: 1
- Campos obrigatórios: 2
- Campos JSON: 0

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | text | ✅ | Note: This is a Primary Key.<pk/> |
| site_id | string | text | ✅ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| timestamp | string | timestamp with time zone | ❌ |  |
| pageviews | integer | integer | ❌ |  |
| impressions | integer | integer | ❌ |  |
| clicks | integer | integer | ❌ |  |
| revenue | number | double precision | ❌ |  |
| ctr | number | double precision | ❌ |  |
| rpm | number | double precision | ❌ |  |

**Relacionamentos:**
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>


### 📋 analysis_history

**Descrição:** Histórico de análises para treinamento de ML

**Estatísticas:**
- Total de colunas: 14
- Chaves primárias: id
- Chaves estrangeiras: 2
- Campos obrigatórios: 6
- Campos JSON: 3

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | uuid | ✅ | Note: This is a Primary Key.<pk/> |
| site_id | string | text | ❌ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| user_id | string | uuid | ❌ | Note: This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/> |
| csv_data_hash | string | text | ✅ |  |
| analysis_result | unknown | jsonb | ✅ |  |
| niche | string | text | ✅ |  |
| niche_confidence | number | numeric | ❌ | Confiança da detecção de nicho (0-1) |
| geographic_tier | string | text | ✅ |  |
| geo_confidence | number | numeric | ❌ | Confiança da detecção geográfica (0-1) |
| performance_score | integer | integer | ❌ |  |
| monthly_gain | number | numeric | ❌ |  |
| user_feedback | unknown | jsonb | ❌ | Feedback do usuário sobre a análise |
| actual_results | unknown | jsonb | ❌ | Resultados reais após implementação das otimizações |
| created_at | string | timestamp with time zone | ✅ |  |

**Relacionamentos:**
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>
- **user_id**: Note:
This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/>


### 📋 rl_states

**Descrição:** 

**Estatísticas:**
- Total de colunas: 13
- Chaves primárias: id
- Chaves estrangeiras: 2
- Campos obrigatórios: 1
- Campos JSON: 4

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | text | ✅ | Note: This is a Primary Key.<pk/> |
| site_id | string | text | ❌ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| optimization_task_id | string | text | ❌ | Note: This is a Foreign Key to `optimization_tasks.id`.<fk table='optimization_tasks' column='id'/> |
| state_vector | unknown | jsonb | ❌ |  |
| action_taken | unknown | jsonb | ❌ |  |
| reward | number | double precision | ❌ |  |
| next_state_vector | unknown | jsonb | ❌ |  |
| episode_id | string | text | ❌ |  |
| step_number | integer | integer | ❌ |  |
| environment_context | unknown | jsonb | ❌ |  |
| confidence_score | number | double precision | ❌ |  |
| status | string | text | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |

**Relacionamentos:**
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>
- **optimization_task_id**: Note:
This is a Foreign Key to `optimization_tasks.id`.<fk table='optimization_tasks' column='id'/>


### 📋 rl_agents

**Descrição:** 

**Estatísticas:**
- Total de colunas: 14
- Chaves primárias: id
- Chaves estrangeiras: 1
- Campos obrigatórios: 3
- Campos JSON: 3

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | text | ✅ | Note: This is a Primary Key.<pk/> |
| site_id | string | text | ❌ | Note: This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/> |
| agent_type | string | text | ✅ |  |
| agent_name | string | text | ✅ |  |
| policy_network | string | bytea | ❌ |  |
| critic_network | string | bytea | ❌ |  |
| experience_buffer | unknown | jsonb | ❌ |  |
| hyperparameters | unknown | jsonb | ❌ |  |
| performance_metrics | unknown | jsonb | ❌ |  |
| last_training_at | string | timestamp with time zone | ❌ |  |
| training_episodes | integer | integer | ❌ |  |
| status | string | text | ❌ |  |
| version | integer | integer | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |

**Relacionamentos:**
- **site_id**: Note:
This is a Foreign Key to `sites.id`.<fk table='sites' column='id'/>


### 📋 system_metrics

**Descrição:** Métricas de performance do sistema para monitoramento

**Estatísticas:**
- Total de colunas: 8
- Chaves primárias: id
- Chaves estrangeiras: 1
- Campos obrigatórios: 5
- Campos JSON: 1

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | uuid | ✅ | Note: This is a Primary Key.<pk/> |
| operation | string | text | ✅ | Nome da operação (ex: analyze_adsense) |
| duration_ms | integer | integer | ✅ | Duração da operação em milissegundos |
| success | boolean | boolean | ✅ |  |
| error_message | string | text | ❌ |  |
| user_id | string | uuid | ❌ | Note: This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/> |
| metadata | unknown | jsonb | ❌ | Metadados adicionais da operação |
| timestamp | string | timestamp with time zone | ✅ |  |

**Relacionamentos:**
- **user_id**: Note:
This is a Foreign Key to `clients.id`.<fk table='clients' column='id'/>


### 📋 notifications

**Descrição:** 

**Estatísticas:**
- Total de colunas: 6
- Chaves primárias: id
- Chaves estrangeiras: 0
- Campos obrigatórios: 1
- Campos JSON: 0

**Colunas:**

| Nome | Tipo | Formato | Obrigatório | Descrição |
|------|------|---------|-------------|----------|
| id | string | uuid | ✅ | Note: This is a Primary Key.<pk/> |
| user_id | string | uuid | ❌ |  |
| title | string | text | ❌ |  |
| message | string | text | ❌ |  |
| read | boolean | boolean | ❌ |  |
| created_at | string | timestamp with time zone | ❌ |  |


---

## 🎯 Recomendações

### 🔒 Segurança


⚠️ **Atenção:** 17 tabelas sem RLS detectadas:
- clients
- sites
- adsense_analyses
- metrics
- optimizations
- ab_experiments
- optimization_tasks
- optimizer_configs
- user_settings
- analysis_cache
- rate_limits
- ml_features
- analysis_history
- rl_states
- rl_agents
- system_metrics
- notifications

**Recomendação:** Implementar políticas RLS para proteger dados sensíveis.


### 📊 Performance

1. **Índices:** Verificar se tabelas com muitos relacionamentos têm índices adequados
2. **Queries:** Otimizar consultas em tabelas centrais como `sites`
3. **Cache:** Implementar cache para análises frequentes (tabela `analysis_cache` já existe)

### 🔧 Arquitetura

1. **Machine Learning:** Sistema robusto com tabelas `ml_features`, `rl_states`, `rl_agents`
2. **Monitoramento:** Boa estrutura de métricas com `system_metrics` e `metrics`
3. **Escalabilidade:** Considerar particionamento para tabelas de métricas históricas

### 🚀 Próximos Passos

1. Implementar Edge Functions para processamento em tempo real
2. Configurar triggers para automação de tarefas
3. Otimizar políticas RLS para melhor performance
4. Implementar backup e recovery procedures

---

## 📞 Informações Técnicas

**Projeto Supabase:** `cykfgwzzvlnkqundyxrq`  
**URL:** `https://cykfgwzzvlnkqundyxrq.supabase.co`  
**Documentação gerada em:** 07/07/2025 às 11:14:35

---

*Documentação gerada automaticamente pelo Supabase Backend Analyzer v2.0*
