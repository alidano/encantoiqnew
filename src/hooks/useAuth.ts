import { useAuthContext } from '@/contexts/AuthContext';
import { hasPermission, isAdmin as checkIsAdmin } from '@/lib/firebase/auth';
import type { User, PagePermission } from '@/types/auth';

export const useAuth = () => {
  const context = useAuthContext();
  
  const isAdmin = (): boolean => {
    return context.user?.role === 'admin' || false;
  };

  const isUser = (): boolean => {
    return context.user?.role === 'user' || false;
  };

  const isAuthenticated = (): boolean => {
    return !!context.user && context.user.isActive;
  };

  const checkPermission = (permission: string): boolean => {
    return hasPermission(context.user, permission);
  };

  const getUserDisplayName = (): string => {
    if (!context.user) return '';
    return context.user.displayName || context.user.email || 'User';
  };

  const getUserInitials = (): string => {
    if (!context.user) return '';
    
    if (context.user.displayName) {
      return context.user.displayName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    if (context.user.email) {
      return context.user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  const canAccessPage = (pagePermission: string): boolean => {
    return checkPermission(pagePermission);
  };

  return {
    ...context,
    isAdmin,
    isUser,
    isAuthenticated,
    checkPermission,
    canAccessPage,
    getUserDisplayName,
    getUserInitials,
  };
};