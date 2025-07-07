// src/components/Dashboard.tsx - ENTERPRISE GRADE REAL-TIME
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components'; // Presumindo que os styled-components permanecem os mesmos
import { useFluxData, RecentActivity } from '../hooks/useFluxData'; // Importar RecentActivity se movido para lá
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import MetricsCard from './MetricsCard';
import TrialBanner from './TrialBanner';
// import { supabase } from '../lib/supabaseClient'; // Não mais necessário para fetchRecentActivity

// === INTERFACES LOCAIS (DashboardMetrics, TopOpportunity) - Presumindo que permanecem as mesmas ===
// ... (Omitidas para brevidade, mas devem estar aqui como no arquivo original)
interface DashboardMetrics {
  totalRevenue: number;
  totalSites: number;
  avgOptimizationScore: number;
  activeOptimizations: number;
  monthlyGrowth: number;
  weeklyAnalyses: number;
}

// RecentActivity é importada do useFluxData agora
// interface RecentActivity { ... }

interface TopOpportunity {
  site_id: string; // Poderia ser analysis_id se a oportunidade vem da análise
  site_url?: string; // Adicionado
  revenue_potential: number;
  optimization_score: number;
  priority: 'high' | 'medium' | 'low';
  actions: string[];
}


// === STYLED COMPONENTS (Omitidos para brevidade) ===
// ... (Todos os styled-components)
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
const SiteCard = styled.div`/* ... */`;
const SiteIcon = styled.div`/* ... */`;
const SiteInfo = styled.div`/* ... */`;
const SiteName = styled.h3`/* ... */`;
const SiteStats = styled.div`/* ... */`;
const SiteActions = styled.div`/* ... */`;
const SiteButton = styled.button<any>`/* ... */`;
const EmptyState = styled.div`/* ... */`;
const EmptyIcon = styled.div`/* ... */`;
const EmptyTitle = styled.h3`/* ... */`;
const EmptyDescription = styled.p`/* ... */`;
// Adicionando os que faltavam para completar o componente
Header.defaultProps = { children: React.createElement(React.Fragment) };
Title.defaultProps = { children: React.createElement(React.Fragment) };
Subtitle.defaultProps = { children: React.createElement(React.Fragment) };
QuickActionsGrid.defaultProps = { children: React.createElement(React.Fragment) };
ActionButton.defaultProps = { children: React.createElement(React.Fragment) };
MetricsGrid.defaultProps = { children: React.createElement(React.Fragment) };
Section.defaultProps = { children: React.createElement(React.Fragment) };
SectionTitle.defaultProps = { children: React.createElement(React.Fragment) };
ActivityList.defaultProps = { children: React.createElement(React.Fragment) };
ActivityItem.defaultProps = { children: React.createElement(React.Fragment) };
ActivityIcon.defaultProps = { children: React.createElement(React.Fragment) };
ActivityContent.defaultProps = { children: React.createElement(React.Fragment) };
ActivityTitle.defaultProps = { children: React.createElement(React.Fragment) };
ActivityDescription.defaultProps = { children: React.createElement(React.Fragment) };
ActivityTimestamp.defaultProps = { children: React.createElement(React.Fragment) };
SiteCard.defaultProps = { children: React.createElement(React.Fragment) };
SiteIcon.defaultProps = { children: React.createElement(React.Fragment) };
SiteInfo.defaultProps = { children: React.createElement(React.Fragment) };
SiteName.defaultProps = { children: React.createElement(React.Fragment) };
SiteStats.defaultProps = { children: React.createElement(React.Fragment) };
SiteActions.defaultProps = { children: React.createElement(React.Fragment) };
SiteButton.defaultProps = { children: React.createElement(React.Fragment) };
EmptyState.defaultProps = { children: React.createElement(React.Fragment) };
EmptyIcon.defaultProps = { children: React.createElement(React.Fragment) };
EmptyTitle.defaultProps = { children: React.createElement(React.Fragment) };
EmptyDescription.defaultProps = { children: React.createElement(React.Fragment) };


