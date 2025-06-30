// src/contexts/ConfigContext.tsx

import React, { createContext, useContext } from 'react'

interface FluxConfig {
  debugMode: boolean
  planId: string
  apiVersion: string
  environment: 'development' | 'production'
}

const defaultConfig: FluxConfig = {
  debugMode: process.env.NODE_ENV === 'development',
  planId: 'pro',
  apiVersion: 'v1',
  environment: process.env.NODE_ENV === 'development' ? 'development' : 'production'
}

export const ConfigContext = createContext<FluxConfig>(defaultConfig)

export const useFluxConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    return defaultConfig
  }
  return context
}

export const ConfigProvider: React.FC<{ 
  children: React.ReactNode
  value?: Partial<FluxConfig>
}> = ({ children, value = {} }) => {
  const configValue: FluxConfig = { ...defaultConfig, ...value }
  
  return (
    <ConfigContext.Provider value={configValue}>
      {children}
    </ConfigContext.Provider>
  )
}