"use client";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Users, Bell, KeyRound, FileText, ShieldCheck } from "lucide-react";
// import type { Metadata } from 'next'; // Metadata cannot be exported from Client Components

// export const metadata: Metadata = { // Removed: Client Components cannot export metadata
//   title: 'Settings - EncantoIQ',
// };

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> User Management</CardTitle>
              <CardDescription>Manage admin panel users, roles, and permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">Manage Users</Button>
              <Button variant="outline" className="w-full">Manage Roles</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Communication Templates</CardTitle>
              <CardDescription>Edit and create new email/SMS templates.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => window.location.href='/automations'}>
                Go to Template Management
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notification Settings</CardTitle>
              <CardDescription>Configure system notifications and alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="system-alerts">System Alerts</Label>
                <Switch id="system-alerts" defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Account Security</CardTitle>
              <CardDescription>Manage your account password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="********" className="mt-1"/>
               </div>
               <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="********" className="mt-1"/>
               </div>
              <Button variant="outline" className="w-full">Change Password</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Audit Logs</CardTitle>
              <CardDescription>View activity logs for audit and tracking purposes.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will display a detailed log of all significant actions performed within the admin panel, such as user logins, data modifications, and system events. Useful for security audits and troubleshooting.
              </p>
              <Button variant="outline" className="mt-4 w-full">View Full Audit Log</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
