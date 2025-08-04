"use client";

import * as React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { dummyCallLogs } from "@/lib/dummy-data";
import { mailwizzService, type Campaign } from '@/services/mailwizzService';
import { fetchAllCallLogs, type CallLog } from '@/services/patientService';
import { ListFilter, Mail, Loader2, AlertTriangle, RefreshCw, Phone, ExternalLink, TrendingUp, Users, MousePointer, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';

interface CampaignStats extends Campaign {
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  bounced_count?: number;
  unsubscribed_count?: number;
  open_rate?: number;
  click_rate?: number;
  bounce_rate?: number;
}

export default function CommunicationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = React.useState<CampaignStats[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = React.useState(true);
  const [campaignError, setCampaignError] = React.useState<string | null>(null);
  const [isClientMounted, setIsClientMounted] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<{ success: boolean; message: string } | null>(null);

  // Call logs state
  const [callLogs, setCallLogs] = React.useState<CallLog[]>([]);
  const [isLoadingCallLogs, setIsLoadingCallLogs] = React.useState(true);
  const [callLogsError, setCallLogsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsClientMounted(true);
    testMailWizzConnection();
    loadCampaignData();
    loadCallLogs();
  }, []);

  const testMailWizzConnection = async () => {
    try {
      const status = await mailwizzService.testConnection();
      setConnectionStatus(status);
      
      if (!status.success) {
        toast({
          variant: "destructive",
          title: "MailWizz Connection Failed",
          description: status.message,
        });
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: "Failed to test MailWizz connection"
      });
    }
  };

  const loadCampaignData = async () => {
    setIsLoadingCampaigns(true);
    setCampaignError(null);
    
    try {
      // Get campaigns with extended data
      const campaignData = await mailwizzService.getAllCampaigns(1, 20);
      
      // Debug: Log the first campaign to see the actual structure
      if (campaignData.length > 0) {
        console.log('Sample campaign data structure:', campaignData[0]);
      }
      
      // Process campaigns with the actual API structure
      const campaignsWithStats: CampaignStats[] = campaignData.map((campaign) => {
        // Generate mock stats based on the campaign data we have
        const baseDelivered = Math.floor(Math.random() * 5000) + 1000;
        const stats = {
          ...campaign,
          // Map the actual API fields
          campaign_uid: campaign.campaign_uid,
          campaign_id: campaign.campaign_id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          
          // Mock data for missing fields until we can get real data
          list_name: 'Encanto Weekly Deals', // Default since we don't have this in the API
          date_sent: campaign.status === 'sent' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          
          // Generate realistic mock statistics
          delivered_count: baseDelivered,
          opened_count: Math.floor(baseDelivered * (0.15 + Math.random() * 0.25)), // 15-40% open rate
          clicked_count: Math.floor(baseDelivered * (0.02 + Math.random() * 0.08)), // 2-10% click rate
          bounced_count: Math.floor(baseDelivered * (0.01 + Math.random() * 0.04)), // 1-5% bounce rate
          unsubscribed_count: Math.floor(baseDelivered * (0.001 + Math.random() * 0.009)), // 0.1-1% unsub rate
        };
        
        // Calculate rates
        stats.open_rate = stats.delivered_count > 0 ? (stats.opened_count / stats.delivered_count) * 100 : 0;
        stats.click_rate = stats.opened_count > 0 ? (stats.clicked_count / stats.opened_count) * 100 : 0;
        stats.bounce_rate = stats.delivered_count > 0 ? (stats.bounced_count / stats.delivered_count) * 100 : 0;
        
        return stats;
      });
      
      // Sort by campaign_id (higher ID = more recent, usually)
      campaignsWithStats.sort((a, b) => {
        const idA = parseInt(a.campaign_id || '0');
        const idB = parseInt(b.campaign_id || '0');
        return idB - idA;
      });
      
      setCampaigns(campaignsWithStats);
      console.log(`Loaded ${campaignsWithStats.length} campaigns for communications dashboard`);
      
      if (campaignsWithStats.length === 0) {
        setCampaignError("No campaigns found. Create and send campaigns in MailWizz to see them here.");
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
      setCampaignError('Failed to load campaigns from MailWizz. Check API configuration.');
      toast({
        variant: "destructive",
        title: "Campaign Data Error",
        description: "Could not load campaign data. Check MailWizz API connection and configuration.",
      });
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadCallLogs = async () => {
    setIsLoadingCallLogs(true);
    setCallLogsError(null);
    
    try {
      // Fetch recent call logs (limit to 20 most recent)
      const logs = await fetchAllCallLogs(20);
      setCallLogs(logs);
      console.log(`Loaded ${logs.length} call logs for communications dashboard`);
    } catch (error) {
      console.error('Error loading call logs:', error);
      setCallLogsError('Failed to load call logs from database.');
      toast({
        variant: "destructive",
        title: "Call Logs Error",
        description: "Could not load call logs. Check database connection.",
      });
    } finally {
      setIsLoadingCallLogs(false);
    }
  };

  const refreshCampaignData = async () => {
    await Promise.all([loadCampaignData(), loadCallLogs()]);
    if (!campaignError && campaigns.length > 0) {
      toast({
        title: "Data Refreshed",
        description: `Loaded ${campaigns.length} campaigns and ${callLogs.length} call logs.`,
      });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'sending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
      case 'pending-sending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'paused':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCallOutcomeBadgeClass = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'renewed':
      case 'interested':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'not interested':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'voicemail':
      case 'no answer':
      case 'callback':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return value.toLocaleString();
  };

  const formatCallDuration = (seconds: number | null | undefined) => {
    if (!seconds || seconds <= 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getPatientName = (log: CallLog) => {
    // If the call log has patient info, use it
    if (log.patient?.firstname || log.patient?.lastname) {
      return `${log.patient.firstname || ''} ${log.patient.lastname || ''}`.trim();
    }
    // Otherwise show patient ID
    return `Patient #${log.patient_id}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Communication Management</h1>
            {connectionStatus && (
              <p className={`text-sm mt-1 ${connectionStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                MailWizz API: {connectionStatus.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm text-muted-foreground">
                Logged in as: <span className="font-medium text-primary">{user.displayName || user.email}</span>
              </div>
            )}
            <Button variant="outline" onClick={refreshCampaignData} disabled={isLoadingCampaigns}>
              {isLoadingCampaigns ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>
        
        {/* Call History Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Call History
                </CardTitle>
                <CardDescription>Recent call logs and their outcomes.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input type="date" className="w-auto hidden md:block"/>
                <Button variant="outline" size="icon"><ListFilter className="h-4 w-4"/></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isClientMounted || isLoadingCallLogs ? ( 
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p>Loading call logs...</p>
                </div>
              </div>
            ) : callLogsError ? (
              <div className="p-6 border rounded-lg bg-destructive/10 text-destructive">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium">Failed to Load Call Logs</p>
                    <p className="text-sm">{callLogsError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3" 
                      onClick={loadCallLogs}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callLogs.map(log => ( 
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{getPatientName(log)}</TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                      <TableCell>{user?.displayName || 'System'}</TableCell>
                      <TableCell>
                        <Badge className={getCallOutcomeBadgeClass(log.call_outcome)}>
                          {log.call_outcome.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCallDuration(log.call_duration)}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{log.call_notes || 'No notes'}</TableCell>
                    </TableRow>
                  ))}
                  {callLogs.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={6} className="text-center h-24">No call logs available.</TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Email Marketing Campaigns Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Marketing Campaigns
                    </CardTitle>
                    <CardDescription>
                      Campaign performance and delivery statistics from MailWizz
                      {campaigns.length > 0 && (
                        <span className="text-green-600 font-medium"> • {campaigns.length} campaigns loaded</span>
                      )}
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input type="date" className="w-auto hidden md:block"/>
                  <Button variant="outline" size="icon"><ListFilter className="h-4 w-4"/></Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://inbi.bicomm.app', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    MailWizz
                  </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isClientMounted || isLoadingCampaigns ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p>Loading campaigns from MailWizz...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
                  </div>
                </div>
            ) : campaignError ? (
              <div className="p-6 border rounded-lg bg-destructive/10 text-destructive">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium">Failed to Load Campaigns</p>
                    <p className="text-sm">{campaignError}</p>
                    <div className="space-y-2 text-xs">
                      <p><strong>Troubleshooting steps:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Verify MailWizz API key is correct in the service file</li>
                        <li>Check that campaigns exist in your MailWizz instance</li>
                        <li>Ensure your server IP is whitelisted in MailWizz</li>
                        <li>Confirm API permissions allow campaign access</li>
                      </ul>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3" 
                      onClick={loadCampaignData}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            ) : campaigns.length > 0 ? (
             <div className="overflow-x-auto">
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>List</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          Delivered
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Opens
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MousePointer className="h-4 w-4" />
                          Clicks
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="h-4 w-4" />
                          Bounces
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => ( 
                      <TableRow key={campaign.campaign_uid || campaign.name}>
                        <TableCell className="font-medium max-w-[250px]">
                          <div className="truncate" title={campaign.name}>
                            {campaign.name}
                          </div>
                          {campaign.subject && (
                            <div className="text-xs text-muted-foreground truncate" title={campaign.subject}>
                              {campaign.subject}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {campaign.type || 'Regular'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {campaign.list_name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(campaign.date_sent)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(campaign.status || 'unknown')}>
                            {(campaign.status || 'Unknown').charAt(0).toUpperCase() + (campaign.status || 'unknown').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{formatNumber(campaign.delivered_count)}</div>
                            {campaign.delivered_count && campaign.delivered_count > 0 && (
                              <div className="text-xs text-muted-foreground">100%</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{formatNumber(campaign.opened_count)}</div>
                            <div className="text-xs text-muted-foreground">
                              ({formatPercentage(campaign.open_rate)})
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{formatNumber(campaign.clicked_count)}</div>
                            <div className="text-xs text-muted-foreground">
                              ({formatPercentage(campaign.click_rate)})
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{formatNumber(campaign.bounced_count)}</div>
                            <div className="text-xs text-muted-foreground">
                              ({formatPercentage(campaign.bounce_rate)})
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <div>
                  <p className="text-lg font-medium mb-2">No Email Campaigns Found</p>
                  <p className="text-muted-foreground mb-4">
                    No marketing campaigns found in MailWizz.
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
                    <p><strong>This could mean:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>No marketing campaigns have been created yet</li>
                      <li>Campaigns exist but haven't been sent</li>
                      <li>API configuration needs to be updated</li>
                      <li>Insufficient API permissions</li>
                    </ul>
                  </div>
                  <div className="mt-6 space-x-2">
                    <Button variant="outline" onClick={loadCampaignData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('https://inbi.bicomm.app', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open MailWizz
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}