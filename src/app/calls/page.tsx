
"use client";

import * as React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dummyCallLogs, dummyCommunicationTemplates, dummyActivityLog } from "@/lib/dummy-data"; // Keep dummyCommunicationTemplates and dummyActivityLog for now
import { fetchPatients } from '@/services/patientService'; // Import fetchPatients
import type { Patient, CommunicationTemplate } from "@/types";
import { PhoneForwarded, UserPlus, ListFilter, Mail, MessageSquare, Smartphone, Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


const emailTemplates = dummyCommunicationTemplates.filter(t => t.type === 'email');
const emailHistoryLogs = dummyActivityLog.filter(log => log.type === 'email').slice(0, 5);

export default function CallsPage() {
  const { toast } = useToast();
  const [isEmailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [selectedPatientForEmail, setSelectedPatientForEmail] = React.useState<Patient | null>(null);
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = React.useState<string | undefined>(undefined);
  const [emailPreview, setEmailPreview] = React.useState('');
  
  const [allPatients, setAllPatients] = React.useState<Patient[]>([]);
  const [callQueuePatients, setCallQueuePatients] = React.useState<Patient[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = React.useState(true);
  const [queueError, setQueueError] = React.useState<string | null>(null);


  React.useEffect(() => {
    const loadPatientDataForQueue = async () => {
      setIsLoadingQueue(true);
      setQueueError(null);
      try {
        const fetchedPatients = await fetchPatients();
        setAllPatients(fetchedPatients);
        // Filter patients who need calls (e.g., expiring in 30 days)
        const queue = fetchedPatients.filter(p => p.days_to_expiration > 0 && p.days_to_expiration <= 30).slice(0,5);
        setCallQueuePatients(queue);
      } catch (e) {
        setQueueError("Failed to load patient data for call queue.");
        console.error(e);
      } finally {
        setIsLoadingQueue(false);
      }
    };
    loadPatientDataForQueue();
  }, []);


  const handleOpenEmailDialog = (patient: Patient) => {
    setSelectedPatientForEmail(patient);
    setSelectedEmailTemplateId(undefined);
    setEmailPreview('');
    setEmailDialogOpen(true);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedEmailTemplateId(templateId);
    const template = emailTemplates.find(t => t.id === templateId);
    if (template && selectedPatientForEmail) {
      const body = template.body.replace(/{{patientName}}/g, `${selectedPatientForEmail.firstname} ${selectedPatientForEmail.lastname}`);
      setEmailPreview(body);
    } else {
      setEmailPreview('');
    }
  };

  const handleSendEmail = () => {
    if (!selectedPatientForEmail || !selectedEmailTemplateId) return;

    const template = emailTemplates.find(t => t.id === selectedEmailTemplateId);
    toast({
      title: "Email Sent (Simulated)",
      description: `Email based on template "${template?.name}" sent to ${selectedPatientForEmail.firstname} ${selectedPatientForEmail.lastname}.`,
    });
    setEmailDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Call Management</h1>
          <Button><PhoneForwarded className="mr-2 h-4 w-4" /> Start Next Call</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Call Queue ({isLoadingQueue ? <Loader2 className="inline h-5 w-5 animate-spin" /> : callQueuePatients.length})</CardTitle>
              <CardDescription>Patients prioritized for calls based on license expiration.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingQueue ? (
                <div className="flex items-center justify-center h-[150px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   <span className="ml-2">Loading queue...</span>
                </div>
              ) : queueError ? (
                 <div className="p-4 border rounded-lg bg-destructive/10 text-destructive flex items-center gap-2 h-[150px]">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{queueError}</p>
                  </div>
              ) : callQueuePatients.length > 0 ? (
                <ul className="space-y-3">
                  {callQueuePatients.map(patient => (
                    <li key={patient.id} className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium">{patient.firstname} {patient.lastname}</p>
                        <p className="text-sm text-muted-foreground">Expires in {patient.days_to_expiration} days - {patient.cell}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEmailDialog(patient)}>
                          <Mail className="h-4 w-4 md:mr-2"/> <span className="hidden md:inline">Email</span>
                        </Button>
                        <Button variant="outline" size="sm">
                          <PhoneForwarded className="h-4 w-4 md:mr-2"/> <span className="hidden md:inline">Call Now</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground h-[150px] flex items-center justify-center">No patients currently in the call queue.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Log a Call</CardTitle>
              <CardDescription>Manually log details of a completed call.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingQueue ? ( 
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="patientSearch">Search Patient</Label>
                    <div className="flex gap-2 mt-1">
                      <Input id="patientSearch" placeholder="Name, MMJ Card, Phone..." />
                      <Button variant="outline" size="icon"><UserPlus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="callOutcome">Call Outcome</Label>
                    <Input id="callOutcome" placeholder="e.g., Renewed, Voicemail, Follow-up" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="callNotes">Call Notes</Label>
                    <Textarea id="callNotes" placeholder="Detailed notes about the call..." rows={3} className="w-full mt-1 p-2 border rounded-md bg-transparent focus:ring-ring focus:ring-1" />
                  </div>
                  <Button className="w-full">Save Call Log</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Call History</CardTitle>
                <CardDescription>Recent call logs and their outcomes.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input type="date" className="w-auto hidden md:block"/>
                <Button variant="outline" size="icon"><ListFilter className="h-4 w-4"/></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingQueue ? ( 
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  {dummyCallLogs.map(log => ( 
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.patientName}</TableCell>
                      <TableCell>{log.callDate}</TableCell>
                      <TableCell>{log.agentName}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            log.outcome === 'Renewed' || log.outcome === 'Interested' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            log.outcome === 'Not Interested' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            {log.outcome}
                          </span>
                      </TableCell>
                      <TableCell>{log.callDuration}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{log.notes}</TableCell>
                    </TableRow>
                  ))}
                  {dummyCallLogs.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={6} className="text-center h-24">No call logs available.</TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Email History</CardTitle>
                    <CardDescription>Recent email communications.</CardDescription>
                </div>
                <Button variant="outline" size="icon"><ListFilter className="h-4 w-4"/></Button>
            </div>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailHistoryLogs.map((log) => ( 
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        <Mail className="h-5 w-5" />
                      </TableCell>
                       <TableCell>{log.patient}</TableCell>
                      <TableCell className="max-w-md truncate">{log.details}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.time}</TableCell>
                       <TableCell>
                        {log.status && (
                           <span className={`px-2 py-1 text-xs rounded-full ${
                            log.status === 'delivered' || log.status === 'sent' || log.status === 'opened' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            log.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {emailHistoryLogs.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No email logs available.</TableCell>
                    </TableRow>
                 )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>

      </div>

      <Dialog open={isEmailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedPatientForEmail?.firstname} {selectedPatientForEmail?.lastname}</DialogTitle>
            <DialogDescription>
              Select an email template and preview the content before sending.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email-template" className="text-right col-span-1">
                Template
              </Label>
              <Select value={selectedEmailTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger id="email-template" className="col-span-3">
                  <SelectValue placeholder="Select an email template" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="email-preview" className="text-right col-span-1 pt-2">
                Preview
              </Label>
              <Textarea
                id="email-preview"
                value={emailPreview}
                readOnly
                className="col-span-3 min-h-[150px] bg-muted/50"
                placeholder="Email content will appear here once a template is selected."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSendEmail} disabled={!selectedEmailTemplateId}>Send Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
