// src/components/Analyzer/AnalysisResults.tsx
import React from 'react'
import './AnalysisResults.css'

interface AnalysisResultsProps {
  data: {
    site_url: string;
    csv_data: string;
    analysis_results?: any;
  } | null;
  onReset: () => void;
}

interface AnalysisInsight {
  category: string;
  current_value: number;
  optimized_value: number;
  improvement_percent: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

// ✅ CORREÇÃO: Removido o const e mantido apenas uma declaração
function AnalysisResults({ data, onReset }: AnalysisResultsProps) {
  // ✅ CORREÇÃO: Guard clause melhorada
  if (!data || !data.csv_data || !data.analysis_results) {
    return (
      <div className="analysis-empty">
        <h3>Nenhum resultado disponível</h3>
        <p>Execute uma análise primeiro para ver os resultados.</p>
        <button onClick={onReset} className="btn-primary">
          Nova Análise
        </button>
      </div>
    );
  }

  const results = data.analysis_results;
  const insights: AnalysisInsight[] = results.insights || [];
  const summary = results.summary || {};

  return (
    <div className="analysis-results">
      <div className="results-header">
        <h2>Resultados da Análise</h2>
        <button onClick={onReset} className="btn-secondary">
          Nova Análise
        </button>
      </div>

      <div className="metrics-summary">
        <div className="metric-card">
          <h3>Potencial de Receita</h3>
          <div className="metric-value">
            +R$ {summary.revenue_potential?.toLocaleString('pt-BR') || '0'}
          </div>
          <div className="metric-subtitle">por mês</div>
        </div>

        <div className="metric-card">
          <h3>Score de Otimização</h3>
          <div className="metric-value">
            {summary.optimization_score || 0}/100
          </div>
          <div className="metric-subtitle">atual</div>
        </div>

        <div className="metric-card">
          <h3>Áreas de Melhoria</h3>
          <div className="metric-value">
            {insights.filter(i => i.priority === 'high').length}
          </div>
          <div className="metric-subtitle">prioritárias</div>
        </div>
      </div>

      <div className="insights-section">
        <h3>Insights e Recomendações</h3>
        <div className="insights-list">
          {insights.map((insight, index) => (
            <div key={index} className={`insight-card priority-${insight.priority}`}>
              <div className="insight-header">
                <h4>{insight.category}</h4>
                <span className="priority-badge">
                  {insight.priority === 'high' ? 'Alta' :
                   insight.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
              
              <p className="insight-description">
                {insight.description}
              </p>
              
              <div className="insight-metrics">
                <div className="metric">
                  <span className="label">Atual</span>
                  <span className="value">
                    {insight.current_value.toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="metric">
                  <span className="label">Otimizado</span>
                  <span className="value">
                    {insight.optimized_value.toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="improvement">
                  +{insight.improvement_percent.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="actions">
        <button className="btn-outline">
          Salvar Análise
        </button>
        <button className="btn-primary">
          Aplicar Otimizações
        </button>
      </div>
    </div>
  );
}

// ✅ CORREÇÃO: Export default separado
export default AnalysisResults;
