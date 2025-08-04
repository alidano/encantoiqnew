// src/components/ProtectedNavigation.tsx
'use client';

import Link from 'next/link';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface NavItem {
  name: string;
  href: string;
  permission: string;
  icon?: React.ReactNode;
}

const navigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', permission: 'dashboard' },
  { name: 'Patients', href: '/patients', permission: 'patients' },
  { name: 'Submissions', href: '/submissions', permission: 'submissions' },
  { name: 'Chat Inbox', href: '/chat', permission: 'chat' },
  { name: 'Reports', href: '/reports', permission: 'reports' },
  { name: 'Settings', href: '/settings', permission: 'settings' },
  { name: 'Admin', href: '/admin', permission: 'admin' },
];

export function ProtectedNavigation() {
  const { canAccess, isAdmin, role } = useUserPermissions();

  // Filter navigation items based on user permissions
  const visibleItems = navigationItems.filter(item => canAccess(item.permission));

  return (
    <nav className="space-y-2">
      <div className="px-3 py-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {isAdmin ? 'Admin' : 'User'} ({role})
        </p>
      </div>
      
      {visibleItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          {item.icon && <span className="mr-3">{item.icon}</span>}
          {item.name}
        </Link>
      ))}
      
      {visibleItems.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-500">
          No pages available
        </div>
      )}
    </nav>
  );
}