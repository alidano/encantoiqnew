'use client';

import { useState, useEffect } from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Mail, Smartphone, Edit, PlusCircle, ListFilter, AlertCircle, Rss, Loader2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

interface SmsRecord {
  id: number;
  created_at: string;
  from: number | null;
  to: number | null;
  status: string | null;
  sent_at: string | null;
  error_message: string | null;
  message_text: string | null;
}

export default function AutomationsPage() {
  const [smsHistory, setSmsHistory] = useState<SmsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  const ITEMS_PER_PAGE = 10;

  // Fetch SMS data from API
  const fetchSmsData = async (page = 0, phone = '') => {
    try {
      setLoading(true);
      const offset = page * ITEMS_PER_PAGE;
      const url = `/api/sms?limit=${ITEMS_PER_PAGE}&offset=${offset}${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch SMS data');
      }
      
      const data = await response.json();
      setSmsHistory(data.sms_logs || []);
      setTotalCount(data.totalCount || 0);
      setHasMore(data.hasMore || false);
    } catch (err) {
      console.error('Error fetching SMS data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load SMS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmsData(currentPage, phoneFilter);
  }, [currentPage, phoneFilter]);

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSearch = () => {
    setPhoneFilter(searchPhone);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleClearFilter = () => {
    setSearchPhone('');
    setPhoneFilter('');
    setCurrentPage(0);
  };

  // Helper function to format phone numbers
  const formatPhoneNumber = (phone: number | null) => {
    if (!phone) return 'N/A';
    
    // Convert to string and clean
    const phoneStr = phone.toString();
    const cleaned = phoneStr.replace(/\D/g, '');
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phoneStr;
  };

  // Helper function to format dates
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Automation Management</h1>
           <div className="flex gap-2">
            <Button variant="outline"><Rss className="mr-2 h-4 w-4" /> View Workflows (n8n)</Button>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> New Manual Message</Button>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Automated Workflows (via n8n)</CardTitle>
            <CardDescription>
              Overview of automated communication sequences. This section acknowledges n8n integration.
              Actual workflow management happens in n8n.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <p className="font-medium">Encanto SMS Same day Renovaciones</p>
                <p className="text-sm text-muted-foreground">Trigger: Same day license expiration. Action: Send SMS reminder.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <p className="font-medium">Encanto SMS 30 days Renovaciones</p>
                <p className="text-sm text-muted-foreground">Trigger: 30 days before license expiration. Action: Send SMS reminder.</p>
              </div>
               <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Active</span>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3"/> For detailed workflow configuration, please visit the n8n dashboard.
            </p>
          </CardFooter>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>SMS Communication Log</CardTitle>
                    <CardDescription>
                      {loading ? (
                        'Loading SMS history...'
                      ) : error ? (
                        `Error: ${error}`
                      ) : (
                        `History of sent SMS messages (${smsHistory.length} of ${totalCount} records)`
                      )}
                    </CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1">
                    <Input
                      placeholder="Search by phone..."
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="w-40"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button variant="outline" size="icon" onClick={handleSearch} disabled={loading}>
                      <Search className="h-4 w-4"/>
                    </Button>
                    {phoneFilter && (
                      <Button variant="outline" size="icon" onClick={handleClearFilter}>
                        <X className="h-4 w-4"/>
                      </Button>
                    )}
                  </div>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading SMS data...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-24 text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Failed to load SMS data: {error}</span>
              </div>
            ) : (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smsHistory.length > 0 ? (
                    smsHistory.map((sms) => (
                      <TableRow key={sms.id}>
                        <TableCell className="font-mono text-sm">
                          {formatPhoneNumber(sms.from)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatPhoneNumber(sms.to)}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate" title={sms.message_text || 'No message'}>
                            {sms.message_text || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(sms.sent_at)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            sms.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            sms.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            sms.status === 'sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {sms.status ? sms.status.charAt(0).toUpperCase() + sms.status.slice(1) : 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-red-600 max-w-32">
                          {sms.error_message ? (
                            <div className="truncate" title={sms.error_message}>
                              {sms.error_message}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        {phoneFilter ? 'No SMS logs found for this phone number.' : 'No SMS logs available.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {phoneFilter && (
                <span className="mr-4">Filtered by: {phoneFilter}</span>
              )}
              Showing page {currentPage + 1} 
              {totalCount > 0 && ` of ${Math.ceil(totalCount / ITEMS_PER_PAGE)}`}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevPage}
                disabled={currentPage === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextPage}
                disabled={!hasMore || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        </Card>

      </div>
    </AppLayout>
  );
}