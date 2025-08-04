export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: UserRole;
    allowedPages: string[];
    isActive: boolean;
    createdAt: Date;
    lastLogin: Date | null;
  }
  
  export type UserRole = 'admin' | 'user';
  
  export interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, role?: UserRole) => Promise<void>;
    signOut: () => Promise<void>;
    updateUserRole: (userId: string, role: UserRole) => Promise<void>;
    updateUserPermissions: (userId: string, allowedPages: string[]) => Promise<void>;
  }
  
  export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
  }
  
  export interface UserPermissions {
    allowedPages: string[];
  }
  
  export interface FirebaseUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }
  
  export interface UserDocument {
    email: string;
    role: UserRole;
    allowedPages: string[];
    isActive: boolean;
    createdAt: any; // Firestore Timestamp
    lastLogin: any | null; // Firestore Timestamp
  }
  
  // Available pages in the application
  export const AVAILABLE_PAGES = [
    '/dashboard',
    '/patients',
    '/admin/submissions',
    '/automations',
    '/communications',
    '/chat',
    '/reports',
    '/patients/demo',
    '/settings',
    '/admin/users',
  ] as const;
  
  export type PagePermission = typeof AVAILABLE_PAGES[number];
  
  // Default permissions for roles
  export const DEFAULT_PERMISSIONS: Record<UserRole, PagePermission[]> = {
    admin: [
      '/dashboard',
      '/patients',
      '/admin/submissions',
      '/automations',
      '/communications',
      '/chat',
      '/reports',
      '/patients/demo',
      '/settings',
      '/admin/users',
    ],
    user: [
      '/dashboard',
      '/patients',
      '/communications',
      '/chat',
    ],
  };