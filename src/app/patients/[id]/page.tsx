"use client";

import * as React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, AlertTriangle, UserCircle, Mail, Phone, CalendarDays, MapPin, Briefcase, Landmark, DollarSign, Edit, FileImage, History, Star, MessageSquare, PhoneCall, Calendar, AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from 'next/navigation';
import { fetchPatientById, fetchSubmissionsForPatient, fetchCallLogsByPatientId, addCallLog, fetchCallOutcomeTypes, type CallLog, type CallOutcomeType } from '@/services/patientService';
import type { Patient, LicenseSubmission } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { mailwizzService, type EmailEngagement } from '@/services/mailwizzService';
// Add this import for the PatientChatHistory component
import PatientChatHistory from '@/components/PatientChatHistory'; // Adjust path as needed

export default function PatientDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const patientId = typeof params.id === 'string' ? params.id : null;

  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = React.useState(true);
  const [patientError, setPatientError] = React.useState<string | null>(null);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const [licenseSubmissions, setLicenseSubmissions] = React.useState<LicenseSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = React.useState(false);
  const [submissionsError, setSubmissionsError] = React.useState<string | null>(null);
  const [processedRenewalCount, setProcessedRenewalCount] = React.useState(0);

  // MailWizz email history state
  const [emailHistory, setEmailHistory] = React.useState<EmailEngagement[]>([]);
  const [isLoadingEmailHistory, setIsLoadingEmailHistory] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  // Call logs state
  const [callLogs, setCallLogs] = React.useState<CallLog[]>([]);
  const [isLoadingCallLogs, setIsLoadingCallLogs] = React.useState(false);
  const [callLogsError, setCallLogsError] = React.useState<string | null>(null);
  const [isAddingCallLog, setIsAddingCallLog] = React.useState(false);

  // Call log form state
  const [newCallOutcome, setNewCallOutcome] = React.useState('');
  const [newCallNotes, setNewCallNotes] = React.useState('');
  const [newFollowUpDate, setNewFollowUpDate] = React.useState('');
  const [callOutcomeTypes, setCallOutcomeTypes] = React.useState<CallOutcomeType[]>([]);

  const loadPatientData = React.useCallback(async () => {
    if (!patientId) {
      setPatientError("Invalid patient ID.");
      setIsLoadingPatient(false);
      return;
    }
    setIsLoadingPatient(true);
    setPatientError(null);
    try {
      const fetchedPatient = await fetchPatientById(patientId);
      if (fetchedPatient) {
        setPatient(fetchedPatient);
        loadSubmissions(fetchedPatient); 
        if (fetchedPatient.email) {
          loadEmailHistory(fetchedPatient.email); // Load MailWizz email history
        }
      } else {
        setPatientError("Patient not found.");
      }
    } catch (e) {
      setPatientError("Failed to load patient details. Please try again later.");
      console.error(e);
    } finally {
      setIsLoadingPatient(false);
    }
  }, [patientId]);

  const loadSubmissions = React.useCallback(async (currentPatient: Patient | null) => {
    if (!currentPatient) return;
    setIsLoadingSubmissions(true);
    setSubmissionsError(null);
    try {
      const submissions = await fetchSubmissionsForPatient(currentPatient);
      setLicenseSubmissions(submissions);
      
      const renewals = submissions.filter(
        sub => sub.submission_type === 'RENEWAL' && sub.status === 'PROCESSED'
      ).length;
      setProcessedRenewalCount(renewals);

    } catch (error) {
      setSubmissionsError("Failed to load license submissions.");
      console.error("Error loading submissions: ", error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, []);

  // New MailWizz email history loader
  const loadEmailHistory = React.useCallback(async (patientEmail: string) => {
    if (!patientEmail) return;
    
    setIsLoadingEmailHistory(true);
    setEmailError(null);
    
    try {
      console.log(`🔍 Loading MailWizz history for: ${patientEmail}`);
      const history = await mailwizzService.getSubscriberCampaignHistory(patientEmail);
      
      console.log(`📧 Raw API response for ${patientEmail}:`, history);
      console.log(`📊 Total campaigns found: ${history.length}`);
      
      // Log detailed info for each campaign
      history.forEach((engagement, index) => {
        console.log(`Campaign ${index + 1}:`, {
          campaign_name: engagement.campaign_name,
          campaign_uid: engagement.campaign_uid,
          date_sent: engagement.date_sent,
          delivered: engagement.delivered,
          opened: engagement.opened,
          clicked: engagement.clicked,
          bounced: engagement.bounced,
          unsubscribed: engagement.unsubscribed,
          list_name: engagement.list_name
        });
      });
      
      // Remove duplicates based on campaign_uid and date_sent
      const uniqueHistory = history.filter((engagement, index, self) => 
        index === self.findIndex(e => 
          e.campaign_uid === engagement.campaign_uid && 
          e.date_sent === engagement.date_sent
        )
      );
      
      console.log(`🔄 After deduplication: ${uniqueHistory.length} unique campaigns`);
      
      // Log specific info about the "Llenate de energia con Encanto" campaigns
      const energiaCampaigns = uniqueHistory.filter(e => 
        e.campaign_name && e.campaign_name.toLowerCase().includes('llenate de energia')
      );
      console.log(`⚡ "Llenate de energia" campaigns found: ${energiaCampaigns.length}`);
      energiaCampaigns.forEach((campaign, index) => {
        console.log(`Energy Campaign ${index + 1}:`, {
          name: campaign.campaign_name,
          uid: campaign.campaign_uid,
          opened: campaign.opened,
          open_date: campaign.open_date,
          delivered: campaign.delivered,
          date_sent: campaign.date_sent
        });
      });
      
      setEmailHistory(uniqueHistory);
      
      if (uniqueHistory.length === 0) {
        console.log(`❌ No MailWizz email history found for ${patientEmail}`);
      } else {
        console.log(`✅ Successfully loaded ${uniqueHistory.length} campaigns for ${patientEmail}`);
      }
    } catch (error) {
      console.error('💥 Error loading MailWizz email history:', error);
      setEmailError('Failed to load email history from MailWizz');
    } finally {
      setIsLoadingEmailHistory(false);
    }
  }, []);

  const refreshEmailHistory = async () => {
    if (patient?.email) {
      await loadEmailHistory(patient.email);
      if (!emailError) {
        toast({
          title: "Email History Refreshed",
          description: "MailWizz email history has been updated.",
        });
      }
    }
  };

  const loadCallLogs = React.useCallback(async () => {
    if (!patientId) return;
    
    // Convert string patientId to number for legacy tables
    const numericPatientId = parseInt(patientId, 10);
    if (isNaN(numericPatientId)) {
      console.warn('[PatientDetailPage] Cannot convert patientId to number for call logs:', patientId);
      return;
    }
    setIsLoadingCallLogs(true);
    setCallLogsError(null);
    try {
      const logs = await fetchCallLogsByPatientId(numericPatientId);
      setCallLogs(logs);
    } catch (e) {
      setCallLogsError("Failed to load call logs.");
      console.error(e);
    } finally {
      setIsLoadingCallLogs(false);
    }
  }, [patientId]);

  const loadCallOutcomeTypes = React.useCallback(async () => {
    try {
      const types = await fetchCallOutcomeTypes();
      setCallOutcomeTypes(types);
    } catch (e) {
      console.error("Failed to load call outcome types:", e);
    }
  }, []);

  React.useEffect(() => {
    loadPatientData();
    loadCallLogs();
    loadCallOutcomeTypes();
  }, [patientId, loadPatientData, loadCallLogs, loadCallOutcomeTypes]);

  const handleAddCallLog = async () => {
    if (!patientId || !newCallOutcome) {
      toast({ variant: "destructive", title: "Error", description: "Call outcome is required." });
      return;
    }
    
    // Convert string patientId to number for legacy tables
    const numericPatientId = parseInt(patientId, 10);
    if (isNaN(numericPatientId)) {
      toast({ variant: "destructive", title: "Error", description: "Invalid patient ID." });
      return;
    }
    
    setIsAddingCallLog(true);
    try {
      await addCallLog(
        numericPatientId, 
        newCallOutcome, 
        newCallNotes.trim() || undefined,
        undefined, // removed call duration
        newFollowUpDate || undefined
      );
      setNewCallOutcome('');
      setNewCallNotes('');
      setNewFollowUpDate('');
      toast({ title: "Call Log Added", description: "Call log saved successfully." });
      loadCallLogs(); 
    } catch (error) {
      console.error("Failed to add call log:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save call log. Please try again." });
    } finally {
      setIsAddingCallLog(false);
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !patientId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a file to upload." });
      return;
    }
    
    // Convert string patientId to number for legacy functions
    const numericPatientId = parseInt(patientId, 10);
    if (isNaN(numericPatientId)) {
      toast({ variant: "destructive", title: "Error", description: "Invalid patient ID." });
      return;
    }
    
    setIsUploading(true);
    try {
      const photoUrl = await uploadLicensePhoto(numericPatientId, selectedFile);
      await updatePatientLicensePhotoUrl(numericPatientId, photoUrl);
      
      setPatient(prev => prev ? { ...prev, license_photo_url: photoUrl } : null);

      toast({ title: "Upload Successful", description: "License photo uploaded and linked." });
      setSelectedFile(null); 
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast({ variant: "destructive", title: "Upload Failed", description: (error as Error).message || "Could not upload license photo." });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDateSafe = (dateString?: string | null, includeTime: boolean = false) => {
    if (!dateString || !isValid(parseISO(dateString))) return "N/A";
    return format(parseISO(dateString), includeTime ? 'MM/dd/yyyy hh:mm a' : 'MM/dd/yyyy');
  };
  
  const getDaysBadgeClass = (days?: number) => {
    if (days === undefined) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-500/50';
    if (days <= 0) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-500/50';
    if (days <= 30) return 'bg-accent text-accent-foreground border-accent/50';
    if (days <= 60) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-500/50';
    if (days <= 90) return 'bg-primary/20 text-primary dark:bg-primary/30 border-primary/50';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-500/50';
  };

  const getEngagementScore = (engagement: EmailEngagement) => {
    if (engagement.unsubscribed) return { score: 'Unsubscribed', trend: 'down', color: 'text-red-600' };
    if (engagement.bounced) return { score: 'Bounced', trend: 'down', color: 'text-red-600' };
    if (engagement.clicked) return { score: 'High', trend: 'up', color: 'text-green-600' };
    if (engagement.opened) return { score: 'Medium', trend: 'up', color: 'text-blue-600' };
    if (engagement.delivered) return { score: 'Low', trend: 'neutral', color: 'text-gray-600' };
    return { score: 'Unknown', trend: 'neutral', color: 'text-gray-400' };
  };

  const renderRenewalStars = (count: number) => {
    const maxStars = 3;
    const stars = Math.min(count, maxStars);
    const starIcons = [];
    for (let i = 0; i < stars; i++) {
      starIcons.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-500" />);
    }
    if (count > maxStars) {
        starIcons.push(<span key="plus" className="text-xs ml-1">+{count - maxStars}</span>);
    }
    return starIcons.length > 0 ? <div className="flex items-center gap-0.5">{starIcons}</div> : null;
  };

  const getCallOutcomeBadgeClass = (outcome: string): string => {
    const lowerOutcome = outcome.toLowerCase();
    if (lowerOutcome.includes('interested') || lowerOutcome.includes('scheduled') || lowerOutcome.includes('completed')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    }
    if (lowerOutcome.includes('not_interested') || lowerOutcome.includes('do_not_call')) {
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    }
    if (lowerOutcome.includes('callback') || lowerOutcome.includes('follow_up')) {
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400';
    }
    if (lowerOutcome.includes('no_answer') || lowerOutcome.includes('voicemail')) {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  if (isLoadingPatient) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading patient details...</span>
        </div>
      </AppLayout>
    );
  }

  if (patientError) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Link href="/patients" legacyBehavior>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
            </Button>
          </Link>
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle /> Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{patientError}</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
     return (
      <AppLayout>
        <div className="space-y-6">
          <Link href="/patients" legacyBehavior>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
            </Button>
          </Link>
          <Card>
            <CardHeader><CardTitle>Patient Not Found</CardTitle></CardHeader>
            <CardContent><p>The requested patient could not be found.</p></CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link href="/patients" legacyBehavior>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{patient.firstname} {patient.lastname}</h1>
            <Button><Edit className="mr-2 h-4 w-4" /> Edit Patient</Button>
          </div>
          <p className="text-muted-foreground">Patient ID: {patient.id}</p>
          
          {/* License Expiration Alert */}
          {patient.days_to_expiration !== undefined && patient.days_to_expiration <= 30 && (
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              patient.days_to_expiration <= 0 ? 'bg-red-50 border-red-200 text-red-800' :
              patient.days_to_expiration <= 7 ? 'bg-orange-50 border-orange-200 text-orange-800' :
              'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold text-lg">
                    {patient.days_to_expiration <= 0 ? 'EXPIRED LICENSE' :
                     patient.days_to_expiration <= 7 ? 'CRITICAL: License Expiring Soon' :
                     'License Renewal Reminder'}
                  </h3>
                  <p>
                    {patient.days_to_expiration <= 0 
                      ? `License expired ${Math.abs(patient.days_to_expiration)} days ago. Urgent renewal needed!`
                      : `License expires in ${patient.days_to_expiration} days (${formatDateSafe(patient.license_exp_date)})`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary"/> Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><span className="font-medium text-muted-foreground">Full Name:</span> {patient.firstname} {patient.middlename || ''} {patient.lastname}</div>
              <div><span className="font-medium text-muted-foreground">Birthdate:</span> {formatDateSafe(patient.birthdate)}</div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Email:</span> 
                {patient.email ? (
                  <a href={`mailto:${patient.email}`} className="text-blue-600 hover:underline">{patient.email}</a>
                ) : (
                  <span className="text-red-500">No email available</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Cell Phone:</span> 
                {patient.cell ? (
                  <a href={`tel:${patient.cell}`} className="text-blue-600 hover:underline font-mono">{patient.cell}</a>
                ) : (
                  <span className="text-red-500">No phone available</span>
                )}
              </div>
              <div><span className="font-medium text-muted-foreground">Address:</span> {patient.address1}, {patient.city}, {patient.state} {patient.zip}</div>
              <div>
                <span className="font-medium text-muted-foreground">Email Opt-in:</span> 
                <Badge variant={patient.emailoptin ? "default" : "secondary"} className={`ml-2 ${patient.emailoptin ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {patient.emailoptin ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">SMS Opt-in:</span>
                 <Badge variant={patient.smsoptin ? "default" : "secondary"} className={`ml-2 ${patient.smsoptin ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {patient.smsoptin ? 'Yes' : 'No'}
                </Badge>
              </div>
              {patient.email_marketing_status && (
                <div>
                  <span className="font-medium text-muted-foreground">Marketing Status:</span>
                  <Badge className={`ml-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`}>
                    {patient.email_marketing_status}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary"/> MMJ License (Current)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="font-medium text-muted-foreground">MMJ Card #:</span> {patient.mmj_card}</div>
              <div><span className="font-medium text-muted-foreground">Expiration:</span> {formatDateSafe(patient.mmj_card_expiration)}</div>
              <div>
                <span className="font-medium text-muted-foreground">Status:</span>
                <Badge variant="outline" className={`ml-2 px-2 py-0.5 text-xs border ${getDaysBadgeClass(patient.days_to_expiration)}`}>
                  {patient.days_to_expiration <= 0 ? 'Expired' : `Expires in ${patient.days_to_expiration} days`}
                </Badge>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-muted-foreground">Processed Renewals:</span>
                <span className="ml-2">{processedRenewalCount > 0 ? renderRenewalStars(processedRenewalCount) : "0"}</span>
              </div>
               {patient.drivers_license && <div><span className="font-medium text-muted-foreground">Driver's License:</span> {patient.drivers_license}</div>}
               {patient.license_expiration && <div><span className="font-medium text-muted-foreground">License Exp:</span> {formatDateSafe(patient.license_expiration)}</div>}
              
              {patient.license_photo_url && (
                <div className="mt-4">
                  <Label className="font-medium text-muted-foreground">License Photo:</Label>
                  <div className="mt-1 relative w-full aspect-[3/2] rounded-md overflow-hidden border">
                    <Image src={patient.license_photo_url} alt="MMJ License Photo" fill style={{objectFit: "contain"}} data-ai-hint="license document"/>
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <Label htmlFor="license-upload" className="font-medium text-muted-foreground">
                  {patient.license_photo_url ? "Replace License Photo:" : "Upload License Photo:"}
                </Label>
                <Input id="license-upload" type="file" accept="image/*" onChange={handleFileSelect} className="text-xs"/>
                {selectedFile && (
                    <p className="text-xs text-muted-foreground">Selected: {selectedFile.name}</p>
                )}
                <Button onClick={handleFileUpload} disabled={isUploading || !selectedFile} className="w-full mt-2 text-xs" size="sm">
                  {isUploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileImage className="mr-2 h-3 w-3" />}
                  {isUploading ? "Uploading..." : "Upload Photo"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/> License Submission History</CardTitle>
                <CardDescription>History of license submissions for this patient.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingSubmissions ? (
                    <div className="flex items-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading submission history...
                    </div>
                ) : submissionsError ? (
                    <div className="text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4"/> {submissionsError}</div>
                ) : licenseSubmissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No license submission history found for this patient.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>MMJ Card #</TableHead>
                                    <TableHead>New Expiration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Processed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {licenseSubmissions.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="text-xs">{formatDateSafe(sub.submitted_at, true)}</TableCell>
                                        <TableCell>
                                            <Badge variant={sub.submission_type === 'RENEWAL' ? 'default' : 'secondary'}>
                                                {sub.submission_type === 'RENEWAL' ? 'Renewal' : 'New License'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{sub.mmj_card_number}</TableCell>
                                        <TableCell>{formatDateSafe(sub.new_mmj_expiration_date)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                sub.status === 'PROCESSED' ? 'default' : 
                                                sub.status === 'PENDING_REVIEW' ? 'outline' : 
                                                'destructive'
                                            } className={sub.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : sub.status === 'PENDING_REVIEW' ? '' : 'bg-red-100 text-red-700'}>
                                                {sub.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">{sub.processed_at ? formatDateSafe(sub.processed_at, true) : 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6"> 
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Membership & Dispensary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <span className="font-medium text-muted-foreground">Member Status:</span>
                        <Badge variant={patient.member_status === 'VIP' ? 'default' : 'secondary'} className={`ml-2 ${patient.member_status === 'VIP' ? 'bg-primary/80 hover:bg-primary' : ''}`}>
                            {patient.member_status}
                        </Badge>
                    </div>
                    <div><span className="font-medium text-muted-foreground">Dispensary:</span> {patient.dispensary_name?.replace('Encanto Giving Tree LLC ', '')}</div>
                    <div><span className="font-medium text-muted-foreground">Customer Since:</span> {formatDateSafe(patient.customer_since)}</div>
                    {patient.member_since && <div><span className="font-medium text-muted-foreground">Member Since:</span> {formatDateSafe(patient.member_since)}</div>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary"/> Activity & Engagement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div><span className="font-medium text-muted-foreground">Number of Visits:</span> {patient.number_of_visits}</div>
                    <div><span className="font-medium text-muted-foreground">Total Spent:</span> ${patient.spent_to_date?.toFixed(2)}</div>
                    {patient.last_communication_date && (
                        <>
                        <div><span className="font-medium text-muted-foreground">Last Communication:</span> {formatDateSafe(patient.last_communication_date)}</div>
                        <div><span className="font-medium text-muted-foreground">Communication Type:</span> <span className="capitalize">{patient.last_communication_type}</span></div>
                        </>
                    )}
                    {patient.renewal_status && <div><span className="font-medium text-muted-foreground">Renewal Status:</span> <Badge variant="outline">{patient.renewal_status}</Badge></div>}
                </CardContent>
            </Card>
        </div>

        {/* Call Logs Card - Enhanced for License Renewal Workflow */}
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-primary"/> License Renewal Call Management
            </CardTitle>
            <CardDescription>
              Track call outcomes and follow-ups for license renewal process. Use this to log all attempts to contact the patient about their expiring medical license.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="call-outcome">Call Outcome *</Label>
                <Select value={newCallOutcome} onValueChange={setNewCallOutcome}>
                  <SelectTrigger id="call-outcome" className="mt-1">
                    <SelectValue placeholder="Select call outcome..." />
                  </SelectTrigger>
                  <SelectContent>
                    {callOutcomeTypes
                      .filter(type => type.is_active)
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map(type => (
                        <SelectItem key={type.outcome_code} value={type.outcome_code}>
                          {type.outcome_label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="follow-up-date">Follow-up Date</Label>
                <Input 
                  id="follow-up-date"
                  type="date"
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="call-notes">Call Notes</Label>
                <Textarea 
                  id="call-notes"
                  value={newCallNotes}
                  onChange={(e) => setNewCallNotes(e.target.value)}
                  placeholder="Add details about the call..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              
              <div className="md:col-span-2">
                <Button 
                  onClick={handleAddCallLog} 
                  disabled={isAddingCallLog || !newCallOutcome} 
                  className="w-full md:w-auto"
                >
                  {isAddingCallLog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                  Log Call
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-md font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" /> Call History
              </h3>
              {isLoadingCallLogs ? (
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading call logs...
                </div>
              ) : callLogsError ? (
                <div className="text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4"/> {callLogsError}
                </div>
              ) : callLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No call logs available for this patient.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {callLogs.map(log => (
                    <div key={log.id} className="p-3 bg-muted/50 rounded-md text-sm border">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <Badge className={`w-fit ${getCallOutcomeBadgeClass(log.call_outcome)}`}>
                          {callOutcomeTypes.find(type => type.outcome_code === log.call_outcome)?.outcome_label || log.call_outcome}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDateSafe(log.created_at, true)}
                        </div>
                      </div>
                      
                      {log.call_notes && (
                        <p className="whitespace-pre-wrap text-sm mb-2">{log.call_notes}</p>
                      )}
                      
                      {log.follow_up_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          Follow-up: {formatDateSafe(log.follow_up_date)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* MailWizz Marketing Email History Card - Simplified */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary"/> Recent Email Campaigns
                </CardTitle>
                <CardDescription>
                  Last 10 marketing emails sent via MailWizz
                  {patient.email && (
                    <span className="text-xs ml-2 text-muted-foreground">
                      • {patient.email}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshEmailHistory}
                disabled={isLoadingEmailHistory || !patient.email}
              >
                {isLoadingEmailHistory ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!patient.email ? (
              <div className="text-center py-6 text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No email address available</p>
              </div>
            ) : isLoadingEmailHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-sm">Loading campaigns...</span>
              </div>
            ) : emailError ? (
              <div className="p-3 border rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{emailError}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto" 
                  onClick={refreshEmailHistory}
                >
                  Retry
                </Button>
              </div>
            ) : emailHistory.length > 0 ? (
              <div className="space-y-2">
                {emailHistory.slice(0, 10).map((engagement, index) => (
                  <div key={`${engagement.campaign_uid}-${index}`} className="p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{engagement.campaign_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(engagement.date_sent).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {engagement.list_name && (
                            <span className="ml-2">• {engagement.list_name}</span>
                          )}
                        </p>
                        
                        {/* Compact Status Badges */}
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <Badge variant={engagement.delivered ? "default" : "outline"} className="text-xs px-2 py-0.5">
                            {engagement.delivered ? "Delivered" : "Not Delivered"}
                          </Badge>
                          
                          <Badge 
                            variant={engagement.opened ? "default" : "outline"} 
                            className={`text-xs px-2 py-0.5 ${
                              engagement.opened 
                                ? "bg-green-100 text-green-700 border-green-300" 
                                : "text-gray-500"
                            }`}
                          >
                            {engagement.opened ? "Opened" : "Not Opened"}
                          </Badge>
                          
                          {engagement.clicked && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border-blue-300">
                              Clicked
                            </Badge>
                          )}
                          
                          {engagement.bounced && (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5">
                              Bounced
                            </Badge>
                          )}
                          
                          {engagement.unsubscribed && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 border-red-500 text-red-700">
                              Unsubscribed
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Simple Engagement Indicator */}
                      <div className="ml-2 text-right">
                        <div className={`w-2 h-2 rounded-full ${
                          engagement.unsubscribed || engagement.bounced ? 'bg-red-500' :
                          engagement.clicked ? 'bg-green-500' :
                          engagement.opened ? 'bg-blue-500' :
                          engagement.delivered ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {emailHistory.length > 10 && (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground">
                      Showing 10 of {emailHistory.length} campaigns
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No marketing campaigns found</p>
                <p className="text-xs mt-1">This patient may not be subscribed to any lists</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add the chat history component */}
        <PatientChatHistory 
          patientPhone={patient?.cell || ''} 
          patientName={patient ? `${patient.firstname} ${patient.lastname}` : 'Unknown Patient'}
        />

      </div>
    </AppLayout>
  );
}