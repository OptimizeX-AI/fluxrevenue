// src/components/Dashboard.tsx - ENTERPRISE GRADE REAL-TIME (Refatorado)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useFluxData } from '../hooks/usefluxdata';
import { RecentActivity } from '../types/interfaces'; // Importar RecentActivity do types
import { useToast } from '../hooks/use-toast'; // Não usado, mas mantido se planejado para uso futuro
import { useAuth } from '../contexts/AuthContext';
import MetricsCard from './MetricsCard';
import TrialBanner from './TrialBanner';
// import { supabase } from '../lib/supabaseClient'; // Removido, fetchRecentActivity agora está no hook

// === INTERFACES LOCAIS (DashboardMetrics, TopOpportunity) ===
interface DashboardMetrics {
  totalRevenue: number;
  totalSites: number;
  avgOptimizationScore: number;
  activeOptimizations: number;
  monthlyGrowth: number;
  weeklyAnalyses: number;
}

interface TopOpportunity {
  site_id: string; 
  site_url?: string; 
  revenue_potential: number;
  optimization_score: number;
  priority: 'high' | 'medium' | 'low';
  actions: string[]; // Ações sugeridas, podem ser genéricas por enquanto
}

// === STYLED COMPONENTS (Omitidos para brevidade) ===
const DashboardContainer = styled.div`/* ... */`;
const Header = styled.header`/* ... */`;
const Title = styled.h1`/* ... */`;
const Subtitle = styled.p`/* ... */`;
const QuickActionsGrid = styled.div`/* ... */`;
const ActionButton = styled.button<any>`/* ... */`;
const MetricsGrid = styled.div`/* ... */`;
const Section = styled.section`/* ... */`;
const SectionTitle = styled.h2`/* ... */`;
const ActivityList = styled.div`/* ... */`;
const ActivityItem = styled.div<{ status: string }>`/* ... */`;
const ActivityIcon = styled.div<{ status: string }>`/* ... */`;
const ActivityContent = styled.div`/* ... */`;
const ActivityTitle = styled.h4`/* ... */`;
const ActivityDescription = styled.p`/* ... */`;
const ActivityTimestamp = styled.span`/* ... */`;
const SiteCardStyled = styled.div`/* ... */`; // Renomeado para evitar conflito
const SiteIcon = styled.div`/* ... */`;
const SiteInfo = styled.div`/* ... */`;
const SiteName = styled.h3`/* ... */`;
const SiteStats = styled.div`/* ... */`;
const SiteActions = styled.div`/* ... */`;
const SiteButton = styled.button<any>`/* ... */`;
const EmptyState = styled.div`/* ... */`;
const EmptyIconStyled = styled.div`/* ... */`; // Renomeado

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
  line-height: 1.5;
