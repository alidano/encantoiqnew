
"use client";

import * as React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserCircle, ShoppingCart, Sparkles, Package, DollarSign, Loader2, Lightbulb, Star, History, ClipboardPlus, Mail, MessageSquare, PhoneForwarded } from "lucide-react";
import Link from "next/link";
import type { Patient, PurchaseRecord, AIProductSuggestion, Product, LicenseSubmission, DemoNote, DemoCommunicationLog } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, addDays, subYears, differenceInDays, isValid, subDays } from 'date-fns';
import { getAIProductRecommendationsAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const demoPatientStaticData: Omit<Patient, 'days_to_expiration' | 'mmj_card_expiration' | 'customer_since' | 'member_since' | 'last_communication_date'> = {
  id: 9999,
  lastname: "OFarrill",
  firstname: "Luis",
  middlename: "A.",
  mmj_card: "DEMO12345",
  birthdate: "1985-07-15",
  address1: "123 Demo Street",
  city: "Demo City",
  state: "DS",
  zip: "00000",
  member_status: 'VIP',
  email: "alidano@gmail.com",
  cell: "+17873718815", 
  emailoptin: true,
  smsoptin: true,
  dispensary_name: "Encanto Tree Dispensary - Dorado",
  number_of_visits: 142,
  spent_to_date: 5350.75,
  last_communication_type: 'email',
  renewal_status: 'Pending',
  license_photo_url: "https://placehold.co/300x200.png",
};

const demoProducts: Product[] = [
    { id: 'prod1', name: '[AVANT] FLOWER VAPE', price: 80.00, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/%5BAVANT%5D%20FLOWER%20VAPE.jpg?alt=media&token=a9a0f43c-3f34-4f77-8c6c-290b5a948a7c', dataAiHint: 'vape flower' },
    { id: 'prod2', name: '[PORTOBELLO] GUMMIES 100MG', price: 20.00, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/%5BPORTOBELLO%5D%20GUMMIES%20100MG.jpg?alt=media&token=0a6a7e31-1f83-4f47-9a58-9b3e80a629c0', dataAiHint: 'gummies edible' },
    { id: 'prod3', name: '[VITAL] BERRY BERRY 25MG', price: 3.50, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/%5BVITAL%5D%20BERRY%20BERRY%2025MG.png?alt=media&token=8a1e2c8a-0b7d-4e6f-9c67-e20b6a1b2e7f', dataAiHint: 'edible berry' },
    { id: 'prod4', name: 'BUBBA WOOKIES 1000MG', price: 5.00, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/THE%20BUBBA%20FLOWER.png?alt=media&token=f9f3c22b-3e3d-4a5b-8a12-9c87d62e3f4a', dataAiHint: 'flower indica' },
    { id: 'prod5', name: 'MELON STOMPER 1000MG', price: 38.00, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/MELON%20STOMPER%201000MG.jpg?alt=media&token=2b1c4d9a-9e1f-4a8e-bd3c-d11c5a2b3c4d', dataAiHint: 'flower hybrid' },
    { id: 'prod6', name: 'NANOTECH ASSORTED GUMMIES 75MG', price: 9.00, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/NANOTECH%20ASSORTED%20GUMMIES%2075MG%2C.jpg?alt=media&token=7d3e1a5f-8c2b-4f7a-9e0a-f9b2c1d8e7a6', dataAiHint: 'gummies nano' },
    { id: 'prod7', name: 'OLD FASHIONED', price: 5.00, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/OLD%20FASHIONED.png?alt=media&token=a1b2c3d4-e5f6-7890-1234-567890abcdef', dataAiHint: 'flower classic' },
    { id: 'prod8', name: 'VIOLETONICA', price: 5.00, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/VIOLETONICA.png?alt=media&token=b2c3d4e5-f6a7-8901-2345-67890abcdeff', dataAiHint: 'flower purple' },
    { id: 'prod9', name: 'WHITE 99 FLOWER', price: 5.00, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/meditrack-crm-chj0n.firebasestorage.app/o/WHITE%2099%20FLOWER.png?alt=media&token=c3d4e5f6-a7b8-9012-3456-7890abcdef01', dataAiHint: 'flower white' },
];

const initialDemoPurchaseHistory: Omit<PurchaseRecord, 'purchaseDate'>[] = [
  { ...demoProducts[0], quantity: 1 }, 
  { ...demoProducts[2], quantity: 2 }, 
  { ...demoProducts[4], quantity: 1 }, 
  { ...demoProducts[5], quantity: 1 }, 
];

const initialMockAISuggestions: AIProductSuggestion[] = [
  { productName: demoProducts[1].name, rationale: "Based on your preference for gummies, you might also enjoy these high-quality Portobello Gummies." },
  { productName: demoProducts[3].name, rationale: "If you like potent flower, Bubba Wookies offers a strong indica experience." },
  { productName: demoProducts[6].name, rationale: "For a classic flower experience, consider the Old Fashioned strain." },
];

const createDemoSubmissions = (basePatient: Patient, count: number): LicenseSubmission[] => {
  const submissions: LicenseSubmission[] = [];
  let currentExpiration = parseISO(basePatient.mmj_card_expiration); 

  for (let i = 0; i < count; i++) {
    let processedDate = subYears(currentExpiration, 1); 
    const randomDayOffset = Math.floor(Math.random() * 30 - 15);
    processedDate = addDays(processedDate, randomDayOffset);
    const submittedAtDate = addDays(processedDate, - (Math.floor(Math.random() * 5) + 2) );

    submissions.push({
      id: `demo_sub_${basePatient.id}_${i + 1}`,
      submitted_at: format(submittedAtDate, 'yyyy-MM-dd HH:mm:ss'),
      submission_type: 'RENEWAL',
      first_name: basePatient.firstname,
      last_name: basePatient.lastname,
      email: basePatient.email,
      phone_number: basePatient.cell || '',
      date_of_birth: basePatient.birthdate,
      mmj_card_number: basePatient.mmj_card, 
      new_mmj_expiration_date: format(currentExpiration, 'yyyy-MM-dd'),
      email_opt_in: basePatient.emailoptin,
      sms_opt_in: basePatient.smsoptin,
      status: 'PROCESSED',
      processed_at: format(processedDate, 'yyyy-MM-dd HH:mm:ss'),
      patient_id: basePatient.id,
    });
    currentExpiration = processedDate; 
  }
  return submissions.sort((a,b) => parseISO(b.submitted_at).getTime() - parseISO(a.submitted_at).getTime());
};


const formatDateSafe = (dateString?: string | null, includeTime: boolean = false) => {
  if (!dateString) return "N/A";
  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) return "N/A";
  return format(parsedDate, includeTime ? 'MM/dd/yyyy HH:mm' : 'MM/dd/yyyy');
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
    return starIcons.length > 0 ? <div className="flex items-center gap-0.5">{starIcons}</div> : <span className="text-muted-foreground text-sm">0</span>;
};


export default function DemoPatientPage() {
  const { toast } = useToast();
  const [aiSuggestions, setAiSuggestions] = React.useState<AIProductSuggestion[]>(initialMockAISuggestions);
  const [isLoadingAISuggestions, setIsLoadingAISuggestions] = React.useState(false);
  
  const [isClientMounted, setIsClientMounted] = React.useState(false);
  const [currentDemoPatient, setCurrentDemoPatient] = React.useState<Patient | null>(null);
  const [currentDemoPurchaseHistory, setCurrentDemoPurchaseHistory] = React.useState<PurchaseRecord[]>([]);
  const [demoLicenseSubmissions, setDemoLicenseSubmissions] = React.useState<LicenseSubmission[]>([]);
  const [processedRenewalCount, setProcessedRenewalCount] = React.useState(0);

  const [demoNotes, setDemoNotes] = React.useState<DemoNote[]>([]);
  const [newNoteText, setNewNoteText] = React.useState('');
  const [demoCommunicationLog, setDemoCommunicationLog] = React.useState<DemoCommunicationLog[]>([]);
  const [isMakingCall, setIsMakingCall] = React.useState(false);

  React.useEffect(() => {
    const today = new Date();
    const currentDemoExpirationDate = addDays(today, 25);
    
    const patientData: Patient = {
        ...demoPatientStaticData,
        days_to_expiration: differenceInDays(currentDemoExpirationDate, today),
        mmj_card_expiration: format(currentDemoExpirationDate, 'yyyy-MM-dd'),
        customer_since: format(subYears(today, 6), 'yyyy-MM-dd'), 
        member_since: format(subYears(today, 2), 'yyyy-MM-dd'),
        last_communication_date: format(addDays(today, -7), 'yyyy-MM-dd'),
    };
    setCurrentDemoPatient(patientData);

    setCurrentDemoPurchaseHistory(initialDemoPurchaseHistory.map((item, index) => ({
        ...item,
        purchaseDate: format(addDays(today, -( (initialDemoPurchaseHistory.length - index) * 15 + 15) ), 'yyyy-MM-dd')
    })));
    
    const submissions = createDemoSubmissions(patientData, 5);
    setDemoLicenseSubmissions(submissions);
    const renewals = submissions.filter(
        sub => sub.submission_type === 'RENEWAL' && sub.status === 'PROCESSED'
    ).length;
    setProcessedRenewalCount(renewals);

    const initialDemoNotesData: DemoNote[] = [
        { id: 'note1', content: "Patient interested in trying new sativa strains for daytime use.", createdAt: format(subDays(today, 5), 'yyyy-MM-dd HH:mm'), createdBy: "Demo Admin" },
        { id: 'note2', content: "Followed up regarding last promotion, patient was happy with the discount.", createdAt: format(subDays(today, 12), 'yyyy-MM-dd HH:mm'), createdBy: "Demo Admin" },
    ];
    setDemoNotes(initialDemoNotesData);

    const initialDemoCommLogData: DemoCommunicationLog[] = [
        { id: 'comm1', campaignName: "Llenate de energia con Encanto", type: 'EMAIL', listOrSegment: "Encanto Tree - Botanik", sentAt: format(subDays(today, 10), 'yyyy-MM-dd HH:mm'), status: "Sent (100%)", templateName: "Llenate de amor con Encanto" },
        { id: 'comm2', campaignName: "Weekly Deals - Encanto", type: 'EMAIL', listOrSegment: "Weekly Deals Encanto", sentAt: format(subDays(today, 3), 'yyyy-MM-dd HH:mm'), status: "Sent (100%)", templateName: "Weekly Deals" },
        { id: 'comm3', campaignName: "FOUR20 LAST CALL", type: 'SMS', listOrSegment: "Encanto NA GROUP", sentAt: format(subDays(today, 20), 'yyyy-MM-dd HH:mm'), status: "Sent (98%)", templateName: "FOUR20 LAST CALL SMS" },
        { id: 'comm4', campaignName: "Upcoming Holiday Specials", type: 'EMAIL', listOrSegment: "All Active Patients", sentAt: format(subDays(today, 1), 'yyyy-MM-dd HH:mm'), status: "Draft" },
    ];
    setDemoCommunicationLog(initialDemoCommLogData);

    setIsClientMounted(true);
  }, []);


  const handleGetRecommendations = async () => {
    setIsLoadingAISuggestions(true);
    setAiSuggestions([]); 
    try {
      const recommendations = await getAIProductRecommendationsAction(currentDemoPurchaseHistory);
      setAiSuggestions(recommendations);
      if (recommendations.length === 0) {
        toast({
            title: "AI Recommendations",
            description: "The AI couldn't generate recommendations at this time, or no new recommendations were found.",
            variant: "default",
         });
      }
    } catch (error) {
      console.error("Failed to get AI recommendations:", error);
      toast({
        title: "Error",
        description: "Could not fetch AI recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAISuggestions(false);
    }
  };

  const handleAddDemoNote = () => {
    if (!newNoteText.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Note content cannot be empty." });
      return;
    }
    const newNote: DemoNote = {
      id: `note${demoNotes.length + 1}`,
      content: newNoteText,
      createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'), 
      createdBy: "Demo Admin (You)"
    };
    setDemoNotes(prevNotes => [newNote, ...prevNotes].sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()));
    setNewNoteText('');
    toast({ title: "Note Added (Demo)", description: "Note added to this demo patient." });
  };

  const handleDemoCall = async () => {
    if (!currentDemoPatient?.cell) {
        toast({
            variant: "destructive",
            title: "Cannot Make Call",
            description: "Demo patient phone number is missing.",
        });
        return;
    }
    setIsMakingCall(true);
    try {
      const response = await fetch('/api/telnyx/voice/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toNumber: currentDemoPatient.cell }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: "Call Initiated",
          description: `Calling ${currentDemoPatient.firstname} ${currentDemoPatient.lastname} at ${currentDemoPatient.cell}. Call ID: ${result.call_id}`,
        });
      } else {
        throw new Error(result.error || 'Failed to initiate call via API.');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Call Failed",
        description: error.message || "Could not initiate call. Check server logs or Telnyx setup.",
      });
      console.error("Failed to make call:", error);
    } finally {
      setIsMakingCall(false);
    }
  };
  
  const getDaysBadgeClass = (days?: number) => {
    if (days === undefined) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-500/50';
    if (days <= 0) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-500/50';
    if (days <= 30) return 'bg-accent text-accent-foreground border-accent/50';
    if (days <= 60) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-500/50';
    if (days <= 90) return 'bg-primary/20 text-primary dark:bg-primary/30 border-primary/50';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-500/50';
  };

  const getStatusBadgeClass = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('sent')) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    if (lowerStatus.includes('draft')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400';
    if (lowerStatus.includes('failed') || lowerStatus.includes('error')) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  if (!isClientMounted || !currentDemoPatient) {
    return (
        <AppLayout>
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading Demo Patient Profile...</span>
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
            <h1 className="text-3xl font-bold tracking-tight">
              {currentDemoPatient.firstname} {currentDemoPatient.lastname} (Demo Profile)
            </h1>
            <div className="flex gap-2 items-center">
                <Button 
                  onClick={handleDemoCall} 
                  variant="outline"
                  disabled={!currentDemoPatient.cell || isMakingCall}
                >
                    {isMakingCall ? <Loader2 className="h-4 w-4 animate-spin md:mr-2" /> : <PhoneForwarded className="h-4 w-4 md:mr-2"/>}
                     <span className="hidden md:inline">{isMakingCall ? "Calling..." : `Call Now (${currentDemoPatient.cell})`}</span>
                </Button>
                <Badge variant="destructive" className="text-sm">DEMO PAGE</Badge>
            </div>
          </div>
          <p className="text-muted-foreground">Patient ID: {currentDemoPatient.id}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary"/> Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><span className="font-medium text-muted-foreground">Full Name:</span> {currentDemoPatient.firstname} {currentDemoPatient.middlename || ''} {currentDemoPatient.lastname}</div>
              <div><span className="font-medium text-muted-foreground">Birthdate:</span> {formatDateSafe(currentDemoPatient.birthdate)}</div>
              <div><span className="font-medium text-muted-foreground">Email:</span> {currentDemoPatient.email}</div>
              <div><span className="font-medium text-muted-foreground">Cell Phone:</span> {currentDemoPatient.cell}</div>
              <div><span className="font-medium text-muted-foreground">Address:</span> {currentDemoPatient.address1}, {currentDemoPatient.city}, {currentDemoPatient.state} {currentDemoPatient.zip}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary"/> MMJ License & Membership</CardTitle>
            </CardHeader>
             {isClientMounted ? (
                <CardContent className="space-y-3 text-sm">
                  <div><span className="font-medium text-muted-foreground">MMJ Card #:</span> {currentDemoPatient.mmj_card}</div>
                  <div><span className="font-medium text-muted-foreground">Expiration:</span> {formatDateSafe(currentDemoPatient.mmj_card_expiration)}</div>
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <Badge variant="outline" className={`ml-2 px-2 py-0.5 text-xs border ${getDaysBadgeClass(currentDemoPatient.days_to_expiration)}`}>
                    {currentDemoPatient.days_to_expiration <= 0 ? 'Expired' : `Expires in ${currentDemoPatient.days_to_expiration} days`}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Member Status:</span>
                    <Badge variant={currentDemoPatient.member_status === 'VIP' ? 'default' : 'secondary'} className={`ml-2 ${currentDemoPatient.member_status === 'VIP' ? 'bg-primary/80 hover:bg-primary' : ''}`}>
                      {currentDemoPatient.member_status}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-muted-foreground">Processed Renewals:</span>
                    <span className="ml-2">{renderRenewalStars(processedRenewalCount)}</span>
                  </div>
                  <div><span className="font-medium text-muted-foreground">Dispensary:</span> {currentDemoPatient.dispensary_name}</div>
                  <div><span className="font-medium text-muted-foreground">Customer Since:</span> {formatDateSafe(currentDemoPatient.customer_since)}</div>
                </CardContent>
              ) : (
                 <CardContent className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              )}
          </Card>
        </div>
        
        {isClientMounted && demoLicenseSubmissions.length > 0 ? (
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/> License Submission History (Demo)</CardTitle>
                <CardDescription>Simulated renewal history for {currentDemoPatient.firstname}.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b">
                        <th className="py-2 px-3 font-medium text-muted-foreground">Submitted</th>
                        <th className="py-2 px-3 font-medium text-muted-foreground">Type</th>
                        <th className="py-2 px-3 font-medium text-muted-foreground">New Expiration</th>
                        <th className="py-2 px-3 font-medium text-muted-foreground">Status</th>
                        <th className="py-2 px-3 font-medium text-muted-foreground">Processed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {demoLicenseSubmissions.map(sub => (
                        <tr key={sub.id} className="border-b last:border-b-0 hover:bg-muted/50">
                            <td className="py-2 px-3 text-xs">{formatDateSafe(sub.submitted_at, true)}</td>
                            <td className="py-2 px-3">
                            <Badge variant={'default'}>RENEWAL</Badge>
                            </td>
                            <td className="py-2 px-3">{formatDateSafe(sub.new_mmj_expiration_date)}</td>
                            <td className="py-2 px-3">
                            <Badge variant={'default'} className={'bg-green-100 text-green-700'}>PROCESSED</Badge>
                            </td>
                            <td className="py-2 px-3 text-xs">{formatDateSafe(sub.processed_at, true)}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </CardContent>
            </Card>
        ) : isClientMounted && demoLicenseSubmissions.length === 0 ? (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/> License Submission History (Demo)</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">No submission history available for this demo patient.</p></CardContent>
            </Card>
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary"/> License Submission History (Demo)</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading history...</span>
                </CardContent>
            </Card>
        )}


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary"/> Purchase History</CardTitle>
            <CardDescription>Products purchased by {currentDemoPatient.firstname}.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isClientMounted || currentDemoPurchaseHistory.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                    {isClientMounted ? "No purchase history available for this demo patient." : <><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading purchase history...</span></>}
                </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentDemoPurchaseHistory.map((item) => (
                  <Card key={item.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="p-3">
                      <CardTitle className="text-base truncate" title={item.name}>{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-primary">${item.price.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                      </div>
                       <p className="text-xs text-muted-foreground mt-1">Purchased: {formatDateSafe(item.purchaseDate)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-accent"/> AI Product Recommendations</CardTitle>
                    <CardDescription>Suggested products for {currentDemoPatient.firstname}'s next visit.</CardDescription>
                </div>
                 <Button onClick={handleGetRecommendations} disabled={isLoadingAISuggestions}>
                    {isLoadingAISuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isLoadingAISuggestions ? "Getting Suggestions..." : "Get AI Recommendations"}
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAISuggestions ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading AI suggestions...</span>
              </div>
            ) : aiSuggestions.length === 0 && !isLoadingAISuggestions ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Click "Get AI Recommendations" to see what products this patient might like.
              </p>
            ) : (
              <div className="space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-muted/50 shadow-sm">
                    <h4 className="font-semibold text-md text-primary">{suggestion.productName}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{suggestion.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isClientMounted ? (
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardPlus className="h-5 w-5 text-primary"/> Patient Notes (Demo)</CardTitle>
                <CardDescription>Add and view notes related to this demo patient.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <Label htmlFor="new-demo-note">Add New Note</Label>
                <Textarea 
                    id="new-demo-note" 
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Enter note details here for the demo patient..."
                    rows={3}
                    className="mt-1"
                />
                <Button onClick={handleAddDemoNote} disabled={!newNoteText.trim()} className="mt-2">
                    Add Note
                </Button>
                </div>
                
                <div className="space-y-3">
                <h3 className="text-md font-semibold">Notes History</h3>
                {demoNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notes available for this demo patient.</p>
                ) : (
                    <ul className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {demoNotes.map(note => (
                        <li key={note.id} className="p-3 bg-muted/50 rounded-md text-sm border">
                        <p className="whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDateSafe(note.createdAt, true)} by {note.createdBy}
                        </p>
                        </li>
                    ))}
                    </ul>
                )}
                </div>
            </CardContent>
            </Card>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardPlus className="h-5 w-5 text-primary"/> Patient Notes (Demo)</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading notes...</span>
                </CardContent>
            </Card>
        )}

        {isClientMounted ? (
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/> Marketing Communication History (Demo)</CardTitle>
                <CardDescription>Simulated marketing emails and SMS sent to {currentDemoPatient.firstname}.</CardDescription>
            </CardHeader>
            <CardContent>
                {demoCommunicationLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">No communication history for this demo patient.</p>
                ) : (
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[50px]">Type</TableHead>
                        <TableHead>Campaign Name</TableHead>
                        <TableHead>List/Segment</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {demoCommunicationLog.map(log => (
                        <TableRow key={log.id}>
                            <TableCell className="text-muted-foreground">
                            {log.type === 'EMAIL' ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                            </TableCell>
                            <TableCell className="font-medium max-w-xs truncate" title={log.campaignName}>{log.campaignName}</TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate" title={log.listOrSegment}>{log.listOrSegment}</TableCell>
                            <TableCell className="text-xs">{formatDateSafe(log.sentAt, true)}</TableCell>
                            <TableCell>
                            <Badge variant="outline" className={`${getStatusBadgeClass(log.status)} whitespace-nowrap`}>
                                {log.status}
                            </Badge>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                )}
            </CardContent>
            </Card>
        ) : (
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/> Marketing Communication History (Demo)</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading communication history...</span>
                </CardContent>
            </Card>
        )}

      </div>
    </AppLayout>
  );
}

    