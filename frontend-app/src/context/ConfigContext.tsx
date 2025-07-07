// src/contexts/ConfigContext.tsx

import React, { createContext, useContext } from 'react';

interface FluxConfig {
  debugMode: boolean;
  // planId: string; // Removido para evitar confusão com o plano dinâmico do usuário
  apiVersion: string;
  environment: 'development' | 'production';
}

const defaultConfig: FluxConfig = {
  debugMode: process.env.NODE_ENV === 'development',
  // planId: 'pro', // Removido
  apiVersion: 'v1',
  environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
};

export const ConfigContext = createContext<FluxConfig>(defaultConfig);

export const useFluxConfig = () => {
  const context = useContext(ConfigContext);
  // Retorna defaultConfig se o contexto não for encontrado (Provider não está acima na árvore)
  // Isso pode acontecer em testes ou se o hook for usado incorretamente.
  return context || defaultConfig;
};

export const ConfigProvider: React.FC<{
  children: React.ReactNode;
  value?: Partial<Omit<FluxConfig, 'planId'>>; // Ajustado para Omit<FluxConfig, 'planId'>
}> = ({ children, value = {} }) => {
  // Certificar que planId não seja passado para configValue
  // TypeScript não permitirá que planId seja passado em 'value' devido a Omit,
  // mas para segurança extra em JavaScript puro ou se o tipo for ignorado:
  const { planId, ...restOfValue } = value as any;
  const configValue: FluxConfig = { ...defaultConfig, ...restOfValue };
  return (
    <ConfigContext.Provider value={configValue}>
      {children}
    </ConfigContext.Provider>
  );
};