`;
Header.defaultProps = { children: React.createElement(React.Fragment) }; Title.defaultProps = { children: React.createElement(React.Fragment) }; Subtitle.defaultProps = { children: React.createElement(React.Fragment) }; QuickActionsGrid.defaultProps = { children: React.createElement(React.Fragment) }; ActionButton.defaultProps = { children: React.createElement(React.Fragment) }; MetricsGrid.defaultProps = { children: React.createElement(React.Fragment) }; Section.defaultProps = { children: React.createElement(React.Fragment) }; SectionTitle.defaultProps = { children: React.createElement(React.Fragment) }; ActivityList.defaultProps = { children: React.createElement(React.Fragment) }; ActivityItem.defaultProps = { children: React.createElement(React.Fragment) }; ActivityIcon.defaultProps = { children: React.createElement(React.Fragment) }; ActivityContent.defaultProps = { children: React.createElement(React.Fragment) }; ActivityTitle.defaultProps = { children: React.createElement(React.Fragment) }; ActivityDescription.defaultProps = { children: React.createElement(React.Fragment) }; ActivityTimestamp.defaultProps = { children: React.createElement(React.Fragment) }; SiteCardStyled.defaultProps = { children: React.createElement(React.Fragment) }; SiteIcon.defaultProps = { children: React.createElement(React.Fragment) }; SiteInfo.defaultProps = { children: React.createElement(React.Fragment) }; SiteName.defaultProps = { children: React.createElement(React.Fragment) }; SiteStats.defaultProps = { children: React.createElement(React.Fragment) }; SiteActions.defaultProps = { children: React.createElement(React.Fragment) }; SiteButton.defaultProps = { children: React.createElement(React.Fragment) }; EmptyState.defaultProps = { children: React.createElement(React.Fragment) }; EmptyIconStyled.defaultProps = { children: React.createElement(React.Fragment) }; EmptyTitle.defaultProps = { children: React.createElement(React.Fragment) }; EmptyDescription.defaultProps = { children: React.createElement(React.Fragment) };


// === MAIN COMPONENT ===
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // const { toast } = useToast(); // Não usado
  const { user } = useAuth();
  const { 
    sites, 
    analyses, 
    // metrics, // Não usado diretamente para computedMetrics
    isLoading, // Usar a função isLoading do hook
    error, 
    refreshData, // Este é refreshDataAndActivity do hook
    recentActivityFeed, 
    fetchRecentActivityFeed 
  } = useFluxData();

  // const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null); // Não usado diretamente
  const [topOpportunities, setTopOpportunities] = useState<TopOpportunity[]>([]);

  // Chamar fetchRecentActivityFeed quando o componente montar e user.id mudar
  useEffect(() => {
    if (user?.id && fetchRecentActivityFeed) {
      console.log("Dashboard: User detected, fetching recent activity feed.");
      fetchRecentActivityFeed();
    }
  }, [user?.id, fetchRecentActivityFeed]);
  
  // A lógica de subscription real-time para recentActivity agora está dentro do useFluxData
  // e deve atualizar o estado recentActivityFeed do hook, que este componente consome.

  const computedMetrics = useMemo(() => {
    if (!analyses?.length || !sites?.length) {
        // Retornar defaults ou null para evitar erros se os dados ainda não carregaram
        return { totalRevenue: 0, totalSites: sites?.length || 0, avgOptimizationScore: 0, activeOptimizations: 0, monthlyGrowth: 0, weeklyAnalyses: 0 };
    }

    const totalRevenue = analyses.reduce((sum, analysis) => {
      return sum + (analysis.analysis_results?.total_revenue || analysis.total_revenue || 0);
    }, 0);

    const avgOptimizationScore = analyses.length > 0 ? analyses.reduce((sum, analysis) => {
      return sum + (analysis.optimization_score || 0);
    }, 0) / analyses.length : 0;

    const activeOptimizations = sites.filter(site => 
      site.optimization_enabled && site.script_installed
    ).length;
    
    const calculateMonthlyGrowthInternal = (analysesData: typeof analyses) => {
        if (!analysesData || analysesData.length < 1) return 0; // Ajustado para lidar com menos de 2 análises
        const now = new Date();
        const thisMonthAnalyses = analysesData.filter(a => { const date = new Date(a.created_at); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); });
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthAnalyses = analysesData.filter(a => { const date = new Date(a.created_at); return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear(); });
        
        const thisMonthRevenue = thisMonthAnalyses.reduce((sum, a) => sum + (a.analysis_results?.total_revenue || a.total_revenue || 0), 0);
        const lastMonthRevenue = lastMonthAnalyses.reduce((sum, a) => sum + (a.analysis_results?.total_revenue || a.total_revenue || 0), 0);
        
        if (lastMonthRevenue === 0) return thisMonthRevenue > 0 ? 100 : 0; 
        return parseFloat((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
    };
    const getWeeklyAnalysesInternal = (analysesData: typeof analyses) => {
        if (!analysesData) return 0;
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        return analysesData.filter(a => new Date(a.created_at) >= weekAgo).length;
    };

    const monthlyGrowth = calculateMonthlyGrowthInternal(analyses);
    const weeklyAnalyses = getWeeklyAnalysesInternal(analyses);

    return {
      totalRevenue,
      totalSites: sites.length,
      avgOptimizationScore: parseFloat(avgOptimizationScore.toFixed(1)),
      activeOptimizations,
      monthlyGrowth,
      weeklyAnalyses
    };
  }, [analyses, sites]);

  useEffect(() => {
    if (!user?.id || !analyses?.length) {
        setTopOpportunities([]);
        return;
    }
    const opportunities = analyses
      .filter(analysis => (analysis.optimization_score || 0) < 80 && (analysis.total_revenue || 0) > 0)
      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
      .slice(0, 3)
      .map(analysis => ({
        site_id: analysis.site_id, 
        site_url: analysis.site_url || sites?.find(s => s.id === analysis.site_id)?.url || 'N/A',
        revenue_potential: analysis.projected_revenue || analysis.total_revenue || 0, // Priorizar projected_revenue
        optimization_score: analysis.optimization_score || 0,
        priority: (analysis.optimization_score || 0) < 50 ? 'high' as const : 
                 (analysis.optimization_score || 0) < 70 ? 'medium' as const : 'low' as const,
        actions: (analysis.opportunities && analysis.opportunities.length > 0) ? 
                 analysis.opportunities.slice(0,2).map((op: any) => op.title || 'Otimizar') : 
                 ['Revisar Análise', 'Aplicar Otimizações Gerais']
      }));
    setTopOpportunities(opportunities);
  }, [analyses, user?.id, sites]);

  const handleQuickAction = useCallback((action: string) => { /* ... */ switch (action) { case 'analyze': navigate('/analyzer'); break; case 'optimize': navigate('/optimizer'); break; case 'reports': navigate('/relatorios'); break; case 'settings': navigate('/configuracoes'); break; default: break; } }, [navigate]);
  const handleSiteAction = useCallback((siteId: string, action: string) => { /* ... */ switch (action) { case 'analyze': navigate(`/analyzer?site=${siteId}`); break; case 'optimize': navigate(`/optimizer?site=${siteId}`); break; case 'view': navigate(`/relatorios?site=${siteId}`); break; default: break; } }, [navigate]);

  // Usar isLoading('global') ou isLoading() se for o loading geral do useFluxData
  // Ou isLoading('recentActivity') se tivéssemos essa granularidade no hook
  if (isLoading('global') && !recentActivityFeed.length && !sites.length) { 
    return ( <DashboardContainer><Header><Title>Carregando Dashboard...</Title></Header><MetricsGrid>{[1,2,3,4].map(i => (<MetricsCard key={i} title="" value="" isLoading={true} />))}</MetricsGrid></DashboardContainer>);
  }

  if (error) {
    return ( <DashboardContainer><Header><Title>Erro no Dashboard</Title><Subtitle>{error}</Subtitle></Header><ActionButton onClick={() => refreshData('all')}>🔄 Tentar Novamente</ActionButton></DashboardContainer>);
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <Subtitle>Visão geral das suas métricas e oportunidades</Subtitle>
      </Header>
      <TrialBanner />
      <QuickActionsGrid>
        <ActionButton onClick={() => handleQuickAction('analyze')}>📊 Nova Análise</ActionButton>
        <ActionButton onClick={() => handleQuickAction('optimize')}>⚡ Otimizar</ActionButton>
        <ActionButton onClick={() => handleQuickAction('reports')} variant="secondary">📈 Relatórios</ActionButton>
        <ActionButton onClick={() => handleQuickAction('settings')} variant="secondary">⚙️ Configurações</ActionButton>
      </QuickActionsGrid>

      {computedMetrics && (
        <MetricsGrid>
          <MetricsCard title="Receita Total (Análises)" value={`R$ ${computedMetrics.totalRevenue.toFixed(2)}`} subtitle="Baseado nas últimas análises" trend={computedMetrics.monthlyGrowth >= 0 ? 'up' : 'down'} trendValue={`${computedMetrics.monthlyGrowth.toFixed(1)}%`} icon="💰" color="green" />
          <MetricsCard title="Sites Conectados" value={computedMetrics.totalSites} subtitle="Sites ativos na plataforma" icon="🌐" color="blue" />
          <MetricsCard title="Score Médio de Otimização" value={`${computedMetrics.avgOptimizationScore}%`} subtitle="Média das últimas análises" icon="📊" color={computedMetrics.avgOptimizationScore >= 70 ? 'green' : 'orange'} />
          <MetricsCard title="Otimizações Ativas (Sites)" value={computedMetrics.activeOptimizations} subtitle={`${computedMetrics.weeklyAnalyses} análises esta semana`} icon="⚡" color="purple" />
        </MetricsGrid>
      )}

      {recentActivityFeed.length > 0 && (
        <Section>
          <SectionTitle>🕐 Atividade Recente</SectionTitle>
          <ActivityList>
            {recentActivityFeed.map((activity) => (
              <ActivityItem key={activity.id} status={activity.status}>
                <ActivityIcon status={activity.status}>
                  {activity.type === 'analysis' ? '📊' : activity.type === 'optimization' ? '⚡' : '➕'}
                </ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>{activity.title}</ActivityTitle>
                  <ActivityDescription>{activity.description}</ActivityDescription>
                </ActivityContent>
                <ActivityTimestamp>
                  {new Date(activity.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </ActivityTimestamp>
              </ActivityItem>
            ))}
          </ActivityList>
        </Section>
      )}

      {topOpportunities.length > 0 && (
         <Section>
           <SectionTitle>🎯 Principais Oportunidades</SectionTitle>
           <ActivityList>
             {topOpportunities.map((opportunity) => (
               <ActivityItem key={opportunity.site_id} status="success"> 
                 <ActivityIcon status="success"> 
                   {opportunity.priority === 'high' ? '🔥' : opportunity.priority === 'medium' ? '⚡' : '📈'}
                 </ActivityIcon>
                 <ActivityContent>
                   <ActivityTitle>{opportunity.site_url || opportunity.site_id}</ActivityTitle>
                   <ActivityDescription>
                     Potencial de Receita: R$ {opportunity.revenue_potential.toFixed(2)} • 
                     Score Atual: {opportunity.optimization_score}%
                   </ActivityDescription>
                 </ActivityContent>
                 <SiteButton variant="primary" onClick={() => handleSiteAction(opportunity.site_id, 'optimizer')}>
                   Otimizar Agora
                 </SiteButton>
               </ActivityItem>
             ))}
           </ActivityList>
         </Section>
       )}

      {sites.length > 0 ? (
        <Section>
          <SectionTitle>🌐 Sites Conectados ({sites.length})</SectionTitle>
          <ActivityList>
            {sites.map((site) => (
              <SiteCardStyled key={site.id}> {/* Usar SiteCardStyled */}
                <SiteIcon>{site.url.charAt(0).toUpperCase()}</SiteIcon>
                <SiteInfo>
                  <SiteName>{site.url}</SiteName>
                  <SiteStats>
                    <span>{site.monthly_pageviews?.toLocaleString('pt-BR') || 'N/A'} pageviews/mês</span>
                    <span>R$ {site.current_rpm?.toFixed(2) || 'N/A'} RPM</span>
                    <span style={{ color: site.script_installed ? '#30D158' : '#FF9500', fontWeight: '600' }}>
                      {site.script_installed ? '✅ Script Ativo' : '⚠️ Script Inativo'}
                    </span>
                  </SiteStats>
                </SiteInfo>
                <SiteActions>
                  <SiteButton variant="primary" onClick={() => handleSiteAction(site.id, 'analyzer')}>Analisar</SiteButton>
                  <SiteButton variant="secondary" onClick={() => handleSiteAction(site.id, 'optimizer')}>Otimizar</SiteButton>
                </SiteActions>
              </SiteCardStyled>
            ))}
          </ActivityList>
        </Section>
      ) : (
        !isLoading('global') && ( // Só mostrar se não estiver carregando
            <Section>
                <EmptyState><EmptyIconStyled>🌐</EmptyIconStyled><EmptyTitle>Nenhum site conectado</EmptyTitle><EmptyDescription>Adicione seu primeiro site para começar a otimizar suas receitas do AdSense</EmptyDescription><ActionButton onClick={() => navigate('/configuracoes?tab=sites')}>➕ Adicionar Site</ActionButton></EmptyState>
            </Section>
        )
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
