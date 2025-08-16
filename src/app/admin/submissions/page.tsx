"use client";

import * as React from 'react';
import Link from 'next/link';
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, Eye, UserCheck, UserX, Search as SearchIcon, ChevronLeft, ChevronRight, MapPin, CreditCard, Calendar, Clock, RefreshCw, Filter } from "lucide-react";
import { fetchEnhancedSubmissions } from '@/services/patientService';
import { format, parseISO, isValid, subYears, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Badge } from '@/components/ui/badge';

// Updated interface to match actual database structure
interface EnhancedLicenseSubmission {
  id: number;
  submitted_at: string | null;
  submission_type: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  phone_number: number | null; // numeric in DB
  date_of_birth: string | null;
  mmj_card_number: string | null;
  address1: string | null;
  city: string | null;
  state: string | null;
  zip_code: number | null; // numeric in DB
  dispensary_location: string | null;
  email_opt_in: boolean | null;
  sms_opt_in: boolean | null;
  license_photo_url: string | null;
  patient_id: string | null;
  status: string | null;
  processed_at: string | null;
  patient_walkIn_payment: string | null;
  payment: number | null;
  promotion: string | null;
  order_payment_status: string | null;
  order_payment_method: string | null;
  payment_confirmation: string | null;
  
  // Computed fields (if these come from JOINs or business logic)
  isExistingPatient?: boolean;
}

const ITEMS_PER_PAGE = 75; // Increased from 50 to 75 for better visibility

const formatDateSafe = (dateString?: string | null, includeTime: boolean = false) => {
  if (!dateString || !isValid(parseISO(dateString))) return "N/A";
  return format(parseISO(dateString), includeTime ? 'MM/dd/yyyy HH:mm' : 'MM/dd/yyyy');
};

const formatPhoneNumber = (phoneNumber: number | null): string => {
  if (!phoneNumber) return "N/A";
  const phoneStr = phoneNumber.toString();
  if (phoneStr.length === 10) {
    return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
  }
  return phoneStr;
};

const formatAddress = (submission: EnhancedLicenseSubmission): string => {
  const parts = [
    submission.address1,
    submission.city,
    submission.state,
    submission.zip_code?.toString()
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('complete') || lowerStatus.includes('processed') || lowerStatus.includes('approved')) return 'default';
  if (lowerStatus.includes('reject') || lowerStatus.includes('incomplete') || lowerStatus.includes('error') || lowerStatus.includes('failed')) return 'destructive';
  if (lowerStatus.includes('pending') || lowerStatus.includes('submitted') || lowerStatus.includes('validation') || lowerStatus.includes('review')) return 'outline';
  return 'secondary';
};

const getStatusClass = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('complete') || lowerStatus.includes('processed') || lowerStatus.includes('approved')) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    if (lowerStatus.includes('reject') || lowerStatus.includes('incomplete') || lowerStatus.includes('error') || lowerStatus.includes('failed')) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    if (lowerStatus.includes('pending') || lowerStatus.includes('submitted') || lowerStatus.includes('validation') || lowerStatus.includes('review')) return 'border-yellow-500 text-yellow-700 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

const getPaymentStatusBadge = (status: string | null) => {
  if (!status) return null;
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('paid') || lowerStatus.includes('complete') || lowerStatus.includes('success')) {
    return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Paid</Badge>;
  }
  if (lowerStatus.includes('pending') || lowerStatus.includes('processing')) {
    return <Badge variant="outline">Pending</Badge>;
  }
  if (lowerStatus.includes('failed') || lowerStatus.includes('declined')) {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
};

const getSubmissionTypeBadge = (type: string | null) => {
  if (!type) return <Badge variant="secondary">Unknown</Badge>;
  
  const isRenewal = type.toLowerCase().includes('renewal');
  return (
    <Badge 
      variant={isRenewal ? 'default' : 'secondary'} 
      className={`whitespace-nowrap ${isRenewal ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}`}
    >
      <RefreshCw className={`mr-1 h-3 w-3 ${isRenewal ? '' : 'opacity-50'}`} />
      {isRenewal ? 'Renewal' : 'New License'}
    </Badge>
  );
};

