import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate
} from 'react-router-dom'

// Context providers
import { AuthProvider } from './contexts/AuthContext'
import { ConfigProvider } from './contexts/ConfigContext'

// UI Components
import { Toaster } from './components/ui/toast'

// Guards
import AuthGuard from './components/guards/AuthGuard'

// Componentes via barrel exports
import Dashboard from './components/Dashboard'
import Analyzer from './components/Analyzer'
import Optimizer from './components/Optimizer'
import Relatorios from './components/Relatorios'
import Configuracoes from './components/Configuracoes'

// CSS Global e navegação
import './index.css'
import './styles/components.css'
import './styles/nav.css'

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <Router basename="/app">
          <AuthGuard>
            {/* Navegação das abas */}
            <nav className="flux-nav">
              <NavLink to="/dashboard" className={({isActive})=> isActive?'active':''}>Dashboard</NavLink>
              <NavLink to="/analyzer" className={({isActive})=> isActive?'active':''}>Analyzer</NavLink>
              <NavLink to="/optimizer" className={({isActive})=> isActive?'active':''}>Optimizer</NavLink>
              <NavLink to="/relatorios" className={({isActive})=> isActive?'active':''}>Relatórios</NavLink>
              <NavLink to="/configuracoes" className={({isActive})=> isActive?'active':''}>Configurações</NavLink>
            </nav>
            <Routes>
              {/* Redireciona “/app” para dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/optimizer" element={<Optimizer />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Routes>
            <Toaster />
          </AuthGuard>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
