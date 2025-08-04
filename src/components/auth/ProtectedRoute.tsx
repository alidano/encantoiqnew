"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { PagePermission } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: PagePermission;
  adminOnly?: boolean;
  fallbackUrl?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  adminOnly = false,
  fallbackUrl = '/login'
}) => {
  const { user, loading, isAuthenticated, isAdmin, canAccessPage } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated()) {
        router.push(fallbackUrl);
        return;
      }

      // Admin only route - check if user is admin
      if (adminOnly && !isAdmin()) {
        router.push('/dashboard'); // Redirect to dashboard if not admin
        return;
      }

      // Check specific permission if required
      if (requiredPermission && !canAccessPage(requiredPermission)) {
        router.push('/dashboard'); // Redirect to dashboard if no permission
        return;
      }

      // User is inactive
      if (user && !user.isActive) {
        router.push('/login?error=account_disabled');
        return;
      }
    }
  }, [user, loading, isAuthenticated, isAdmin, canAccessPage, adminOnly, requiredPermission, router, fallbackUrl]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!isAuthenticated() || (adminOnly && !isAdmin()) || 
      (requiredPermission && !canAccessPage(requiredPermission)) ||
      (user && !user.isActive)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;