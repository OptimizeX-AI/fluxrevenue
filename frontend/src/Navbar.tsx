// src/components/Navbar.tsx - ENTERPRISE NAVIGATION SYSTEM
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useFluxData } from '../hooks/useFluxData';
import { supabase } from '../lib/supabaseClient';

// === INTERFACES ===
interface NotificationData {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    path: string;
  };
}

interface UserStatus {
  plan: string;
  trialDaysLeft?: number;
  analysesUsed: number;
  analysesLimit: number;
  sitesCount: number;
}

// === ANIMATION KEYFRAMES ===
const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const pulseNotification = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const shimmerEffect = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// === STYLED COMPONENTS ENTERPRISE ===
const NavContainer = styled.nav`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    padding: 0 16px;
    height: 64px;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #007AFF 0%, #30D158 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #007AFF 0%, #30D158 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.24);
`;

const NavLinks = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const NavLink = styled.button<{ 
  active: boolean; 
  hasIndicator?: boolean;
}>`
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)' : 
    'transparent'};
  color: ${props => props.active ? '#FFFFFF' : '#1D1D1F'};
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  
  ${props => props.active && css`
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.24);
  `}
  
  ${props => props.hasIndicator && css`
    &::after {
      content: '';
      position: absolute;
      top: 8px;
      right: 8px;
      width: 6px;
      height: 6px;
      background: #30D158;
      border-radius: 50%;
      animation: ${pulseNotification} 2s infinite;
    }
  `}
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, #0056CC 0%, #007AFF 100%)' : 
      'rgba(0, 122, 255, 0.05)'};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const NavLinkIcon = styled.span`
  font-size: 16px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusIndicator = styled.div<{ plan: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${props => {
    switch (props.plan) {
      case 'enterprise': return 'linear-gradient(135deg, rgba(175, 82, 222, 0.1) 0%, rgba(191, 90, 242, 0.1) 100%)';
      case 'pro': return 'linear-gradient(135deg, rgba(48, 209, 88, 0.1) 0%, rgba(52, 199, 89, 0.1) 100%)';
      case 'basic': return 'linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 159, 10, 0.1) 100%)';
      case 'trial': return 'linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(10, 132, 255, 0.1) 100%)';
      default: return 'linear-gradient(135deg, rgba(142, 142, 147, 0.1) 0%, rgba(174, 174, 178, 0.1) 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.plan) {
      case 'enterprise': return 'rgba(175, 82, 222, 0.2)';
      case 'pro': return 'rgba(48, 209, 88, 0.2)';
      case 'basic': return 'rgba(255, 149, 0, 0.2)';
      case 'trial': return 'rgba(0, 122, 255, 0.2)';
      default: return 'rgba(142, 142, 147, 0.2)';
    }
  }};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => {
    switch (props.plan) {
      case 'enterprise': return '#AF52DE';
      case 'pro': return '#30D158';
      case 'basic': return '#FF9500';
      case 'trial': return '#007AFF';
      default: return '#8E8E93';
    }
  }};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NotificationButton = styled.button<{ hasNotifications: boolean }>`
  position: relative;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: rgba(0, 122, 255, 0.05);
  border: 1px solid rgba(0, 122, 255, 0.1);
  color: #007AFF;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${props => props.hasNotifications && css`
    animation: ${pulseNotification} 2s infinite;
    
    &::after {
      content: '';
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      background: #FF3B30;
      border-radius: 50%;
      border: 2px solid white;
    }
  `}
  
  &:hover {
    background: rgba(0, 122, 255, 0.1);
    transform: scale(1.05);
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border: none;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 122, 255, 0.05);
  }
`;

