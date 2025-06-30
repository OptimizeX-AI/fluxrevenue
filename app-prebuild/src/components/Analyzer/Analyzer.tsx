// src/components/Analyzer/Analyzer.tsx
import React, { useState, useCallback } from 'react'
import './Analyzer.css'
import { useAuth } from '../../contexts/AuthContext'
import { useFluxData } from '../../hooks/useFluxData'
import FileUpload from './FileUpload'
import SiteSelector from './SiteSelector'
import AnalysisResults from './AnalysisResults'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'


interface Site {
  id: string
  url: string
  last_analysis?: string
  optimization_status?: 'active' | 'pending' | 'inactive'
}

const Analyzer: React.FC = () => {
  const { isAuthenticated } = useAuth()
  
  // ✅ CORREÇÃO: Usar propriedades corretas do useFluxData
  const { 
    sites,           // ✅ Usar sites ao invés de data
    loading, 
    error, 
    uploadAndAnalyze // ✅ Usar uploadAndAnalyze ao invés de analyzeCSV
  } = useFluxData()

  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'results'>('upload')
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileUpload = useCallback(async (csvData: string, filename: string) => {
    if (!selectedSite) {
      alert('Por favor, selecione um site antes de fazer upload do arquivo.')
      return
    }

    setIsAnalyzing(true)
    setCurrentStep('analyze')

    try {
      const result = await uploadAndAnalyze(csvData, selectedSite.url)
      setAnalysisData(result)
      setCurrentStep('results')
    } catch (error) {
      console.error('Erro na análise:', error)
      alert('Erro ao analisar dados. Tente novamente.')
      setCurrentStep('upload')
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedSite, uploadAndAnalyze])

  const handleSiteSelect = useCallback((site: Site) => {
    setSelectedSite(site)
  }, [])

  // ✅ CORREÇÃO: Função para lidar com mudança de site (compatibilidade com SiteSelector)
  const handleSiteChange = useCallback((siteId: string) => {
    const site = sites?.find((s: Site) => s.id === siteId)
    if (site) {
      setSelectedSite(site)
    }
  }, [sites])

  const handleReset = useCallback(() => {
    setCurrentStep('upload')
    setAnalysisData(null)
    setSelectedSite(null)
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="analyzer-container">
        <div className="access-denied">
          <h2>Acesso Negado</h2>
          <p>Você precisa estar logado para acessar o Analyzer.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="analyzer-container">
        <LoadingSpinner message="Carregando analyzer..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="analyzer-container">
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    )
  }

  return (
    <div className="analyzer-container">
      <div className="analyzer-header">
        <h1>Analyzer</h1>
        <p>Analise seus dados do Google AdSense e descubra oportunidades de otimização</p>
      </div>

      <div className="analyzer-progress">
        <div className={`progress-step ${currentStep === 'upload' ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-title">Upload</span>
        </div>
        
        {/* ✅ CORREÇÃO: Lógica de comparação corrigida */}
        <div className={`progress-step ${currentStep === 'analyze' ? 'active' : (currentStep === 'results' ? 'completed' : '')}`}>
          <span className="step-number">2</span>
          <span className="step-title">Análise</span>
        </div>
        
        <div className={`progress-step ${currentStep === 'results' ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-title">Resultados</span>
        </div>
      </div>

      <div className="analyzer-content">
        {currentStep === 'upload' && (
          <div className="upload-section">
            <div className="upload-instructions">
              <h3>Upload do Arquivo CSV</h3>
              <p>Faça upload do arquivo CSV exportado do Google AdSense para análise detalhada.</p>
            </div>

            {/* ✅ CORREÇÃO: Props corretas para SiteSelector */}
            <SiteSelector
              sites={sites || []}
              selectedSite={selectedSite?.id}
              onSiteSelect={(siteUrl: string) => {
                const site = sites?.find((s: Site) => s.url === siteUrl)
                if (site) handleSiteSelect(site)
              }}
              onSiteChange={handleSiteChange} // ✅ Prop obrigatória adicionada
            />

            <FileUpload
              onFileUpload={handleFileUpload}
              isUploading={isAnalyzing}
              disabled={!selectedSite}
            />

            {!selectedSite && (
              <div className="site-warning">
                <p>⚠️ Selecione o site correspondente aos dados do CSV.</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 'analyze' && (
          <div className="analyzing-section">
            <LoadingSpinner message="Analisando dados do AdSense..." />
            <div className="analysis-info">
              <p>Processando dados de {selectedSite?.url}</p>
              <p>Isso pode levar alguns segundos...</p>
            </div>
          </div>
        )}

        {currentStep === 'results' && analysisData && (
          <AnalysisResults 
            data={analysisData} 
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}

export default Analyzer
