// src/components/Optimizer.tsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFluxConfig } from '../contexts/ConfigContext'
import { supabase } from '../lib/supabaseClient'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import './Optimizer.css'

// ✅ CORREÇÃO: Interfaces adequadas para arrays
interface OptimizationTask {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  adsense_analyses: Array<{ file_name: string }> // ✅ Array com objetos que contêm file_name
  sites: Array<{ url: string }> // ✅ Array com objetos que contêm url
}

interface GeneratedScript {
  id: string
  script_content: string
  site_url: string
  created_at: string
}

const Optimizer: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const { debugMode } = useFluxConfig()
  
  const [tasks, setTasks] = useState<OptimizationTask[]>([])
  const [scripts, setScripts] = useState<GeneratedScript[]>([])
  const [optimizerLoading, setOptimizerLoading] = useState(true)
  const [optimizerError, setOptimizerError] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [generatedScript, setGeneratedScript] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchData = async () => {
      try {
        setOptimizerLoading(true)
        
        // Buscar tarefas de otimização
        const { data: tasks, error: tasksError } = await supabase
          .from('optimization_tasks')
          .select(`
            id,
            status,
            created_at,
            completed_at,
            adsense_analyses (file_name),
            sites (url)
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })

        if (tasksError) throw tasksError

        // Buscar scripts gerados
        const { data: configs, error: configsError } = await supabase
          .from('optimization_configs')
          .select('id, script_content, site_url, created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })

        if (configsError) throw configsError

        // ✅ CORREÇÃO: Garantir que os dados correspondam às interfaces
        const formattedTasks: OptimizationTask[] = (tasks || []).map(task => ({
          id: task.id,
          status: task.status,
          created_at: task.created_at,
          completed_at: task.completed_at,
          adsense_analyses: Array.isArray(task.adsense_analyses) 
            ? task.adsense_analyses 
            : [],
          sites: Array.isArray(task.sites) 
            ? task.sites 
            : []
        }))

        setTasks(formattedTasks)
        setScripts(configs || [])
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setOptimizerError('Erro ao carregar dados de otimização')
      } finally {
        setOptimizerLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user?.id])

  const handleGenerateScript = async () => {
    if (!selectedSite) {
      alert('Selecione um site primeiro')
      return
    }

    setIsGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('flux-optimizer-engine', {
        body: { site_url: selectedSite, action: 'generate_script' }
      })

      if (error) throw error

      setGeneratedScript(data.script_content || '')
    } catch (error) {
      console.error('Erro ao gerar script:', error)
      alert('Erro ao gerar script. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="optimizer-container">
        <div className="access-denied">
          <h2>Acesso Negado</h2>
          <p>Você precisa estar logado para acessar o Optimizer.</p>
        </div>
      </div>
    )
  }

  if (optimizerLoading) {
    return (
      <div className="optimizer-container">
        <LoadingSpinner message="Carregando dados de otimização..." />
      </div>
    )
  }

  if (optimizerError) {
    return (
      <div className="optimizer-container">
        <ErrorMessage 
          message={optimizerError} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    )
  }

  return (
    <div className="optimizer-container">
      <div className="optimizer-header">
        <h1>Optimizer</h1>
        <p>Maximize sua receita AdSense com otimizações automáticas e scripts personalizados.</p>
        
        {debugMode && (
          <div className="debug-banner">
            🔧 Modo debug ativo - Dados de desenvolvimento
          </div>
        )}
      </div>

      <div className="optimizer-content">
        <section className="optimization-tasks">
          <h2>Tarefas de Otimização</h2>
          
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>Quando você executar uma otimização, ela aparecerá aqui.</p>
            </div>
          ) : (
            <div className="tasks-list">
              {tasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-header">
                    <span className={`status ${task.status}`}>
                      {task.status === 'completed' ? '✅ Concluída' : 
                       task.status === 'processing' ? '⚙️ Processando' :
                       task.status === 'failed' ? '❌ Falhou' : '⏳ Pendente'}
                    </span>
                    <div className="task-dates">
                      Criado: {formatDate(task.created_at)}
                      {task.completed_at && (
                        <span> | Concluído: {formatDate(task.completed_at)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="task-details">
                    <div className="task-files">
                      <strong>Arquivos analisados:</strong>
                      {task.adsense_analyses.map((analysis, index) => (
                        <span key={index} className="file-name">
                          {analysis.file_name}
                        </span>
                      ))}
                    </div>
                    
                    <div className="task-sites">
                      <strong>Sites:</strong>
                      {task.sites.map((site, index) => (
                        <span key={index} className="site-url">
                          {site.url}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="script-generator">
          <h2>Gerador de Scripts</h2>
          <p>Adicione este pequeno trecho de código ao seu site para ativar as otimizações automáticas. 
             Ele busca o script mais recente e otimizado para o seu domínio.</p>

          <div className="script-controls">
            <select 
              value={selectedSite} 
              onChange={(e) => setSelectedSite(e.target.value)}
              className="site-selector"
            >
              <option value="">Selecione um site</option>
              {scripts.map(script => (
                <option key={script.id} value={script.site_url}>
                  {script.site_url}
                </option>
              ))}
            </select>

            <button 
              onClick={handleGenerateScript}
              disabled={!selectedSite || isGenerating}
              className="generate-btn"
            >
              {isGenerating ? 'Gerando...' : 'Gerar Script'}
            </button>
          </div>

          {generatedScript && (
            <div className="generated-script">
              <h3>Script Gerado</h3>
              <div className="script-container">
                <pre><code>{generatedScript}</code></pre>
                <button 
                  onClick={() => navigator.clipboard.writeText(generatedScript)}
                  className="copy-btn"
                >
                  Copiar
                </button>
              </div>
              
              <div className="implementation-guide">
                <h4>Como implementar:</h4>
                <ol>
                  <li>Copie o código acima</li>
                  <li>Cole no <code>&lt;head&gt;</code> do seu site (antes da tag <code>&lt;/head&gt;</code>)</li>
                  <li>Publique as alterações</li>
                </ol>
              </div>
            </div>
          )}

          {!generatedScript && !selectedSite && (
            <div className="script-placeholder">
              <p>Clique em "Gerar Script" para criar o código de otimização.</p>
            </div>
          )}

          {!generatedScript && selectedSite && (
            <div className="script-instructions">
              <p>Selecione um site para gerar seu código de otimização.</p>
              <p>Certifique-se de que o site esteja configurado corretamente no sistema.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Optimizer
