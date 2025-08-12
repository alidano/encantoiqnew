"use client";

import * as React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import type { Patient } from "@/types";
import { ChevronDown, Eye, Edit3, MessageSquarePlus, PlusCircle, Download, Filter, Search, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { parseISO, format, isValid } from 'date-fns';
import { fetchPatients, fetchUniqueDispensaryNames } from '@/services/patientService';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 50; // Increased for better UX

const PatientsPage = () => {
  const { toast } = useToast();
  const [allPatients, setAllPatients] = React.useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [filters, setFilters] = React.useState({
    expirationRange: 'all',
    location: 'all'
  });
  const [selectedRows, setSelectedRows] = React.useState<(string | number)[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [dispensaryNames, setDispensaryNames] = React.useState<string[]>([]);
  const [isClientMounted, setIsClientMounted] = React.useState(false);

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1500); // Increased to 1.5 seconds to give more time to type

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load patients when filters or page changes
  React.useEffect(() => {
    setIsClientMounted(true);
    const loadPageData = async () => {
      await loadPatients();
      try {
        const uniqueDispensaries = await fetchUniqueDispensaryNames();
        setDispensaryNames(uniqueDispensaries);
      } catch (e) {
        console.error("Failed to load unique dispensary names:", e);
      }
    };
    loadPageData();
  }, [currentPage, debouncedSearchTerm, filters]);

  const loadPatients = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const options = {
        limit: ITEMS_PER_PAGE,
        offset,
        searchTerm: debouncedSearchTerm || null,
        expirationFilter: filters.expirationRange !== 'all' ? filters.expirationRange : null,
        locationFilter: filters.location !== 'all' ? filters.location : null,
      };

      const { patients, totalCount } = await fetchPatients(options);
      
      setAllPatients(patients);
      setTotalPatients(totalCount);
      
      // Debug: Log sample patient data to see what fields are available
      if (patients.length > 0) {
        console.log('🔍 Sample patient data:', {
          id: patients[0].id,
          name: `${patients[0].firstname} ${patients[0].lastname}`,
          redcard: patients[0].redcard,
          license_exp_date: patients[0].license_exp_date,
          days_to_expiration: patients[0].days_to_expiration,
          redcardyear: patients[0].redcardyear,
          redcardmonth: patients[0].redcardmonth,
          redcardday: patients[0].redcardday,
          mmj_card: patients[0].mmj_card,
          mmj_card_expiration: patients[0].mmj_card_expiration
        });
      }

    } catch (e) {
      const errorMessage = "Failed to load patient data. Please try again later.";
      setError(errorMessage);
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error Loading Patients",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
    setSelectedRows([]); // Reset selection
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
    setSelectedRows([]); // Reset selection
  };

  const handleSelectAll = (checked: boolean | string) => {
    if (checked === true) {
      setSelectedRows(allPatients.map(p => p.id)); 
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean | string) => {
    if (checked === true) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };
  
  const getDaysBadgeClass = (days?: number) => {
    if (days === undefined || days === null || isNaN(days)) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-500/50';
    if (days <= 0) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-500/50';
    if (days <= 30) return 'bg-accent text-accent-foreground border-accent/50';
    if (days <= 60) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-500/50';
    if (days <= 90) return 'bg-primary/20 text-primary dark:bg-primary/30 border-primary/50';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-500/50';
  };

  const formatExpirationDate = (dateString?: string | null) => {
    if (!dateString || !isValid(parseISO(dateString))) {
      return "N/A";
    }
    return format(parseISO(dateString), 'MM/dd/yyyy');
  };

  const totalPages = Math.ceil(totalPatients / ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setSelectedRows([]); 
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSelectedRows([]); 
    }
  };
  
  const isSelectAllChecked = !isLoading && allPatients.length > 0 && allPatients.every(p => selectedRows.includes(p.id));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Patients {isLoading ? <Loader2 className="inline h-6 w-6 animate-spin" /> : `(${totalPatients.toLocaleString()} total)`}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Patient</Button>
          </div>
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-card shadow">
          <div className="flex flex-col md:flex-row gap-4">
            {isClientMounted ? (
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, or MMJ card..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
                {debouncedSearchTerm && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Searching for: "{debouncedSearchTerm}"
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex-grow h-10 bg-muted rounded-md animate-pulse" />
            )}
            <div className="flex gap-2 flex-wrap">
              <Select value={filters.expirationRange} onValueChange={(value) => handleFilterChange('expirationRange', value)} disabled={isLoading}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Expiration Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active (Non-Expired)</SelectItem>
                  <SelectItem value="expiring_today">Expiring Today</SelectItem>
                  <SelectItem value="1to60days">1-60 Days (Most Urgent)</SelectItem>
                  <SelectItem value="61to120days">61-120 Days</SelectItem>
                  <SelectItem value="120plusdays">120+ Days</SelectItem>
                  <SelectItem value="expired">Expired Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)} disabled={isLoading}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {dispensaryNames.map((name, index) => (
                    <SelectItem key={`location-${index}-${name}`} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full md:w-auto" disabled={isLoading}><Filter className="mr-2 h-4 w-4" /> More Filters</Button>
            </div>
          </div>
          {!isLoading && selectedRows.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">{selectedRows.length} selected on this page</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Bulk Actions <ChevronDown className="ml-2 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Send Email</DropdownMenuItem>
                  <DropdownMenuItem>Send SMS</DropdownMenuItem>
                  <DropdownMenuItem>Add to Call List</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Delete Selected</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-4 border rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={isSelectAllChecked}
                    onCheckedChange={handleSelectAll} 
                    aria-label="Select all rows on current page"
                    disabled={isLoading || allPatients.length === 0}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>MMJ Card</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !isClientMounted ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-60 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading patients...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : allPatients.length > 0 ? (
                allPatients.map((patient, index) => (
                  <TableRow key={`patient-${patient.id}-${index}`} data-state={selectedRows.includes(patient.id) ? "selected" : ""}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedRows.includes(patient.id)}
                        onCheckedChange={(checked) => handleSelectRow(patient.id, checked)}
                        aria-label={`Select row for ${patient.firstname} ${patient.lastname}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{patient.firstname} {patient.lastname}</TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate">
                      {patient.email ? (
                        <div className="flex items-center gap-1">
                          <span>{patient.email}</span>
                          {patient.emailoptin ? (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700">✓</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-red-100 text-red-700">✗</Badge>
                          )}
                        </div>
                      ) : (
                        'Not provided'
                      )}
                    </TableCell>
                    <TableCell>{patient.mmj_card || patient.redcard || 'N/A'}</TableCell>
                    <TableCell>{formatExpirationDate(patient.license_exp_date)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`px-2 py-0.5 text-xs border whitespace-nowrap ${getDaysBadgeClass(patient.days_to_expiration)}`}>
                        {patient.days_to_expiration === undefined || patient.days_to_expiration === null || isNaN(patient.days_to_expiration) ? 'N/A' : patient.days_to_expiration <= 0 ? 'Expired' : `${patient.days_to_expiration} days`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">{patient.dispensary_name?.replace('Encanto Giving Tree LLC ', '')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Link href={`/patients/${patient.id}`} passHref>
                          <Button variant="ghost" size="icon" aria-label="View patient"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" aria-label="Edit patient"><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label="Contact patient"><MessageSquarePlus className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No patients found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {isClientMounted && !isLoading && totalPatients > 0 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              {`Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalPatients)} of ${totalPatients.toLocaleString()} patients. Page ${currentPage} of ${totalPages}.`}
            </div>
            {totalPages > 1 && (
              <div className="flex gap-2 items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
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
      </div>
    </AppLayout>
  );
};

export default PatientsPage;