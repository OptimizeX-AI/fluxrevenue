// src/contexts/AuthContext.tsx - ENTERPRISE AUTH SYSTEM CORRIGIDO

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  isReady: boolean;
  user: User | null;
  userPlan: string;
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
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  
  // ✅ Refs para controlar estado
  const isMountedRef = useRef(true);
  const lastSessionTokenRef = useRef<string | null>(null);
  const authSubscriptionRef = useRef<any>(null);

  // ✅ Enhanced user plan fetching com campo correto
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user?.id) {
        setUserPlan('free');
        return;
      }

      try {
        console.log('📊 AuthContext: Buscando plano do usuário...');
        
        // ✅ CORREÇÃO: Usar trial_end_date (campo correto do schema)
        const { data, error } = await supabase
          .from('clients')
          .select('plan, subscription_status, trial_end_date')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          let plan = data.plan || 'free';
          console.log(`✅ AuthContext: Plano do usuário: ${plan}`);
          
          // ✅ CORREÇÃO: Verificar trial_end_date se necessário
          if (data.trial_end_date && plan === 'trial') {
            const trialEnd = new Date(data.trial_end_date);
            const now = new Date();
            if (now > trialEnd) {
              console.log('⚠️ AuthContext: Trial expirado, alterando para free');
              plan = 'free';
              
              // Opcionalmente atualizar no banco
              try {
                await supabase
                  .from('clients')
                  .update({ plan: 'free' })
                  .eq('id', user.id);
              } catch (updateError) {
                console.warn('⚠️ Erro ao atualizar plano expirado:', updateError);
              }
            }
          }
          
          setUserPlan(plan);
        } else {
          console.warn('⚠️ AuthContext: Usando plano padrão:', error?.message);
          setUserPlan('free');
        }
      } catch (error) {
        console.error('❌ AuthContext: Erro ao buscar plano do usuário:', error);
        setUserPlan('free');
      }
    };

    fetchUserPlan();
  }, [user?.id]);

  // ✅ Inicialização
  useEffect(() => {
    let initializationTimeout: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthContext: Inicializando autenticação...');
        
        if (!isMountedRef.current) return;

        // ✅ Obter sessão inicial
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthContext: Erro ao buscar sessão:', error);
        }

        if (!isMountedRef.current) return;

        console.log('📊 AuthContext: Sessão inicial:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        });

        // ✅ Definir estado inicial
        setSession(session);
        setUser(session?.user ?? null);
        setIsReady(true);
        setLoading(false);
        
        if (session?.access_token) {
          lastSessionTokenRef.current = session.access_token;
        }

        // ✅ Auth state change listener
        let lastEventTime = 0;
        let lastEventType = '';
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event: AuthChangeEvent, newSession: Session | null) => {
            const now = Date.now();
            const eventKey = `${event}-${newSession?.access_token?.slice(-8) || 'null'}`;
            
            // ✅ Throttle
            if (eventKey === lastEventType && (now - lastEventTime) < 1000) {
              console.log('🔄 AuthContext: Auth event throttled:', event);
              return;
            }
            
            lastEventTime = now;
            lastEventType = eventKey;
            
            console.log('🔐 AuthContext: Auth state change:', event, {
              hasSession: !!newSession,
              userId: newSession?.user?.id,
              tokenChanged: newSession?.access_token !== lastSessionTokenRef.current
            });

            if (!isMountedRef.current) return;

            // ✅ Só atualizar se token mudou
            const tokenChanged = newSession?.access_token !== lastSessionTokenRef.current;
            
            if (tokenChanged || event === 'SIGNED_OUT') {
              setSession(newSession);
              setUser(newSession?.user ?? null);
              
              if (event === 'SIGNED_OUT') {
                setUserPlan('free');
              }
              
              if (newSession?.access_token) {
                lastSessionTokenRef.current = newSession.access_token;
              } else {
                lastSessionTokenRef.current = null;
              }
            }
            
            if (!isReady) {
              setIsReady(true);
            }
            
            setLoading(false);
          }
        );

        authSubscriptionRef.current = subscription;
        
      } catch (error) {
        console.error('❌ AuthContext: Erro crítico na inicialização:', error);
        
        if (isMountedRef.current) {
          setSession(null);
          setUser(null);
          setUserPlan('free');
          setIsReady(true);
          setLoading(false);
        }
      }
    };

    // ✅ Timeout de segurança
    initializationTimeout = setTimeout(() => {
      if (!isReady && isMountedRef.current) {
        console.warn('⚠️ AuthContext: Timeout de inicialização, marcando como ready');
        setIsReady(true);
        setLoading(false);
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
  }, [isReady]);

  // ✅ Login function
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('✅ AuthContext: Login realizado com sucesso');
    } catch (error) {
      console.error('❌ AuthContext: Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout function
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('✅ AuthContext: Logout realizado com sucesso');
      
      setUser(null);
      setSession(null);
      setUserPlan('free');
      lastSessionTokenRef.current = null;
      
    } catch (error) {
      console.error('❌ AuthContext: Erro no logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Refresh auth function
  const refreshAuth = async (): Promise<void> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      console.log('✅ AuthContext: Auth refreshed');
    } catch (error) {
      console.error('❌ AuthContext: Erro ao refresh auth:', error);
      throw error;
    }
  };

  // ✅ Enhanced permissions
  const canPerformAction = (action: string): boolean => {
    if (!user) return false;
    
    const planPermissions = {
      free: ['basic_actions'],
      trial: ['basic_actions', 'trial_actions'],
      basic: ['basic_actions', 'paid_actions'],
      pro: ['basic_actions', 'paid_actions', 'pro_actions'],
      enterprise: ['basic_actions', 'paid_actions', 'pro_actions', 'enterprise_actions']
    };
    
    const userPermissions = planPermissions[userPlan as keyof typeof planPermissions] || ['basic_actions'];
    return userPermissions.includes(action);
  };

  // ✅ Memoized value
  const value = useMemo(() => ({
    user,
    session,
    loading,
    isReady,
    isAuthenticated: !!user,
    userPlan,
    canPerformAction,
    login,
    logout,
    refreshAuth,
  }), [user, session, loading, isReady, userPlan]);

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