// === MAIN COMPONENT ===
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // const { toast } = useToast(); // Não usado neste componente
  const { user } = useAuth();
  const { 
    sites, 
    analyses, 
    // metrics, // Não usado diretamente para computedMetrics
    loading, 
    error, 
    refreshData, // Agora é refreshDataAndActivity
    recentActivityFeed, // Novo estado do hook
    fetchRecentActivityFeed // Nova função do hook
  } = useFluxData();

  // O estado local recentActivity é agora alimentado por recentActivityFeed do hook
  // const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topOpportunities, setTopOpportunities] = useState<TopOpportunity[]>([]);

  // Recarregar o feed de atividades quando o componente montar ou user.id mudar
  useEffect(() => {
    if (user?.id && fetchRecentActivityFeed) {
      fetchRecentActivityFeed();
    }
  }, [user?.id, fetchRecentActivityFeed]);

  // A lógica de subscription para recentActivity agora está dentro do useFluxData
  // e deve atualizar recentActivityFeed, que por sua vez atualiza a UI.

  const computedMetrics = useMemo(() => {
    if (!analyses?.length || !sites?.length) return null;

    const totalRevenue = analyses.reduce((sum, analysis) => {
      // Assegurar que analysis.analysis_results exista e tenha total_revenue
      return sum + (analysis.analysis_results?.total_revenue || analysis.total_revenue || 0);
    }, 0);

    const avgOptimizationScore = analyses.length > 0 ? analyses.reduce((sum, analysis) => {
      return sum + (analysis.optimization_score || 0);
    }, 0) / analyses.length : 0;

    const activeOptimizations = sites.filter(site => 
      site.optimization_enabled && site.script_installed
    ).length;

    // Estas funções auxiliares precisam ser definidas ou importadas se não estiverem no escopo
    const calculateMonthlyGrowthInternal = (analysesData: typeof analyses) => {
        if (analysesData.length < 2) return 0;
        const now = new Date();
        const thisMonth = analysesData.filter(a => { const date = new Date(a.created_at); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); });
        const lastMonth = analysesData.filter(a => { const date = new Date(a.created_at); const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1); return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear(); });
        const thisMonthRevenue = thisMonth.reduce((sum, a) => sum + (a.analysis_results?.total_revenue || a.total_revenue || 0), 0);
        const lastMonthRevenue = lastMonth.reduce((sum, a) => sum + (a.analysis_results?.total_revenue || a.total_revenue || 0), 0);
        if (lastMonthRevenue === 0) return thisMonthRevenue > 0 ? 100 : 0; // Evitar divisão por zero, mostrar 100% se houve receita este mês e 0 no anterior
        return ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    };
    const getWeeklyAnalysesInternal = (analysesData: typeof analyses) => {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        return analysesData.filter(a => new Date(a.created_at) >= weekAgo).length;
    };

    const monthlyGrowth = calculateMonthlyGrowthInternal(analyses);
    const weeklyAnalyses = getWeeklyAnalysesInternal(analyses);

    return {
      totalRevenue,
      totalSites: sites.length,
      avgOptimizationScore: Math.round(avgOptimizationScore),
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
    // Usar total_revenue que está na interface Analysis do useFluxData
    const opportunities = analyses
      .filter(analysis => (analysis.optimization_score || 0) < 80 && (analysis.total_revenue || 0) > 0)
      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
      .slice(0, 3)
      .map(analysis => ({
        site_id: analysis.site_id, // Usar site_id para consistência
        site_url: analysis.site_url || sites.find(s => s.id === analysis.site_id)?.url || 'N/A',
        revenue_potential: analysis.total_revenue || 0, // Usar total_revenue
        optimization_score: analysis.optimization_score || 0,
        priority: (analysis.optimization_score || 0) < 50 ? 'high' as const :
                 (analysis.optimization_score || 0) < 70 ? 'medium' as const : 'low' as const,
        actions: ['Otimizar posicionamento', 'Melhorar CTR'] // Ações genéricas
      }));
    setTopOpportunities(opportunities);
  }, [analyses, user?.id, sites]);

  const handleQuickAction = useCallback((action: string) => { /* ... (sem mudanças) ... */ switch (action) { case 'analyze': navigate('/analyzer'); break; case 'optimize': navigate('/optimizer'); break; case 'reports': navigate('/relatorios'); break; case 'settings': navigate('/configuracoes'); break; default: break; } }, [navigate]);
  const handleSiteAction = useCallback((siteId: string, action: string) => { /* ... (sem mudanças) ... */ switch (action) { case 'analyze': navigate(`/analyzer?site=${siteId}`); break; case 'optimize': navigate(`/optimizer?site=${siteId}`); break; case 'view': navigate(`/relatorios?site=${siteId}`); break; default: break; } }, [navigate]);

  // === RENDER ===
  if (loading && !recentActivityFeed.length && !sites.length) { // Ajustar condição de loading
    return ( /* ... (JSX de loading, sem mudanças) ... */ <DashboardContainer><Header><Title>Carregando Dashboard...</Title></Header><MetricsGrid>{[1,2,3,4].map(i => (<MetricsCard key={i} title="" value="" isLoading={true} />))}</MetricsGrid></DashboardContainer>);
  }

  if (error) {
    return ( /* ... (JSX de erro, sem mudanças) ... */ <DashboardContainer><Header><Title>Erro no Dashboard</Title><Subtitle>{error}</Subtitle></Header><ActionButton onClick={refreshData}>🔄 Tentar Novamente</ActionButton></DashboardContainer>);
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <Subtitle>Visão geral das suas métricas e oportunidades</Subtitle>
      </Header>
      <TrialBanner />
      <QuickActionsGrid>
        {/* ... (Botões de ação rápida) ... */}
        <ActionButton onClick={() => handleQuickAction('analyze')}>📊 Nova Análise</ActionButton>
        <ActionButton onClick={() => handleQuickAction('optimize')}>⚡ Otimizar</ActionButton>
        <ActionButton onClick={() => handleQuickAction('reports')} variant="secondary">📈 Relatórios</ActionButton>
        <ActionButton onClick={() => handleQuickAction('settings')} variant="secondary">⚙️ Configurações</ActionButton>
      </QuickActionsGrid>

      {computedMetrics && (
        <MetricsGrid>
          {/* ... (MetricsCards usando computedMetrics) ... */}
          <MetricsCard title="Receita Total" value={`R$ ${computedMetrics.totalRevenue.toFixed(2)}`} subtitle="Últimos 30 dias" trend={computedMetrics.monthlyGrowth > 0 ? 'up' : computedMetrics.monthlyGrowth < 0 ? 'down' : 'stable'} trendValue={`${Math.abs(computedMetrics.monthlyGrowth).toFixed(1)}%`} icon="💰" color="green" isRealTime={true} />
          <MetricsCard title="Sites Conectados" value={computedMetrics.totalSites} subtitle="Sites ativos" icon="🌐" color="blue" />
          <MetricsCard title="Score Médio" value={`${computedMetrics.avgOptimizationScore}%`} subtitle="Otimização média" icon="📊" color={computedMetrics.avgOptimizationScore >= 70 ? 'green' : 'orange'} />
          <MetricsCard title="Otimizações Ativas" value={computedMetrics.activeOptimizations} subtitle={`${computedMetrics.weeklyAnalyses} análises esta semana`} icon="⚡" color="purple" />
        </MetricsGrid>
      )}

      {/* Usar recentActivityFeed do hook */}
      {recentActivityFeed.length > 0 && (
        <Section>
          <SectionTitle>🕐 Atividade Recente</SectionTitle>
          <ActivityList>
            {recentActivityFeed.map((activity) => (
              <ActivityItem key={activity.id} status={activity.status}>
                <ActivityIcon status={activity.status}>
                  {activity.type === 'analysis' ? '📊' : '⚡'}
                </ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>{activity.title}</ActivityTitle>
                  <ActivityDescription>{activity.description}</ActivityDescription>
                </ActivityContent>
                <ActivityTimestamp>
                  {new Date(activity.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
               <ActivityItem key={opportunity.site_id} status="success"> {/* Usar site_id como chave */}
                 <ActivityIcon status="success"> {/* Mudar status para algo como "opportunity" ou usar um ícone fixo */}
                   {opportunity.priority === 'high' ? '🔥' : opportunity.priority === 'medium' ? '⚡' : '📈'}
                 </ActivityIcon>
                 <ActivityContent>
                   <ActivityTitle>{opportunity.site_url || opportunity.site_id}</ActivityTitle>
                   <ActivityDescription>
                     Potencial: R$ {opportunity.revenue_potential.toFixed(2)} •
                     Score: {opportunity.optimization_score}%
                   </ActivityDescription>
                 </ActivityContent>
                 <SiteButton variant="primary" onClick={() => handleSiteAction(opportunity.site_id, 'optimize')}>
                   Otimizar
                 </SiteButton>
               </ActivityItem>
             ))}
           </ActivityList>
         </Section>
       )}

      {sites.length > 0 ? (
        <Section>
          {/* ... (Listagem de sites, sem mudanças na lógica principal, mas usa 'sites' do useFluxData) ... */}
          <SectionTitle>🌐 Sites Conectados ({sites.length})</SectionTitle>
          <ActivityList>
            {sites.map((site) => (
              <SiteCard key={site.id}>
                <SiteIcon>{site.url.charAt(0).toUpperCase()}</SiteIcon>
                <SiteInfo>
                  <SiteName>{site.url}</SiteName>
                  <SiteStats>
                    <span>{site.monthly_pageviews?.toLocaleString('pt-BR') || '0'} pageviews/mês</span>
                    <span>R$ {site.current_rpm?.toFixed(2) || '0,00'} RPM</span>
                    <span style={{ color: site.script_installed ? '#30D158' : '#FF9500', fontWeight: '600' }}>
                      {site.script_installed ? '✅ Ativo' : '⚠️ Inativo'}
                    </span>
                  </SiteStats>
                </SiteInfo>
                <SiteActions>
                  <SiteButton variant="primary" onClick={() => handleSiteAction(site.id, 'analyze')}>Analisar</SiteButton>
                  <SiteButton variant="secondary" onClick={() => handleSiteAction(site.id, 'optimize')}>Otimizar</SiteButton>
                </SiteActions>
              </SiteCard>
            ))}
          </ActivityList>
        </Section>
      ) : (
        <Section>
          {/* ... (Empty state para sites) ... */}
          <EmptyState><EmptyIcon>🌐</EmptyIcon><EmptyTitle>Nenhum site conectado</EmptyTitle><EmptyDescription>Adicione seu primeiro site para começar a otimizar suas receitas do AdSense</EmptyDescription><ActionButton onClick={() => navigate('/configuracoes?tab=sites')}>➕ Adicionar Site</ActionButton></EmptyState>
        </Section>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