const UserAvatar = styled.div<{ plan: string }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${props => {
    switch (props.plan) {
      case 'enterprise': return 'linear-gradient(135deg, #AF52DE 0%, #BF5AF2 100%)';
      case 'pro': return 'linear-gradient(135deg, #30D158 0%, #34C759 100%)';
      case 'basic': return 'linear-gradient(135deg, #FF9500 0%, #FF9F0A 100%)';
      case 'trial': return 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)';
      default: return 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 100%)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    background: ${props => {
      switch (props.plan) {
        case 'enterprise': return 'linear-gradient(135deg, #AF52DE, #BF5AF2)';
        case 'pro': return 'linear-gradient(135deg, #30D158, #34C759)';
        default: return 'none';
      }
    }};
    border-radius: 14px;
    z-index: -1;
    opacity: 0.3;
  }
`;

const UserInfo = styled.div`
  text-align: left;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1D1D1F;
  line-height: 1.2;
`;

const UserPlan = styled.div`
  font-size: 12px;
  color: #6D6D70;
  text-transform: capitalize;
`;

const Dropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 8px;
  min-width: 200px;
  z-index: 1000;
  
  transform: ${props => props.isOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.95)'};
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  animation: ${props => props.isOpen ? css`${slideDown} 0.2s ease forwards` : 'none'};
`;

// Continuação do DropdownItem e restante do código...

const DropdownItem = styled.button<{ variant?: 'danger' }>`
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${props => props.variant === 'danger' ? '#FF3B30' : '#1D1D1F'};
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:hover {
    background: ${props => props.variant === 'danger' ? 
      'rgba(255, 59, 48, 0.05)' : 
      'rgba(0, 122, 255, 0.05)'};
    transform: translateX(4px);
  }
`;

const DropdownDivider = styled.hr`
  border: none;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 8px 0;
`;

const NotificationDropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 16px;
  width: 320px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  
  transform: ${props => props.isOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.95)'};
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  animation: ${props => props.isOpen ? css`${slideDown} 0.2s ease forwards` : 'none'};
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`;

const NotificationTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
`;

const MarkAllRead = styled.button`
  background: none;
  border: none;
  color: #007AFF;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
  
  &:hover {
    background: rgba(0, 122, 255, 0.05);
  }
`;

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NotificationItem = styled.div<{ read: boolean; type: string }>`
  padding: 12px;
  border-radius: 12px;
  background: ${props => {
    if (props.read) return 'transparent';
    switch (props.type) {
      case 'success': return 'rgba(48, 209, 88, 0.05)';
      case 'warning': return 'rgba(255, 149, 0, 0.05)';
      case 'error': return 'rgba(255, 59, 48, 0.05)';
      default: return 'rgba(0, 122, 255, 0.05)';
    }
  }};
  border: 1px solid ${props => {
    if (props.read) return 'transparent';
    switch (props.type) {
      case 'success': return 'rgba(48, 209, 88, 0.1)';
      case 'warning': return 'rgba(255, 149, 0, 0.1)';
      case 'error': return 'rgba(255, 59, 48, 0.1)';
      default: return 'rgba(0, 122, 255, 0.1)';
    }
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  ${props => !props.read && css`
    &::before {
      content: '';
      position: absolute;
      top: 12px;
      right: 12px;
      width: 8px;
      height: 8px;
      background: #007AFF;
      border-radius: 50%;
    }
  `}
`;

const NotificationIcon = styled.div<{ type: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-bottom: 8px;
  background: ${props => {
    switch (props.type) {
      case 'success': return 'rgba(48, 209, 88, 0.1)';
      case 'warning': return 'rgba(255, 149, 0, 0.1)';
      case 'error': return 'rgba(255, 59, 48, 0.1)';
      default: return 'rgba(0, 122, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#30D158';
      case 'warning': return '#FF9500';
      case 'error': return '#FF3B30';
      default: return '#007AFF';
    }
  }};
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationItemTitle = styled.h5`
  font-size: 14px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 4px 0;
  line-height: 1.3;
`;

const NotificationMessage = styled.p`
  font-size: 13px;
  color: #6D6D70;
  margin: 0 0 8px 0;
  line-height: 1.4;
`;

const NotificationTime = styled.span`
  font-size: 11px;
  color: #8E8E93;
  font-weight: 500;
`;

const NotificationAction = styled.button`
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.15s ease;
  
  &:hover {
    background: #0056CC;
  }
`;

const EmptyNotifications = styled.div`
  text-align: center;
  padding: 24px;
  color: #6D6D70;
`;

const EmptyIcon = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.6;
`;

const EmptyText = styled.p`
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
`;

const MobileMenuButton = styled.button`
  display: none;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: rgba(0, 122, 255, 0.05);
  border: 1px solid rgba(0, 122, 255, 0.1);
  color: #007AFF;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 1024px) {
    display: flex;
  }
  
  &:hover {
    background: rgba(0, 122, 255, 0.1);
    transform: scale(1.05);
  }
