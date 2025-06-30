// src/components/Configuracoes.tsx
import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFluxConfig } from '../contexts/ConfigContext'
import { useFluxData } from '../hooks/useFluxData'
import { format } from 'date-fns'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import { useToast } from '../hooks/use-toast'

interface SiteData {
  id: string
  url: string
  created_at: string
  user_id: string
  last_analysis?: string
  optimization_status?: 'active' | 'pending' | 'inactive'
  revenue_increase?: number
}

interface SettingsCardProps {
  title: string
  description: string
  children: React.ReactNode
}

const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, children }) => {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="settings-card-content">
        {children}
      </div>
    </div>
  )
}

const Configuracoes: React.FC = () => {
  const { user, logout } = useAuth()
  const { debugMode, planId } = useFluxConfig()
  const { 
    sites, 
    userSettings, 
    loading, 
    error, 
    updateUserSettings,
    addSite 
  } = useFluxData()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [newSiteUrl, setNewSiteUrl] = useState('')

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSettings = async (newSettings: any) => {
    setIsUpdating(true)
    try {
      await updateUserSettings(newSettings)
      toast({
        title: "Configurações atualizadas",
        description: "Suas preferências foram salvas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddSite = async () => {
    if (!newSiteUrl.trim()) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive",
      })
      return
    }

    try {
      await addSite(newSiteUrl)
      setNewSiteUrl('')
      toast({
        title: "Site adicionado",
        description: `${newSiteUrl} foi adicionado com sucesso.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar site",
        description: "Não foi possível adicionar o site.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="configuracoes-loading">
        <LoadingSpinner />
        <p>Carregando configurações...</p>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="configuracoes-container">
      <div className="configuracoes-header">
        <h1>Configurações</h1>
        <p>Gerencie suas preferências e configurações da conta</p>
      </div>

      {debugMode && (
        <div className="debug-banner">
          🔧 Modo debug ativo - Ambiente de desenvolvimento
        </div>
      )}

      <div className="configuracoes-content">
        <SettingsCard 
          title="Perfil" 
          description="Informações da sua conta"
        >
          <div className="profile-info">
            <div className="user-avatar">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                </div>
              )}
            </div>
            <div className="user-details">
              <h4>{user?.user_metadata?.full_name || 'Usuário'}</h4>
              <p>{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              Sair
            </button>
          </div>
        </SettingsCard>

        <SettingsCard 
          title="Preferências" 
          description="Configure suas preferências de notificações e relatórios"
        >
          <div className="preferences-form">
            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={userSettings?.notifications_enabled || false}
                onChange={(e) => handleUpdateSettings({
                  notifications_enabled: e.target.checked
                })}
                disabled={isUpdating}
              />
              <span>Receber notificações por email</span>
            </label>

            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={userSettings?.auto_optimization || false}
                onChange={(e) => handleUpdateSettings({
                  auto_optimization: e.target.checked
                })}
                disabled={isUpdating}
              />
              <span>Otimização automática</span>
            </label>

            <div className="form-group">
              <label htmlFor="report-frequency">Frequência de relatórios:</label>
              <select
                id="report-frequency"
                value={userSettings?.report_frequency || 'weekly'}
                onChange={(e) => handleUpdateSettings({
                  report_frequency: e.target.value
                })}
                disabled={isUpdating}
              >
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard 
          title="Sites" 
          description="Gerencie os sites conectados ao Flux Revenue"
        >
          <div className="sites-management">
            <div className="add-site-form">
              <input
                type="url"
                placeholder="https://exemplo.com"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                className="site-input"
              />
              <button onClick={handleAddSite} className="btn-primary">
                Adicionar Site
              </button>
            </div>

            <div className="sites-list">
              {sites && sites.length > 0 ? (
                sites.map((site: SiteData) => (
                  <div key={site.id} className="site-item">
                    <div className="site-info">
                      <h4>{site.url}</h4>
                      <p>Adicionado em {format(new Date(site.created_at), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="site-actions">
                      <button className="btn-secondary btn-sm">
                        Configurar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>Nenhum site cadastrado.</p>
              )}
            </div>
          </div>
        </SettingsCard>

        <SettingsCard 
          title="Plano" 
          description="Informações sobre seu plano atual"
        >
          <div className="plan-info">
            <div className="current-plan">
              <h4>Plano {planId === 'pro' ? 'Pro' : 'Free'}</h4>
              <p>Renovação em 12/12/2025</p>
            </div>
            <button className="btn-primary">
              Gerenciar Plano
            </button>
          </div>
        </SettingsCard>
      </div>
    </div>
  )
}

export default Configuracoes
