// src/components/Dashboard.tsx - ENTERPRISE GRADE REAL-TIME
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useFluxData } from '../hooks/useFluxData';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import MetricsCard from './MetricsCard';
import TrialBanner from './TrialBanner';
import { supabase } from '../lib/supabaseClient';

// === INTERFACES OTIMIZADAS ===
interface DashboardMetrics {
  totalRevenue: number;
  totalSites: number;
  avgOptimizationScore: number;
  activeOptimizations: number;
  monthlyGrowth: number;
  weeklyAnalyses: number;
}

interface RecentActivity {
  id: string;
  type: 'analysis' | 'optimization' | 'site_added';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'processing' | 'failed';
  metadata?: any;
}

interface TopOpportunity {
  site_id: string;
  site_url: string;
  revenue_potential: number;
  optimization_score: number;
  priority: 'high' | 'medium' | 'low';
  actions: string[];
}

// === STYLED COMPONENTS OTIMIZADOS ===
const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: #F2F2F7;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 34px;
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.025em;
  color: #1D1D1F;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 17px;
  font-weight: 400;
  color: #6D6D70;
  margin: 0 0 32px 0;
  line-height: 1.47;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'secondary' ? '#F2F2F7' : '#007AFF'};
  color: ${props => props.variant === 'secondary' ? '#1D1D1F' : '#FFFFFF'};
  border: 1px solid ${props => props.variant === 'secondary' ? '#D1D1D6' : 'transparent'};
  border-radius: 12px;
  padding: 16px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  
  &:hover {
    background: ${props => props.variant === 'secondary' ? '#E5E5EA' : '#0056CC'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const Section = styled.section`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: -0.017em;
  color: #1D1D1F;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActivityItem = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #F9F9F9;
  border-radius: 12px;
  border-left: 4px solid ${props => {
    switch (props.status) {
      case 'success': return '#30D158';
      case 'processing': return '#FF9500';
      case 'failed': return '#FF3B30';
      default: return '#8E8E93';
    }
  }};
  transition: all 0.2s ease;
  
  &:hover {
    background: #F2F2F7;
    transform: translateX(4px);
  }
`;

const ActivityIcon = styled.div<{ status: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: ${props => {
    switch (props.status) {
      case 'success': return 'rgba(48, 209, 88, 0.1)';
      case 'processing': return 'rgba(255, 149, 0, 0.1)';
      case 'failed': return 'rgba(255, 59, 48, 0.1)';
      default: return 'rgba(142, 142, 147, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'success': return '#30D158';
      case 'processing': return '#FF9500';
      case 'failed': return '#FF3B30';
      default: return '#8E8E93';
    }
  }};
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 4px 0;
`;

const ActivityDescription = styled.p`
  font-size: 13px;
  color: #6D6D70;
  margin: 0;
  line-height: 1.3;
`;

const ActivityTimestamp = styled.span`
  font-size: 12px;
  color: #8E8E93;
  font-weight: 500;
`;

const SiteCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
`;

const SiteIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #007AFF 0%, #30D158 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  font-weight: 600;
`;

const SiteInfo = styled.div`
  flex: 1;
`;

const SiteName = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 4px 0;
`;

const SiteStats = styled.div`
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6D6D70;
`;

const SiteActions = styled.div`
  display: flex;
  gap: 8px;
`;

const SiteButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' ? '#007AFF' : 'transparent'};
  color: ${props => props.variant === 'primary' ? 'white' : '#007AFF'};
  border: 1px solid ${props => props.variant === 'primary' ? 'transparent' : '#D1D1D6'};
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${props => props.variant === 'primary' ? '#0056CC' : '#F2F2F7'};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6D6D70;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 8px 0;
`;

const EmptyDescription = styled.p`
  font-size: 15px;
  color: #6D6D70;
  margin: 0 0 24px 0;
`;

// === MAIN COMPONENT ===
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    sites, 
    analyses, 
    metrics, 
    loading, 
    error, 
    refreshData,
    getCacheStats 
  } = useFluxData();

  // === ESTADOS LOCAIS OTIMIZADOS ===
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [topOpportunities, setTopOpportunities] = useState<TopOpportunity[]>([]);

  // === CÁLCULOS MEMOIZADOS ===
  const computedMetrics = useMemo(() => {
    if (!analyses.length || !sites.length) return null;

    const totalRevenue = analyses.reduce((sum, analysis) => {
      return sum + (analysis.analysis_results?.total_revenue || 0);
    }, 0);

    const avgOptimizationScore = analyses.reduce((sum, analysis) => {
      return sum + (analysis.optimization_score || 0);
    }, 0) / analyses.length;

    const activeOptimizations = sites.filter(site => 
      site.optimization_enabled && site.script_installed
    ).length;

    const monthlyGrowth = calculateMonthlyGrowth(analyses);
    const weeklyAnalyses = getWeeklyAnalyses(analyses);

    return {
      totalRevenue,
      totalSites: sites.length,
      avgOptimizationScore: Math.round(avgOptimizationScore),
      activeOptimizations,
      monthlyGrowth,
      weeklyAnalyses
    };
  }, [analyses, sites]);

  // === FUNÇÃO PARA CALCULAR CRESCIMENTO MENSAL ===
  const calculateMonthlyGrowth = useCallback((analyses: any[]) => {
    if (analyses.length < 2) return 0;
    
    const now = new Date();
    const thisMonth = analyses.filter(a => {
      const date = new Date(a.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const lastMonth = analyses.filter(a => {
      const date = new Date(a.created_at);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    });
    
    const thisMonthRevenue = thisMonth.reduce((sum, a) => sum + (a.analysis_results?.total_revenue || 0), 0);
    const lastMonthRevenue = lastMonth.reduce((sum, a) => sum + (a.analysis_results?.total_revenue || 0), 0);
    
    if (lastMonthRevenue === 0) return 0;
    
    return ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  }, []);

  // === FUNÇÃO PARA ANÁLISES SEMANAIS ===
  const getWeeklyAnalyses = useCallback((analyses: any[]) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return analyses.filter(a => new Date(a.created_at) >= weekAgo).length;
  }, []);

  // === BUSCAR ATIVIDADE RECENTE COM REAL-TIME ===
  useEffect(() => {
    if (!user?.id) return;

const fetchRecentActivity = async () => {
  try {
    // ✅ CORREÇÃO: Buscar análises normalmente
    const { data: recentAnalyses } = await supabase
      .from('adsense_analyses')
      .select(`
        id,
        created_at,
        optimization_score,
        total_revenue as revenue_potential, // ✅ USAR CAMPO CORRETO
        status,
        site_id
      `)
      .eq('client_id', user.id) // ✅ CORRETO
      .order('created_at', { ascending: false })
      .limit(5);

    // ✅ CORREÇÃO: Buscar sites do usuário primeiro, depois tasks
    const { data: userSites } = await supabase
      .from('sites')
      .select('id')
      .eq('client_id', user.id); // ✅ CORRETO

    let recentTasks = [];
    if (userSites && userSites.length > 0) {
      const siteIds = userSites.map(site => site.id);
      
      const { data: tasksData } = await supabase
        .from('optimization_tasks')
        .select(`
          id,
          created_at,
          status,
          site_id,
          sites!inner(url)
        `)
        .in('site_id', siteIds) // ✅ CORRETO: buscar por site_id
        .order('created_at', { ascending: false })
        .limit(3);
      
      recentTasks = tasksData || [];
    }
        // Combinar e formatar atividades
        const activities: RecentActivity[] = [];

        recentAnalyses?.forEach(analysis => {
          activities.push({
            id: analysis.id,
            type: 'analysis',
            title: `Análise - ${analysis.sites?.[0]?.url || 'Site não informado'}`,
            description: `Score: ${analysis.optimization_score}% • Potencial: R$ ${analysis.revenue_potential?.toFixed(2)}`,
            timestamp: analysis.created_at,
            status: analysis.status as 'success' | 'processing' | 'failed'
          });
        });

        recentTasks?.forEach(task => {
          activities.push({
            id: task.id,
            type: 'optimization',
            title: `Otimização - ${task.sites?.[0]?.url || 'Site não informado'}`,
            description: `Tipo: ${task.task_type}`,
            timestamp: task.created_at,
            status: task.status as 'success' | 'processing' | 'failed'
          });
        });

        // Ordenar por data
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setRecentActivity(activities.slice(0, 8));

      } catch (error) {
        console.error('Erro ao buscar atividade recente:', error);
      }
    };

    fetchRecentActivity();

    // Setup real-time subscription para atividades
    const subscription = supabase
      .channel(`dashboard_activity:${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'adsense_analyses' },
        (payload) => {
          console.log('Nova análise:', payload.new);
          fetchRecentActivity(); // Refresh activity
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'optimization_tasks' },
        (payload) => {
          console.log('Task atualizada:', payload.new);
          fetchRecentActivity(); // Refresh activity
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // === BUSCAR OPORTUNIDADES TOP ===
  useEffect(() => {
    if (!user?.id || !analyses.length) return;

    const opportunities = analyses
      .filter(analysis => analysis.optimization_score < 80)
      .sort((a, b) => b.revenue_potential - a.revenue_potential)
      .slice(0, 3)
      .map(analysis => ({
        site_id: analysis.id,
        site_url: analysis.site_url,
        revenue_potential: analysis.revenue_potential,
        optimization_score: analysis.optimization_score,
        priority: analysis.optimization_score < 50 ? 'high' as const : 
                 analysis.optimization_score < 70 ? 'medium' as const : 'low' as const,
        actions: ['Otimizar posicionamento', 'Melhorar CTR', 'Ajustar RPM']
      }));

    setTopOpportunities(opportunities);
  }, [analyses, user?.id]);

  // === HANDLERS ===
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'analyze':
        navigate('/analyzer');
        break;
      case 'optimize':
        navigate('/optimizer');
        break;
      case 'reports':
        navigate('/relatorios');
        break;
      case 'settings':
        navigate('/configuracoes');
        break;
      default:
        break;
    }
  }, [navigate]);

  const handleSiteAction = useCallback((siteId: string, action: string) => {
    switch (action) {
      case 'analyze':
        navigate(`/analyzer?site=${siteId}`);
        break;
      case 'optimize':
        navigate(`/optimizer?site=${siteId}`);
        break;
      case 'view':
        navigate(`/relatorios?site=${siteId}`);
        break;
      default:
        break;
    }
  }, [navigate]);

  // === RENDER ===
  if (loading) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Carregando Dashboard...</Title>
        </Header>
        <MetricsGrid>
          {[1, 2, 3, 4].map(i => (
            <MetricsCard
              key={i}
              title=""
              value=""
              isLoading={true}
            />
          ))}
        </MetricsGrid>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Header>
          <Title>Erro no Dashboard</Title>
          <Subtitle>{error}</Subtitle>
        </Header>
        <ActionButton onClick={refreshData}>
          🔄 Tentar Novamente
        </ActionButton>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <Subtitle>Visão geral das suas métricas e oportunidades</Subtitle>
      </Header>

      {/* Trial Banner */}
      <TrialBanner />

      {/* Quick Actions */}
      <QuickActionsGrid>
        <ActionButton onClick={() => handleQuickAction('analyze')}>
          📊 Nova Análise
        </ActionButton>
        <ActionButton onClick={() => handleQuickAction('optimize')}>
          ⚡ Otimizar
        </ActionButton>
        <ActionButton onClick={() => handleQuickAction('reports')} variant="secondary">
          📈 Relatórios
        </ActionButton>
        <ActionButton onClick={() => handleQuickAction('settings')} variant="secondary">
          ⚙️ Configurações
        </ActionButton>
      </QuickActionsGrid>

      {/* Métricas Principais */}
      {computedMetrics && (
        <MetricsGrid>
          <MetricsCard
            title="Receita Total"
            value={`R$ ${computedMetrics.totalRevenue.toFixed(2)}`}
            subtitle="Últimos 30 dias"
            trend={computedMetrics.monthlyGrowth > 0 ? 'up' : computedMetrics.monthlyGrowth < 0 ? 'down' : 'stable'}
            trendValue={`${Math.abs(computedMetrics.monthlyGrowth).toFixed(1)}%`}
            icon="💰"
            color="green"
            isRealTime={true}
          />
          <MetricsCard
            title="Sites Conectados"
            value={computedMetrics.totalSites}
            subtitle="Sites ativos"
            icon="🌐"
            color="blue"
          />
          <MetricsCard
            title="Score Médio"
            value={`${computedMetrics.avgOptimizationScore}%`}
            subtitle="Otimização média"
            icon="📊"
            color={computedMetrics.avgOptimizationScore >= 70 ? 'green' : 'orange'}
          />
          <MetricsCard
            title="Otimizações Ativas"
            value={computedMetrics.activeOptimizations}
            subtitle={`${computedMetrics.weeklyAnalyses} análises esta semana`}
            icon="⚡"
            color="purple"
          />
        </MetricsGrid>
      )}

      {/* Atividade Recente */}
      {recentActivity.length > 0 && (
        <Section>
          <SectionTitle>
            🕐 Atividade Recente
          </SectionTitle>
          <ActivityList>
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} status={activity.status}>
                <ActivityIcon status={activity.status}>
                  {activity.type === 'analysis' ? '📊' : '⚡'}
                </ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>{activity.title}</ActivityTitle>
                  <ActivityDescription>{activity.description}</ActivityDescription>
                </ActivityContent>
                <ActivityTimestamp>
                  {new Date(activity.timestamp).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </ActivityTimestamp>
              </ActivityItem>
            ))}
          </ActivityList>
        </Section>
      )}

      {/* Top Oportunidades */}
      {topOpportunities.length > 0 && (
        <Section>
          <SectionTitle>
            🎯 Principais Oportunidades
          </SectionTitle>
          <ActivityList>
            {topOpportunities.map((opportunity) => (
              <ActivityItem key={opportunity.site_id} status="success">
                <ActivityIcon status="success">
                  {opportunity.priority === 'high' ? '🔥' : opportunity.priority === 'medium' ? '⚡' : '📈'}
                </ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>{opportunity.site_url}</ActivityTitle>
                  <ActivityDescription>
                    Potencial: R$ {opportunity.revenue_potential.toFixed(2)} • 
                    Score: {opportunity.optimization_score}%
                  </ActivityDescription>
                </ActivityContent>
                <SiteButton 
                  variant="primary"
                  onClick={() => handleSiteAction(opportunity.site_id, 'optimize')}
                >
                  Otimizar
                </SiteButton>
              </ActivityItem>
            ))}
          </ActivityList>
        </Section>
      )}

      {/* Sites Conectados */}
      {sites.length > 0 ? (
        <Section>
          <SectionTitle>
            🌐 Sites Conectados ({sites.length})
          </SectionTitle>
          <ActivityList>
            {sites.map((site) => (
              <SiteCard key={site.id}>
                <SiteIcon>
                  {site.url.charAt(0).toUpperCase()}
                </SiteIcon>
                <SiteInfo>
                  <SiteName>{site.url}</SiteName>
                  <SiteStats>
                    <span>{site.monthly_pageviews?.toLocaleString('pt-BR') || '0'} pageviews/mês</span>
                    <span>R$ {site.current_rpm?.toFixed(2) || '0,00'} RPM</span>
                    <span style={{ 
                      color: site.script_installed ? '#30D158' : '#FF9500',
                      fontWeight: '600'
                    }}>
                      {site.script_installed ? '✅ Ativo' : '⚠️ Inativo'}
                    </span>
                  </SiteStats>
                </SiteInfo>
                <SiteActions>
                  <SiteButton 
                    variant="primary"
                    onClick={() => handleSiteAction(site.id, 'analyze')}
                  >
                    Analisar
                  </SiteButton>
                  <SiteButton 
                    variant="secondary"
                    onClick={() => handleSiteAction(site.id, 'optimize')}
                  >
                    Otimizar
                  </SiteButton>
                </SiteActions>
              </SiteCard>
            ))}
          </ActivityList>
        </Section>
      ) : (
        <Section>
          <EmptyState>
            <EmptyIcon>🌐</EmptyIcon>
            <EmptyTitle>Nenhum site conectado</EmptyTitle>
            <EmptyDescription>
              Adicione seu primeiro site para começar a otimizar suas receitas do AdSense
            </EmptyDescription>
            <ActionButton onClick={() => navigate('/configuracoes')}>
              ➕ Adicionar Site
            </ActionButton>
          </EmptyState>
        </Section>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;

