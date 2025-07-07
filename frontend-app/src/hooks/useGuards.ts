// src/hooks/useGuards.ts - ENTERPRISE PERMISSION SYSTEM CORRIGIDO

import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';

type Permission = string;
type Role = 'user' | 'admin' | 'moderator' | 'viewer';

interface GuardResult {
  allowed: boolean;
  reason?: string;
}

interface GuardOptions {
  requireAll?: boolean;
  strict?: boolean;
}

export const useGuards = () => {
  const { isAuthenticated, canPerformAction, user, userPlan } = useAuth();

  // ✅ CORREÇÃO: Safe action checker melhorado
  const safeCanPerformAction = (action: string): boolean => {
    if (!isAuthenticated) return false;
    if (!user) return false;
    if (typeof canPerformAction !== 'function') {
      console.warn('⚠️ canPerformAction não é uma função');
      return false;
    }
    return canPerformAction(action);
  };

  // ✅ CORREÇÃO: Role checker melhorado
  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    const userRole = user?.user_metadata?.role || user?.app_metadata?.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(userRole);
  };

  // ✅ Plan checker
  const hasPlan = (plans: string | string[]): boolean => {
    if (!user || !userPlan) return false;
    
    const allowedPlans = Array.isArray(plans) ? plans : [plans];
    return allowedPlans.includes(userPlan);
  };

  // ✅ Enhanced permission checker
  const hasPermission = (permission: Permission, options: GuardOptions = {}): GuardResult => {
    const { strict = false } = options;
    
    if (!isAuthenticated) {
      return { allowed: false, reason: 'Usuário não autenticado' };
    }
    
    if (!user) {
      return { allowed: false, reason: 'Dados do usuário não encontrados' };
    }

    // ✅ CORREÇÃO: Verificação robusta
    if (!safeCanPerformAction(permission)) {
      return { 
        allowed: false, 
        reason: strict ? `Permissão '${permission}' negada para plano '${userPlan}'` : 'Acesso negado'
      };
    }

    return { allowed: true };
  };

  // ✅ Multiple permissions checker
  const hasPermissions = (permissions: Permission[], options: GuardOptions = {}): GuardResult => {
    const { requireAll = true, strict = false } = options;
    
    if (!isAuthenticated) {
      return { allowed: false, reason: 'Usuário não autenticado' };
    }

    const results = permissions.map(permission => hasPermission(permission, { strict }));
    
    if (requireAll) {
      const failed = results.find(r => !r.allowed);
      return failed || { allowed: true };
    } else {
      const passed = results.find(r => r.allowed);
      return passed || { allowed: false, reason: 'Nenhuma permissão concedida' };
    }
  };

  // ✅ Plan-specific guards
  const planGuards = useMemo(() => ({
    isFree: userPlan === 'free',
    isTrial: userPlan === 'trial',
    isPaid: ['basic', 'pro', 'enterprise'].includes(userPlan),
    isPro: ['pro', 'enterprise'].includes(userPlan),
    isEnterprise: userPlan === 'enterprise',
    canUpgrade: !['enterprise'].includes(userPlan),
    trialExpired: () => {
      if (!user || userPlan !== 'trial') return false;
      // Lógica de verificação de trial expirado seria implementada aqui
      return false;
    }
  }), [userPlan, user]);

  // ✅ Feature flags
  const featureFlags = useMemo(() => ({
    canAnalyze: safeCanPerformAction('analyze_adsense'),
    canOptimize: safeCanPerformAction('optimize_adsense'),
    canExport: safeCanPerformAction('export_reports'),
    canAccessAPI: safeCanPerformAction('access_api'),
    canManageTeam: safeCanPerformAction('manage_team'),
    canViewAnalytics: safeCanPerformAction('view_analytics'),
    canCreateSites: safeCanPerformAction('create_sites'),
    canDeleteSites: safeCanPerformAction('delete_sites'),
    canManageIntegrations: safeCanPerformAction('manage_integrations'),
    canAccessAdvancedFeatures: safeCanPerformAction('access_advanced_features')
  }), [safeCanPerformAction]);

  // ✅ Route guards
  const routeGuards = useMemo(() => ({
    canAccessDashboard: isAuthenticated,
    canAccessAnalyzer: isAuthenticated && safeCanPerformAction('analyze_adsense'),
    canAccessOptimizer: isAuthenticated && safeCanPerformAction('optimize_adsense'),
    canAccessReports: isAuthenticated && safeCanPerformAction('view_analytics'),
    canAccessSettings: isAuthenticated,
    canAccessAdmin: isAuthenticated && hasRole(['admin']),
    canAccessBilling: isAuthenticated && planGuards.isPaid
  }), [isAuthenticated, safeCanPerformAction, hasRole, planGuards.isPaid]);

  // ✅ Main guards object
  const guards = useMemo(() => ({
    // Basic checks
    isAuthenticated: () => isAuthenticated,
    isReady: () => isAuthenticated && !!user,
    
    // Permission checks
    canPerformAction: safeCanPerformAction,
    hasPermission,
    hasPermissions,
    
    // Role checks
    hasRole,
    isAdmin: () => hasRole(['admin']),
    isModerator: () => hasRole(['admin', 'moderator']),
    isUser: () => hasRole(['user', 'admin', 'moderator']),
    
    // Plan checks
    hasPlan,
    ...planGuards,
    
    // Feature flags
    features: featureFlags,
    
    // Route guards
    routes: routeGuards,
    
    // Helper functions
    require: (condition: boolean, message?: string) => {
      if (!condition) {
        throw new Error(message || 'Acesso negado');
      }
      return true;
    },
    
    guard: (permission: Permission, fallback?: () => void): boolean => {
      const result = hasPermission(permission);
      if (!result.allowed && fallback) {
        fallback();
      }
      return result.allowed;
    },
    
    // Debug info
    getDebugInfo: () => ({
      isAuthenticated,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || user.app_metadata?.role || 'user'
      } : null,
      userPlan,
      permissions: Object.keys(featureFlags).filter(key => 
        featureFlags[key as keyof typeof featureFlags]
      )
    })
  }), [
    isAuthenticated, 
    user, 
    userPlan, 
    safeCanPerformAction, 
    hasPermission, 
    hasPermissions, 
    hasRole, 
    hasPlan, 
    planGuards, 
    featureFlags, 
    routeGuards
  ]);

  return guards;
};

// ✅ Hook para componentes que precisam de permissões específicas
export const useRequirePermission = (permission: Permission) => {
  const { hasPermission } = useGuards();
  
  const result = hasPermission(permission);
  
  if (!result.allowed) {
    console.warn(`⚠️ Permissão '${permission}' negada:`, result.reason);
  }
  
  return result;
};

// ✅ Hook para múltiplas permissões
export const useRequirePermissions = (permissions: Permission[], requireAll = true) => {
  const { hasPermissions } = useGuards();
  
  const result = hasPermissions(permissions, { requireAll });
  
  if (!result.allowed) {
    console.warn(`⚠️ Permissões negadas:`, result.reason);
  }
  
  return result;
};

export default useGuards;
