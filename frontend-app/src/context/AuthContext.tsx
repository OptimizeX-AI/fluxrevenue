// src/contexts/AuthContext.tsx - ENTERPRISE AUTH SYSTEM REFAVORADO

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useFluxData } from '../hooks/useFluxData'; // Importar useFluxData

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean; // Loading do AuthContext (inicialização da sessão)
  isReady: boolean;   // Se a sessão inicial do Supabase Auth foi verificada
  user: User | null;
  userPlan: string; // Derivado do useFluxData.userProfile
  session: Session | null;
  canPerformAction?: (action: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Renomeado para evitar conflito com loading do useFluxData
  const [isAuthReady, setIsAuthReady] = useState(false); // Renomeado
  
  const fluxData = useFluxData(); // Consumir o hook useFluxData

  const isMountedRef = useRef(true);
  const lastSessionTokenRef = useRef<string | null>(null);
  const authSubscriptionRef = useRef<any>(null);

  // User plan é agora derivado do useFluxData.userProfile
  const userPlan = useMemo(() => {
    if (fluxData.userProfile?.plan) {
      // Lógica para verificar se o trial expirou (se ainda for responsabilidade do frontend)
      // Esta lógica idealmente estaria no backend ou numa função do useFluxData chamada periodicamente.
      // Por simplicidade, vamos assumir que useFluxData.userProfile.plan já reflete o plano correto.
      // Se a lógica de expiração de trial do AuthContext original for mantida, ela precisaria ser adaptada aqui
      // para usar fluxData.userProfile.trial_end_date e possivelmente chamar fluxData.updateUserProfile.
      // Exemplo simplificado:
      if (fluxData.userProfile.plan === 'trial' && fluxData.userProfile.trial_end_date) {
        const trialEnd = new Date(fluxData.userProfile.trial_end_date);
        const now = new Date();
        if (now > trialEnd) {
          console.log('⚠️ AuthContext via useFluxData: Trial expirado, considerando como free para permissões.');
          // A atualização para 'free' no DB deve ser feita pelo useFluxData.updateUserProfile ou backend.
          return 'free';
        }
      }
      return fluxData.userProfile.plan;
    }
    return 'free'; // Fallback
  }, [fluxData.userProfile]);

  // REMOVIDO: useEffect para fetchUserPlan, pois userPlan agora vem de useFluxData

  useEffect(() => {
    isMountedRef.current = true;
    let initializationTimeout: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      try {
        if (!isMountedRef.current) return;
        setAuthLoading(true); // Inicia o loading da autenticação

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) console.error('❌ AuthContext: Erro ao buscar sessão inicial:', error);
        if (!isMountedRef.current) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setIsAuthReady(true); // Autenticação do Supabase está pronta
        setAuthLoading(false); // Finaliza o loading da autenticação
        
        if (initialSession?.access_token) {
          lastSessionTokenRef.current = initialSession.access_token;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event: AuthChangeEvent, newSession: Session | null) => {
            if (!isMountedRef.current) return;

            const tokenChanged = newSession?.access_token !== lastSessionTokenRef.current;
            if (tokenChanged || event === 'SIGNED_OUT') {
              setSession(newSession);
              setUser(newSession?.user ?? null);
              
              if (newSession?.access_token) {
                lastSessionTokenRef.current = newSession.access_token;
              } else {
                lastSessionTokenRef.current = null;
              }
            }
            // Se deslogar, o userPlan será 'free' devido à ausência de fluxData.userProfile.
            // Se logar, o useEffect do useFluxData que depende de user.id vai buscar o userProfile,
            // e o userPlan aqui será atualizado reativamente.
            
            if (!isAuthReady) setIsAuthReady(true);
            setAuthLoading(false); // Garante que o loading termine após qualquer mudança
          }
        );
        authSubscriptionRef.current = subscription;
      } catch (error) {
        console.error('❌ AuthContext: Erro crítico na inicialização:', error);
        if (isMountedRef.current) {
          setSession(null); setUser(null); setIsAuthReady(true); setAuthLoading(false);
        }
      }
    };

    initializationTimeout = setTimeout(() => {
      if (!isAuthReady && isMountedRef.current) {
        console.warn('⚠️ AuthContext: Timeout de inicialização, marcando como ready');
        setIsAuthReady(true); setAuthLoading(false);
      }
    }, 8000);

    initializeAuth();

    return () => {
      isMountedRef.current = false;
      clearTimeout(initializationTimeout);
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, [isAuthReady]); // Dependência simplificada, pois o user não afeta mais diretamente o fetch de plano aqui

  const login = async (email: string, password: string): Promise<void> => { /* ... (sem mudanças) ... */ setAuthLoading(true); try { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; console.log('✅ AuthContext: Login realizado com sucesso'); /* O onAuthStateChange e o useFluxData (via user.id) farão o resto */ } catch (error) { console.error('❌ AuthContext: Erro no login:', error); throw error; } finally { setAuthLoading(false); } };
  const logout = async (): Promise<void> => { /* ... (sem mudanças, exceto que setUserPlan não é mais chamado aqui diretamente) ... */ setAuthLoading(true); try { const { error } = await supabase.auth.signOut(); if (error) throw error; console.log('✅ AuthContext: Logout realizado com sucesso'); setUser(null); setSession(null); lastSessionTokenRef.current = null; /* userPlan será 'free' automaticamente pois fluxData.userProfile será null */ } catch (error) { console.error('❌ AuthContext: Erro no logout:', error); throw error; } finally { setAuthLoading(false); } };
  const refreshAuth = async (): Promise<void> => { /* ... (sem mudanças) ... */ try { const { data: { session : refreshedSession }, error } = await supabase.auth.getSession(); if (error) throw error; setSession(refreshedSession); setUser(refreshedSession?.user ?? null); console.log('✅ AuthContext: Auth refreshed'); } catch (error) { console.error('❌ AuthContext: Erro ao refresh auth:', error); throw error; } };

  const canPerformAction = useCallback((action: string): boolean => {
    if (!user) return false;
    // userPlan é agora uma variável derivada do useFluxData.userProfile
    const planPermissions = {
      free: ['basic_actions'],
      trial: ['basic_actions', 'trial_actions'],
      basic: ['basic_actions', 'paid_actions'],
      pro: ['basic_actions', 'paid_actions', 'pro_actions'],
      enterprise: ['basic_actions', 'paid_actions', 'pro_actions', 'enterprise_actions']
    };
    const currentPlan = userPlan || 'free'; // Fallback se userPlan ainda não estiver carregado
    const userPermissions = planPermissions[currentPlan as keyof typeof planPermissions] || ['basic_actions'];
    return userPermissions.includes(action);
  }, [user, userPlan]);

  const value = useMemo(() => ({
    user,
    session,
    loading: authLoading || (fluxData.loading && !fluxData.userProfile), // Combina loading do auth e do perfil inicial do fluxData
    isReady: isAuthReady && (!!fluxData.userProfile || !user), // Pronto se auth está pronto E (perfil carregado OU não há usuário)
    isAuthenticated: !!user,
    userPlan, // Derivado
    canPerformAction,
    login,
    logout,
    refreshAuth,
  }), [user, session, authLoading, isAuthReady, userPlan, canPerformAction, fluxData.loading, fluxData.userProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