// New date range options for license renewal periods
const DATE_RANGE_OPTIONS = [
  { value: '12months', label: 'Last 12 Months (Standard Renewal Period)', months: 12 },
  { value: '6months', label: 'Last 6 Months', months: 6 },
  { value: '3months', label: 'Last 3 Months', months: 3 },
  { value: '1month', label: 'Current Month', months: 1 },
  { value: 'all', label: 'All Time (Performance Warning)', months: null }
];

export default function AllSubmissionsPage() {
  const [allSubmissions, setAllSubmissions] = React.useState<EnhancedLicenseSubmission[]>([]);
  const [filteredAndPaginatedSubmissions, setFilteredAndPaginatedSubmissions] = React.useState<EnhancedLicenseSubmission[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchInputValue, setSearchInputValue] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState('ALL');
  const [filterStatus, setFilterStatus] = React.useState('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = React.useState('ALL');
  const [dateRange, setDateRange] = React.useState('12months'); // New state for date range
  const [uniqueStatuses, setUniqueStatuses] = React.useState<string[]>([]);
  const [uniquePaymentStatuses, setUniquePaymentStatuses] = React.useState<string[]>([]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(0);
  const [isClientMounted, setIsClientMounted] = React.useState(false);
  const [showExtendedView, setShowExtendedView] = React.useState(false);
  const [lastLoadTime, setLastLoadTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const loadSubmissions = React.useCallback(async (selectedDateRange: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let filterStartDate: Date | undefined;
      
      const selectedOption = DATE_RANGE_OPTIONS.find(option => option.value === selectedDateRange);
      
      if (selectedOption && selectedOption.months !== null) {
        if (selectedOption.months === 1) {
          // For current month, use start of current month
          filterStartDate = startOfMonth(new Date());
        } else {
          // For other periods, subtract the specified months
          filterStartDate = subMonths(new Date(), selectedOption.months);
        }
      }
      // If selectedOption.months is null (All Time), filterStartDate remains undefined

      console.log(`Loading submissions for date range: ${selectedDateRange}`, {
        filterStartDate: filterStartDate ? format(filterStartDate, 'yyyy-MM-dd') : 'No filter (All time)',
        selectedOption
      });

      const fetchedSubmissions = await fetchEnhancedSubmissions(filterStartDate);
      setAllSubmissions(fetchedSubmissions);
      setLastLoadTime(new Date());

      // Extract unique statuses
      const statuses = new Set(fetchedSubmissions.map(s => s.status).filter(Boolean));
      setUniqueStatuses(['ALL', ...Array.from(statuses)]);

      // Extract unique payment statuses
      const paymentStatuses = new Set(fetchedSubmissions.map(s => s.order_payment_status).filter(Boolean));
      setUniquePaymentStatuses(['ALL', ...Array.from(paymentStatuses)]);

      console.log(`Successfully loaded ${fetchedSubmissions.length} submissions for ${selectedDateRange}`);
    } catch (e) {
      console.error('Error loading submissions:', e);
      setError("Failed to load submissions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSubmissions(dateRange);
  }, [dateRange, loadSubmissions]);

  React.useEffect(() => {
    let currentSubmissions = [...allSubmissions];

    // Search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentSubmissions = currentSubmissions.filter(sub =>
        sub.first_name?.toLowerCase().includes(lowerSearchTerm) ||
        sub.last_name?.toLowerCase().includes(lowerSearchTerm) ||
        sub.middle_name?.toLowerCase().includes(lowerSearchTerm) ||
        `${sub.first_name} ${sub.last_name}`.toLowerCase().includes(lowerSearchTerm) ||
        (sub.email && sub.email.toLowerCase().includes(lowerSearchTerm)) ||
        (sub.mmj_card_number && sub.mmj_card_number.toLowerCase().includes(lowerSearchTerm)) ||
        (sub.patient_id && sub.patient_id.toLowerCase().includes(lowerSearchTerm)) ||
        (sub.dispensary_location && sub.dispensary_location.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Type filter
    if (filterType !== 'ALL') {
      currentSubmissions = currentSubmissions.filter(sub => sub.submission_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      currentSubmissions = currentSubmissions.filter(sub => sub.status === filterStatus);
    }

    // Payment status filter
    if (filterPaymentStatus !== 'ALL') {
      currentSubmissions = currentSubmissions.filter(sub => sub.order_payment_status === filterPaymentStatus);
    }

    const calculatedTotalPages = Math.ceil(currentSubmissions.length / ITEMS_PER_PAGE);
    setTotalPages(calculatedTotalPages);

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    setFilteredAndPaginatedSubmissions(currentSubmissions.slice(indexOfFirstItem, indexOfLastItem));

  }, [searchTerm, filterType, filterStatus, filterPaymentStatus, allSubmissions, currentPage]);

  const handleSearch = () => {
    setSearchTerm(searchInputValue);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (newDateRange: string) => {
    setDateRange(newDateRange);
    setCurrentPage(1);
    // Clear filters when changing date range
    setSearchTerm('');
    setSearchInputValue('');
    setFilterType('ALL');
    setFilterStatus('ALL');
    setFilterPaymentStatus('ALL');
  };

  const handleRefresh = () => {
    loadSubmissions(dateRange);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getFullFilteredCount = () => {
    let currentSubmissions = [...allSubmissions];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentSubmissions = currentSubmissions.filter(sub =>
        sub.first_name?.toLowerCase().includes(lowerSearchTerm) ||
        sub.last_name?.toLowerCase().includes(lowerSearchTerm) ||
        sub.middle_name?.toLowerCase().includes(lowerSearchTerm) ||
        `${sub.first_name} ${sub.last_name}`.toLowerCase().includes(lowerSearchTerm) ||
        (sub.email && sub.email.toLowerCase().includes(lowerSearchTerm)) ||
        (sub.mmj_card_number && sub.mmj_card_number.toLowerCase().includes(lowerSearchTerm)) ||
        (sub.patient_id && sub.patient_id.toLowerCase().includes(lowerSearchTerm)) ||
        (sub.dispensary_location && sub.dispensary_location.toLowerCase().includes(lowerSearchTerm))
      );
    }
    if (filterType !== 'ALL') {
      currentSubmissions = currentSubmissions.filter(sub => sub.submission_type === filterType);
    }
    if (filterStatus !== 'ALL') {
      currentSubmissions = currentSubmissions.filter(sub => sub.status === filterStatus);
    }
    if (filterPaymentStatus !== 'ALL') {
      currentSubmissions = currentSubmissions.filter(sub => sub.order_payment_status === filterPaymentStatus);
    }
    return currentSubmissions.length;
  };

  const totalFilteredCount = getFullFilteredCount();
  const displayedCountStart = totalFilteredCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const displayedCountEnd = Math.min(currentPage * ITEMS_PER_PAGE, totalFilteredCount);

  // Calculate renewal statistics for the current date range
  const renewalStats = React.useMemo(() => {
    const renewals = allSubmissions.filter(sub => 
      sub.submission_type?.toLowerCase().includes('renewal')
    );
    const newLicenses = allSubmissions.filter(sub => 
      sub.submission_type?.toLowerCase().includes('new')
    );
    const totalSubmissions = allSubmissions.length;
    const renewalPercentage = totalSubmissions > 0 ? ((renewals.length / totalSubmissions) * 100).toFixed(1) : '0';
    
    return {
      renewals: renewals.length,
      newLicenses: newLicenses.length,
      total: totalSubmissions,
      renewalPercentage
    };
  }, [allSubmissions]);

  const currentDateRangeLabel = DATE_RANGE_OPTIONS.find(option => option.value === dateRange)?.label || 'Last 12 Months';

  return (
    <AppLayout>
      <div className="space-y-6 px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  License Submissions ({isLoading ? <Loader2 className="inline h-5 w-5 animate-spin" /> : totalFilteredCount.toLocaleString()})
                </CardTitle>
                <CardDescription className="mt-2">
                  {currentDateRangeLabel} • Renewals: {renewalStats.renewals} ({renewalStats.renewalPercentage}%) • New: {renewalStats.newLicenses}
                  {lastLoadTime && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Last updated: {format(lastLoadTime, 'MM/dd/yyyy HH:mm:ss')}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm" 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 border rounded-lg space-y-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Filter & Search Options</span>
              </div>
              
              {/* Date Range Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 bg-background rounded-md border">
                <div>
                  <label htmlFor="date-range" className="block text-sm font-medium text-muted-foreground mb-2">
                    📅 License Renewal Period
                  </label>
                  <Select value={dateRange} onValueChange={handleDateRangeChange}>
                    <SelectTrigger id="date-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_RANGE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-muted-foreground">
                    <div>📊 Current Period Statistics:</div>
                    <div>Total: {renewalStats.total} | Renewals: {renewalStats.renewals} | New: {renewalStats.newLicenses}</div>
                    <div>Renewal Rate: {renewalStats.renewalPercentage}%</div>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                <div className="lg:col-span-2">
                    <label htmlFor="search-submissions" className="block text-sm font-medium text-muted-foreground mb-1">🔍 Search</label>
                    {isClientMounted ? (
                      <div className="flex gap-2">
                          <Input
                              id="search-submissions"
                              placeholder="Name, email, MMJ card, Patient ID..."
                              value={searchInputValue}
                              onChange={(e) => setSearchInputValue(e.target.value)}
                              onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
                          />
                          <Button onClick={handleSearch} variant="outline" size="icon" aria-label="Search">
                              <SearchIcon className="h-4 w-4" />
                          </Button>
                      </div>
                    ) : (
                      <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm animate-pulse" aria-label="Loading search input">
                        Loading search...
                      </div>
                    )}
                </div>
                <div>
                    <label htmlFor="filter-type" className="block text-sm font-medium text-muted-foreground mb-1">📋 Type</label>
                    <Select value={filterType} onValueChange={(value) => {setFilterType(value); setCurrentPage(1);}}>
                    <SelectTrigger id="filter-type">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="New Medical License">New Medical License</SelectItem>
                        <SelectItem value="Renewal Medical License">Renewal Medical License</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="filter-status" className="block text-sm font-medium text-muted-foreground mb-1">⚡ Status</label>
                    <Select value={filterStatus} onValueChange={(value) => {setFilterStatus(value); setCurrentPage(1);}}>
                    <SelectTrigger id="filter-status">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status === 'ALL' ? 'All Statuses' : status}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="filter-payment" className="block text-sm font-medium text-muted-foreground mb-1">💳 Payment</label>
                    <Select value={filterPaymentStatus} onValueChange={(value) => {setFilterPaymentStatus(value); setCurrentPage(1);}}>
                    <SelectTrigger id="filter-payment">
                        <SelectValue placeholder="Filter by payment" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniquePaymentStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status === 'ALL' ? 'All Payments' : status}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">👁️ View</label>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowExtendedView(!showExtendedView)}
                      className="w-full"
                    >
                      {showExtendedView ? 'Basic View' : 'Extended View'}
                    </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading submissions for {currentDateRangeLabel.toLowerCase()}...</span>
              </div>
            ) : error ? (
              <div className="p-4 border rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            ) : filteredAndPaginatedSubmissions.length === 0 ? (
              <div className="text-center h-40 flex flex-col items-center justify-center text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2 opacity-50" />
                <p>No submissions found for {currentDateRangeLabel.toLowerCase()}.</p>
                <p className="text-sm">Try adjusting your filters or date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>📅 Submitted</TableHead>
                      <TableHead>👤 Full Name</TableHead>
                      <TableHead>📞 Contact</TableHead>
                      <TableHead>🏥 MMJ Card #</TableHead>
                      <TableHead>📋 Type</TableHead>
                      <TableHead>⚡ Status</TableHead>
                      {showExtendedView && (
                        <>
                          <TableHead>🎂 DOB</TableHead>
                          <TableHead>🏠 Address</TableHead>
                          <TableHead>🏪 Dispensary</TableHead>
                          <TableHead>💳 Payment</TableHead>
                          <TableHead>🆔 Patient ID</TableHead>
                        </>
                      )}
                      <TableHead>👥 Existing Patient?</TableHead>
                      <TableHead className="text-right">⚙️ Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndPaginatedSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDateSafe(submission.submitted_at, false)}
                          </div>
                          {submission.processed_at && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <span>✅ Processed: {formatDateSafe(submission.processed_at, false)}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">
                            {[submission.first_name, submission.middle_name, submission.last_name]
                              .filter(Boolean)
                              .join(' ')}
                          </div>
                          {submission.date_of_birth && !showExtendedView && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>🎂 DOB: {formatDateSafe(submission.date_of_birth)}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center gap-1">
                            <span>📧</span>
                            {submission.email || 'No email'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>📱</span>
                            {formatPhoneNumber(submission.phone_number)}
                          </div>
                        </TableCell>
                        <TableCell>{submission.mmj_card_number || 'N/A'}</TableCell>
                        <TableCell>
                          {getSubmissionTypeBadge(submission.submission_type)}
                        </TableCell>
                        <TableCell>
                           <Badge variant={getStatusVariant(submission.status || '')} className={`${getStatusClass(submission.status || '')} whitespace-nowrap`}>
                                {submission.status?.replace(/_/g, ' ') || 'Unknown'}
                            </Badge>
                        </TableCell>
                        {showExtendedView && (
                          <>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1">
                                <span>🎂</span>
                                {formatDateSafe(submission.date_of_birth)}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">
                              <div className="flex items-start gap-1">
                                <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <span>{formatAddress(submission)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1">
                                <span>🏪</span>
                                {submission.dispensary_location || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {getPaymentStatusBadge(submission.order_payment_status)}
                                {submission.payment && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    ${submission.payment.toFixed(2)}
                                  </div>
                                )}
                                {submission.promotion && (
                                  <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <span>🎟️</span>
                                    Promo: {submission.promotion}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1">
                                <span>🆔</span>
                                {submission.patient_id || 'N/A'}
                              </div>
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          {submission.patient_id ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              <UserCheck className="mr-1 h-3.5 w-3.5" /> Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <UserX className="mr-1 h-3.5 w-3.5" /> No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {submission.patient_id ? (
                              <Link href={`/patients/${submission.patient_id}`} passHref>
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Review Patient
                                </Button>
                              </Link>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => alert(`View details for submission ID: ${submission.id}\n(Status managed via webhooks)\n\nSubmission Type: ${submission.submission_type}\nSubmitted: ${formatDateSafe(submission.submitted_at, true)}\nStatus: ${submission.status}`)}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" /> View Details
                              </Button>
                            )}
                            {submission.license_photo_url && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(submission.license_photo_url!, '_blank')}
                                title="View License Photo"
                              >
                                📷
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
             {!isLoading && !error && totalFilteredCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
                    <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>📊 Showing {displayedCountStart.toLocaleString()}-{displayedCountEnd.toLocaleString()} of {totalFilteredCount.toLocaleString()} submissions</span>
                          <Badge variant="outline" className="text-xs">
                            {currentDateRangeLabel}
                          </Badge>
                        </div>
                        <div className="text-xs mt-1 flex items-center gap-4">
                          <span>🔄 Renewals: {renewalStats.renewals}</span>
                          <span>🆕 New: {renewalStats.newLicenses}</span>
                          <span>📈 Renewal Rate: {renewalStats.renewalPercentage}%</span>
                        </div>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrevPage}
                              disabled={currentPage === 1}
                          >
                              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                          </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextPage}
                              disabled={currentPage === totalPages}
                          >
                              Next <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Performance Warning for All Time */}
            {dateRange === 'all' && !isLoading && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Performance Notice</span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Loading all submissions may impact performance. Consider using a specific date range for better performance.
                </p>
              </div>
            )}

            {/* License Renewal Period Information */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">License Renewal Information</span>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p>• MMJ licenses typically expire every 12 months from the issue date</p>
                <p>• Patients can renew up to 60 days before expiration</p>
                <p>• The 12-month view shows the most relevant renewal period for tracking</p>
                <p>• Use filters to focus on specific submission types, statuses, or payment states</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}