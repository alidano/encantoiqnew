import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export interface UserPermissions {
  isAdmin: boolean;
  role: 'admin' | 'user' | null;
  permissions: string[];
  canAccess: (page: string) => boolean;
}

export function useUserPermissions(): UserPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    isAdmin: false,
    role: null,
    permissions: [],
    canAccess: () => false
  });

  useEffect(() => {
    const getPermissions = async () => {
      if (!user) {
        setPermissions({
          isAdmin: false,
          role: null,
          permissions: [],
          canAccess: () => false
        });
        return;
      }

      try {
        // Get the user's ID token with claims
        const idTokenResult = await user.getIdTokenResult(true);
        const claims = idTokenResult.claims;

        const userPermissions: UserPermissions = {
          isAdmin: claims.admin === true,
          role: claims.role || null,
          permissions: claims.permissions || [],
          canAccess: (page: string) => {
            const userPerms = claims.permissions || [];
            return userPerms.includes(page);
          }
        };

        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error getting user permissions:', error);
        setPermissions({
          isAdmin: false,
          role: null,
          permissions: [],
          canAccess: () => false
        });
      }
    };

    getPermissions();
  }, [user]);

  return permissions;
}