`;

const MobileMenu = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 72px;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 16px;
  z-index: 999;
  
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-100%)'};
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (min-width: 1025px) {
    display: none;
  }
`;

const MobileNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MobileNavLink = styled.button<{ active: boolean }>`
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-radius: 12px;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)' : 
    'transparent'};
  color: ${props => props.active ? '#FFFFFF' : '#1D1D1F'};
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 16px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, #0056CC 0%, #007AFF 100%)' : 
      'rgba(0, 122, 255, 0.05)'};
  }
`;

// === COMPONENT PRINCIPAL ===
const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { sites, refreshData } = useFluxData();

  // ✅ Estados otimizados
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    plan: 'free',
    analysesUsed: 0,
    analysesLimit: 3,
    sitesCount: 0
  });

  // ✅ Fetch user status and notifications
  useEffect(() => {
    const fetchUserData = async () => {
  if (!user?.id) return;
  try {
    // ✅ CORREÇÃO: Usar campos corretos e .maybeSingle()
    const [clientResult, rateLimitResult, notificationsResult] = await Promise.allSettled([
      supabase.from('clients').select('*').eq('id', user.id).maybeSingle(), // ✅ CORRETO
      supabase.from('rate_limits').select('*').eq('user_id', user.id).maybeSingle(), // ✅ CORRETO
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10) // ✅ CORRETO
    ]);

    // ✅ Process results safely
    if (clientResult.status === 'fulfilled' && clientResult.value.data) {
      const client = clientResult.value.data;          
          // Calculate trial days left
          let trialDaysLeft: number | undefined; // ✅ Tipagem explícita
if (client.trial_end) {
  const trialEnd = new Date(client.trial_end);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  trialDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}
          setUserStatus(prev => ({
            ...prev,
            plan: client.plan,
            trialDaysLeft,
            sitesCount: sites?.length || 0
          }));
        }

        // Process rate limits
      if (rateLimitResult.status === 'fulfilled' && rateLimitResult.value.data) {
      const rateLimit = rateLimitResult.value.data;
      setUserStatus(prev => ({
        ...prev,
        analysesUsed: rateLimit.count || 0, // ✅ CORRETO: usar 'count' do schema
        analysesLimit: rateLimit.analyses_limit || 10
      }));
    }

    if (notificationsResult.status === 'fulfilled' && notificationsResult.value.data) {
              const notificationsData = notificationsResult.value.data.map((notif: any) => ({
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            timestamp: notif.created_at,
            read: notif.read,
            action: notif.action_url ? {
              label: notif.action_label || 'Ver',
              path: notif.action_url
            } : undefined
          }));
          setNotifications(notificationsData);
        }

      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    };

    fetchUserData();
  }, [user?.id, sites?.length]);

  // ✅ Setup real-time subscriptions for notifications
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification: NotificationData = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            timestamp: payload.new.created_at,
            read: false,
            action: payload.new.action_url ? {
              label: payload.new.action_label || 'Ver',
              path: payload.new.action_url
            } : undefined
          };
          
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // ✅ Memoized values
  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const currentPath = useMemo(() => {
    return location.pathname;
  }, [location.pathname]);

  const userInitials = useMemo(() => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  }, [user?.email]);

  // ✅ Navigation functions
  const navigateTo = useCallback((path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  }, [navigate]);

  const handlelogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [logout, navigate]);

  // ✅ Notification functions
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds);

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, [notifications]);

  const handleNotificationClick = useCallback((notification: NotificationData) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.action) {
      navigate(notification.action.path);
      setNotificationMenuOpen(false);
    }
  }, [markAsRead, navigate]);

  // ✅ Format time ago
  const formatTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  }, []);

  // ✅ Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (!target.closest('[data-dropdown]')) {
        setUserMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <NavContainer>
        {/* Logo Section */}
        <LogoSection>
          <Logo onClick={() => navigateTo('/dashboard')}>
            <LogoIcon>⚡</LogoIcon>
            Flux Revenue
          </Logo>
        </LogoSection>

        {/* Navigation Links */}
        <NavLinks>
          <NavLink
            active={currentPath === '/dashboard'}
            onClick={() => navigateTo('/dashboard')}
          >
            <NavLinkIcon>🏠</NavLinkIcon>
            Dashboard
          </NavLink>
          
          <NavLink
            active={currentPath === '/analyzer'}
            onClick={() => navigateTo('/analyzer')}
          >
            <NavLinkIcon>📊</NavLinkIcon>
            Analyzer
          </NavLink>
          
          <NavLink
            active={currentPath === '/optimizer'}
            onClick={() => navigateTo('/optimizer')}
            hasIndicator={userStatus.plan === 'free'}
          >
            <NavLinkIcon>⚡</NavLinkIcon>
            Optimizer
          </NavLink>
          
          <NavLink
            active={currentPath === '/relatorios'}
            onClick={() => navigateTo('/relatorios')}
          >
            <NavLinkIcon>📈</NavLinkIcon>
            Relatórios
          </NavLink>
          
          <NavLink
            active={currentPath === '/configuracoes'}
            onClick={() => navigateTo('/configuracoes')}
          >
            <NavLinkIcon>⚙️</NavLinkIcon>
            Configurações
          </NavLink>
        </NavLinks>

        {/* Right Section */}
        <RightSection>
          {/* Status Indicator */}
          <StatusIndicator plan={userStatus.plan}>
            {userStatus.plan === 'trial' && userStatus.trialDaysLeft !== undefined ? (
              <>
                🚀 Trial - {userStatus.trialDaysLeft} dias
              </>
            ) : userStatus.plan === 'free' ? (
              <>
                ⭐ Free - {userStatus.analysesUsed}/{userStatus.analysesLimit}
              </>
            ) : (
              <>
                💎 {userStatus.plan.toUpperCase()}
              </>
            )}
          </StatusIndicator>

          {/* Notifications */}
          <div style={{ position: 'relative' }} data-dropdown>
            <NotificationButton
              hasNotifications={unreadNotifications > 0}
              onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
            >
              🔔
            </NotificationButton>

            <NotificationDropdown isOpen={notificationMenuOpen}>
              <NotificationHeader>
                <NotificationTitle>
                  Notificações {unreadNotifications > 0 && `(${unreadNotifications})`}
                </NotificationTitle>
                {unreadNotifications > 0 && (
                  <MarkAllRead onClick={markAllAsRead}>
                    Marcar todas como lidas
                  </MarkAllRead>
                )}
              </NotificationHeader>

              <NotificationList>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      read={notification.read}
                      type={notification.type}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <NotificationIcon type={notification.type}>
                          {notification.type === 'success' ? '✅' :
                           notification.type === 'warning' ? '⚠️' :
                           notification.type === 'error' ? '❌' : 'ℹ️'}
                        </NotificationIcon>
                        
                        <NotificationContent>
                          <NotificationItemTitle>
                            {notification.title}
                          </NotificationItemTitle>
                          <NotificationMessage>
                            {notification.message}
                          </NotificationMessage>
                          <NotificationTime>
                            {formatTimeAgo(notification.timestamp)}
                          </NotificationTime>
                          
                          {notification.action && (
                            <NotificationAction
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(notification.action!.path);
                                setNotificationMenuOpen(false);
                              }}
                            >
                              {notification.action.label}
                            </NotificationAction>
                          )}
                        </NotificationContent>
                      </div>
                    </NotificationItem>
                  ))
                ) : (
                  <EmptyNotifications>
                    <EmptyIcon>🔔</EmptyIcon>
                    <EmptyText>Nenhuma notificação</EmptyText>
                  </EmptyNotifications>
                )}
              </NotificationList>
            </NotificationDropdown>
          </div>

          {/* User Menu */}
          <UserMenu data-dropdown>
            <UserButton onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <UserAvatar plan={userStatus.plan}>
                {userInitials}
              </UserAvatar>
              <UserInfo>
                <UserName>{user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}</UserName>
                <UserPlan>{userStatus.plan}</UserPlan>
              </UserInfo>
            </UserButton>

            <Dropdown isOpen={userMenuOpen}>
              <DropdownItem onClick={() => {
                navigateTo('/configuracoes');
                setUserMenuOpen(false);
              }}>
                👤 Perfil
              </DropdownItem>
              
              <DropdownItem onClick={() => {
                navigateTo('/configuracoes?tab=planos');
                setUserMenuOpen(false);
              }}>
                💎 Planos e Cobrança
              </DropdownItem>
              
              <DropdownItem onClick={() => {
                navigateTo('/configuracoes?tab=api');
                setUserMenuOpen(false);
              }}>
                🔗 API & Integrações
              </DropdownItem>
              
              <DropdownDivider />
              
              <DropdownItem onClick={() => {
                window.open('https://help.fluxrevenue.com.br', '_blank');
              }}>
                ❓ Ajuda
              </DropdownItem>
              
              <DropdownItem onClick={() => {
                window.open('mailto:support@fluxrevenue.com.br', '_blank');
              }}>
                📧 Contato
              </DropdownItem>
              
              <DropdownDivider />
              
              <DropdownItem 
                variant="danger"
                onClick={() => {
                  setUserMenuOpen(false);
                  handlelogout();
                }}
              >
                🚪 Sair
              </DropdownItem>
            </Dropdown>
          </UserMenu>

          {/* Mobile Menu Button */}
          <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </MobileMenuButton>
        </RightSection>
      </NavContainer>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen}>
        <MobileNavLinks>
          <MobileNavLink
            active={currentPath === '/dashboard'}
            onClick={() => navigateTo('/dashboard')}
          >
            <NavLinkIcon>🏠</NavLinkIcon>
            Dashboard
          </MobileNavLink>
          
          <MobileNavLink
            active={currentPath === '/analyzer'}
            onClick={() => navigateTo('/analyzer')}
          >
            <NavLinkIcon>📊</NavLinkIcon>
            Analyzer
          </MobileNavLink>
          
          <MobileNavLink
            active={currentPath === '/optimizer'}
            onClick={() => navigateTo('/optimizer')}
          >
            <NavLinkIcon>⚡</NavLinkIcon>
            Optimizer
            {userStatus.plan === 'free' && (
              <span style={{ 
                background: '#30D158', 
                color: 'white', 
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '10px',
                marginLeft: 'auto'
              }}>
                PRO
              </span>
            )}
          </MobileNavLink>
          
          <MobileNavLink
            active={currentPath === '/relatorios'}
            onClick={() => navigateTo('/relatorios')}
          >
            <NavLinkIcon>📈</NavLinkIcon>
            Relatórios
          </MobileNavLink>
          
          <MobileNavLink
            active={currentPath === '/configuracoes'}
            onClick={() => navigateTo('/configuracoes')}
          >
            <NavLinkIcon>⚙️</NavLinkIcon>
            Configurações
          </MobileNavLink>

          <div style={{ height: '1px', background: 'rgba(0, 0, 0, 0.08)', margin: '16px 0' }} />

          <MobileNavLink
            active={false}
            onClick={() => navigateTo('/configuracoes?tab=planos')}
          >
            <NavLinkIcon>💎</NavLinkIcon>
            Upgrade para Pro
          </MobileNavLink>

          <MobileNavLink
            active={false}
            onClick={handlelogout}
          >
            <NavLinkIcon>🚪</NavLinkIcon>
            Sair
          </MobileNavLink>
        </MobileNavLinks>
      </MobileMenu>
    </>
  );
};

export default Navbar;
