// src/contexts/AuthContext.tsx - ENTERPRISE AUTH SYSTEM REFAVORADO

import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useFluxData } from '../hooks/useFluxData';
import { UserProfileData } from '../types/interfaces'; // Para tipar userProfile

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  isReady: boolean;
  user: User | null;
  userProfile: UserProfileData | null; // Expor o perfil completo
  userPlan: string;
  session: Session | null;
  canPerformAction: (action: string) => boolean; // Removido '?' pois sempre será definida
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const { userProfile: fluxUserProfile, loading: fluxDataLoading, updateUserProfile } = useFluxData();

  const isMountedRef = useRef(true);
  const lastSessionTokenRef = useRef<string | null>(null);
  const authSubscriptionRef = useRef<any>(null); // Supabase v2 retorna { data: { subscription } }, não um objeto direto

  // userPlan é derivado do fluxUserProfile
  const userPlan = useMemo(() => {
    if (fluxUserProfile?.plan) {
      if (fluxUserProfile.plan === 'trial' && fluxUserProfile.trial_end_date) {
        const trialEnd = new Date(fluxUserProfile.trial_end_date);
        const now = new Date();
        if (now > trialEnd && fluxUserProfile.subscription_status === 'trialing') {
          console.log('⚠️ AuthContext (via useFluxData): Trial expirado, considerando como free para permissões.');
          // A atualização real do DB para 'free' / 'expired_trial' é feita pela EF check-trial-status
          // ou poderia ser disparada aqui via `updateUserProfile({ plan: 'free', subscription_status: 'expired_trial' })`
          // mas é melhor que check-trial-status seja a fonte da verdade para essa transição.
          return 'free';
        }
      }
      return fluxUserProfile.plan;
    }
    return 'free'; // Fallback se não houver usuário ou plano
  }, [fluxUserProfile]);


  useEffect(() => {
    isMountedRef.current = true;
    let initializationTimeout: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      try {
        if (!isMountedRef.current) return;
        setAuthLoading(true);

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) console.error('❌ AuthContext: Erro ao buscar sessão inicial:', error);
        if (!isMountedRef.current) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setIsAuthReady(true);
        setAuthLoading(false);
        
        if (initialSession?.access_token) {
          lastSessionTokenRef.current = initialSession.access_token;
        }

        const { data: supabaseSubscription } = supabase.auth.onAuthStateChange( // Corrigido para pegar o objeto de subscription
          (event: AuthChangeEvent, newSession: Session | null) => {
            if (!isMountedRef.current) return;

            console.log('🔐 AuthContext: Auth state change:', event, {userId: newSession?.user?.id});

            const tokenChanged = newSession?.access_token !== lastSessionTokenRef.current;
            if (tokenChanged || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
              setSession(newSession);
              setUser(newSession?.user ?? null);
              
              if (newSession?.access_token) {
                lastSessionTokenRef.current = newSession.access_token;
              } else {
                lastSessionTokenRef.current = null;
              }
            }
            
            if (!isAuthReady) setIsAuthReady(true);
            setAuthLoading(false);
          }
        );
        authSubscriptionRef.current = supabaseSubscription; // Armazenar o objeto de subscription

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
      if (authSubscriptionRef.current && typeof authSubscriptionRef.current.unsubscribe === 'function') { // Verificar se é um objeto de subscription
        authSubscriptionRef.current.unsubscribe();
      }
      authSubscriptionRef.current = null;
    };
  }, [isAuthReady]); // Removido user.id daqui, pois o plano vem do fluxData que reage a user.id

  const login = async (email: string, password: string): Promise<void> => { setAuthLoading(true); try { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; console.log('✅ AuthContext: Login realizado com sucesso'); } catch (error) { console.error('❌ AuthContext: Erro no login:', error); throw error; } finally { setAuthLoading(false); } };
  const logout = async (): Promise<void> => { setAuthLoading(true); try { const { error } = await supabase.auth.signOut(); if (error) throw error; console.log('✅ AuthContext: Logout realizado com sucesso'); setUser(null); setSession(null); lastSessionTokenRef.current = null; fluxData.clearFluxCache(); /* Limpar cache do useFluxData no logout */ } catch (error) { console.error('❌ AuthContext: Erro no logout:', error); throw error; } finally { setAuthLoading(false); } };
  const refreshAuth = async (): Promise<void> => { try { const { data: { session : refreshedSession }, error } = await supabase.auth.getSession(); if (error) throw error; setSession(refreshedSession); setUser(refreshedSession?.user ?? null); console.log('✅ AuthContext: Auth refreshed'); } catch (error) { console.error('❌ AuthContext: Erro ao refresh auth:', error); throw error; } };

  const canPerformAction = useCallback((action: string): boolean => {
    if (!user) return false;
    const planPermissions = {
      free: ['basic_actions', 'view_analyzer_free_report'],
      trial: ['basic_actions', 'trial_actions', 'use_analyzer_full', 'use_optimizer_limited'],
      basic: ['basic_actions', 'paid_actions', 'use_analyzer_full', 'use_optimizer_basic'],
      pro: ['basic_actions', 'paid_actions', 'pro_actions', 'use_analyzer_full', 'use_optimizer_full', 'view_advanced_reports'],
      enterprise: ['basic_actions', 'paid_actions', 'pro_actions', 'enterprise_actions', 'all_features']
    };
    const currentPlanForPermissions = userPlan || 'free';
    const userPermissions = planPermissions[currentPlanForPermissions as keyof typeof planPermissions] || ['basic_actions'];
    return userPermissions.includes(action);
  }, [user, userPlan]);

  // O loading combinado considera o carregamento da sessão E o carregamento do perfil do usuário se o usuário estiver logado
  const combinedLoading = authLoading || (!!user && fluxDataLoading('coreUser'));
  // Pronto se a autenticação foi verificada E (não há usuário OU (há usuário E o perfil do fluxData foi carregado))
  const combinedIsReady = isAuthReady && (!user || (!!user && !!fluxUserProfile));


  const value = useMemo(() => ({
    user,
    session,
    loading: combinedLoading,
    isReady: combinedIsReady,
    isAuthenticated: !!user,
    userProfile: fluxUserProfile, // Expor o perfil completo
    userPlan,
    canPerformAction,
    login,
    logout,
    refreshAuth,
  }), [user, session, combinedLoading, combinedIsReady, fluxUserProfile, userPlan, canPerformAction, login, logout, refreshAuth]); // Adicionado login, logout, refreshAuth

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
