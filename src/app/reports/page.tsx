
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users2, FileText, UserCheck } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports & Analytics - EncantoIQ',
};

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="space-y-6 px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <Button><BarChart3 className="mr-2 h-4 w-4" /> Build Custom Report</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> License Expiration</CardTitle>
              <CardDescription>Track upcoming and overdue license expirations.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Detailed reports on patient license statuses, categorized by expiration timelines (30, 60, 90 days, expired).</p>
              <Button variant="outline" className="mt-4 w-full">View Report</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> Communication Effectiveness</CardTitle>
              <CardDescription>Analyze renewal rates based on communication campaigns.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Metrics on email/SMS open rates, call success, and their impact on patient license renewals.</p>
              <Button variant="outline" className="mt-4 w-full">View Report</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users2 className="h-5 w-5 text-primary" /> Patient Demographics</CardTitle>
              <CardDescription>Understand your patient base better.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Reports on patient age, location, member status, and other demographic data.</p>
               <Button variant="outline" className="mt-4 w-full">View Report</Button>
            </CardContent>
          </Card>
          
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Renewal Rates</CardTitle>
              <CardDescription>Overall and segmented license renewal performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Track renewal trends over time, by dispensary location, or patient segment.</p>
               <Button variant="outline" className="mt-4 w-full">View Report</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users2 className="h-5 w-5 text-primary" /> Agent Performance</CardTitle>
              <CardDescription>Metrics for call agents and communication tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Track calls made, outcomes achieved, and renewal contributions by each agent.</p>
               <Button variant="outline" className="mt-4 w-full">View Report</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Custom Report Builder (Placeholder)</CardTitle>
            <CardDescription>This section will allow users to generate custom reports based on various data points and filters.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Functionality for selecting data fields, applying filters, choosing chart types, and saving report templates will be available here.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
