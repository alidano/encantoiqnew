/**
 * AppLayout.tsx
 * 
 * Main application layout component that provides the sidebar navigation,
 * header with user menu, and main content area for all authenticated pages.
 * 
 * Features:
 * - Responsive sidebar with collapsible navigation
 * - Admin-only menu items with role-based filtering
 * - Theme toggle and user dropdown menu
 * - Mobile-friendly sheet navigation
 * - WATI WhatsApp Chat integration
 * 
 * Path: src/components/layout/AppLayout.tsx
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Phone,
  BarChartBig,
  Settings,
  LogOut,
  Menu,
  Zap, 
  ClipboardList,
  FlaskConical,
  MessageCircle, // New icon for WATI chat
  Database, // Icon for sync functionality
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  tooltip?: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tooltip: "Dashboard" },
  { href: "/patients", label: "Patients", icon: Users, tooltip: "Patients" },
  { href: "/admin/submissions", label: "Submissions", icon: ClipboardList, tooltip: "Submissions" },
  { href: "/admin/sync", label: "BioTrack Sync", icon: Database, tooltip: "Synchronize data from BioTrack" },
  { href: "/automations", label: "Automations", icon: Zap, tooltip: "Automations" },
  { href: "/communications", label: "Communications", icon: Phone, tooltip: "Communication Management" },
  { href: "/chat/wati", label: "WhatsApp", icon: MessageCircle, tooltip: "WATI WhatsApp Chat" },
  { href: "/reports", label: "Reports", icon: BarChartBig, tooltip: "Reports" },
  { href: "/patients/demo", label: "Demo Patient AI", icon: FlaskConical, tooltip: "Demo Patient AI" },
];

const settingsNavItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, tooltip: "Settings" },
  { href: "/logout", label: "Logout", icon: LogOut, tooltip: "Logout" },
];

const logoUrl = "https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/Encanto%20Tree%20Dispensary-01.1.png?alt=media&token=ce740d8c-eaa1-4f12-84dd-b5993d4bac30";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading, isAdmin, getUserDisplayName, getUserInitials, signOut } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    // Only show admin-only routes to admin users
    const adminOnlyPages = [
      '/admin/sync',
      '/automations',
      '/communications',
      '/reports',
      '/patients/demo',
      '/chat/wati', // Make WATI chat admin-only (optional)
    ];
    if (adminOnlyPages.includes(item.href)) {
      return isAdmin();
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderNavItems = (items: NavItem[]) => items.map((item) => (
    <SidebarMenuItem key={item.href}>
      {/* Handle Logout button separately */}
      {item.href === '/logout' ? (
        <SidebarMenuButton
          onClick={handleLogout}
          tooltip={item.tooltip || item.label}
          className="w-full cursor-pointer"
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </SidebarMenuButton>
      ) : (
        <Link href={item.href} passHref legacyBehavior>
          <SidebarMenuButton
            isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
            tooltip={item.tooltip || item.label}
            className="w-full"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </Link>
      )}
    </SidebarMenuItem>
  ));

  const sidebarContent = (
    <>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 group">
           <Image
            src={logoUrl}
            alt="EncantoIQ Logo"
            width={32}
            height={32}
            data-ai-hint="dispensary logo"
          />
          <h1 className="text-xl font-semibold text-primary group-data-[state=collapsed]:hidden">EncantoIQ</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {renderNavItems(filteredNavItems)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {renderNavItems(settingsNavItems)}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="hidden md:flex flex-col">
         {sidebarContent}
        </Sidebar>
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 w-[var(--sidebar-width-mobile)]">
                   {sidebarContent}
                </SheetContent>
              </Sheet>
              <SidebarTrigger className="hidden md:flex" />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={logoUrl} alt={getUserDisplayName()} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
