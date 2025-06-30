// src/hooks/useGuards.ts
import { useAuth } from '../contexts/AuthContext'

export const useGuards = () => {
  const { isAuthenticated, canPerformAction, user } = useAuth()

  // Safe wrapper para canPerformAction
  const safeCanPerformAction = (action: string): boolean => {
    if (!canPerformAction) return false
    return canPerformAction(action)
  }

  const guards = {
    isAuthenticated: () => isAuthenticated,
    canPerformAction: safeCanPerformAction,
    hasRole: (roles: string | string[]) => {
      const userRole = user?.user_metadata?.role || 'user'
      const allowedRoles = Array.isArray(roles) ? roles : [roles]
      return allowedRoles.includes(userRole)
    },
    hasAnyRole: (roles: string[]) => {
      const userRole = user?.user_metadata?.role || 'user'
      return roles.some(role => role === userRole)
    },
    canAnalyze: () => safeCanPerformAction('analysis'),
    canOptimize: () => safeCanPerformAction('optimizer'),
    canViewReports: () => safeCanPerformAction('reports'),
    requireAuth: (callback: () => void) => {
      if (isAuthenticated) {
        callback()
      } else {
        window.location.href = '/login.html'
      }
    }
  }

  return guards
}
