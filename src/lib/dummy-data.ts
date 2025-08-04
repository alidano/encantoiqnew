
import type { Patient, DashboardStats, ExpirationDataPoint, ActivityLogItem, CallLog, CommunicationTemplate } from '@/types';
import { addDays, format, differenceInDays, parseISO } from 'date-fns';

const today = new Date();

// createPatient function and dummyPatients array are removed as patient data will come from Firestore.

export const dummyDashboardStats: DashboardStats = {
  totalPatients: 0, // This will be inaccurate until dashboard fetches live data
  expiringIn30Days: 0, // This will be inaccurate
  expiringIn60Days: 0, // This will be inaccurate
  expiringIn90Days: 0, // This will be inaccurate
  communicationsSent: 194,
  renewalRate: 78.5,
};

export const dummyExpirationData: ExpirationDataPoint[] = [
  { month: 'Jan', patients: 25 },
  { month: 'Feb', patients: 32 },
  { month: 'Mar', patients: 41 },
  { month: 'Apr', patients: 29 },
  { month: 'May', patients: 37 },
  { month: 'Jun', patients: 43 },
];

export const dummyActivityLog: ActivityLogItem[] = [
  { id: 1, type: 'email', patient: 'Luis Negron', details: "Sent 90-day renewal reminder", time: '2 hours ago', status: 'sent', user: 'System' },
  { id: 2, type: 'sms', patient: 'Linda Gonzalez', details: "Sent 60-day renewal SMS", time: '3 hours ago', status: 'delivered', user: 'System' },
  { id: 3, type: 'call', patient: 'Jose Ramos', details: "Logged call attempt for 30-day renewal", time: '5 hours ago', status: 'completed', user: 'Agent Smith' },
  { id: 4, type: 'visit', patient: 'Rafael Mercado', details: "Patient visited Dorado store", time: '1 day ago', user: 'Cashier Jane' },
  { id: 5, type: 'system', details: "Database backup completed", time: '1 day ago', status: 'completed' },
];

export const dummyCallLogs: CallLog[] = [
  { id: 'cl1', patientId: 3, patientName: 'Jose Ramos', callDate: format(addDays(today, -2), 'yyyy-MM-dd HH:mm'), callDuration: '10 mins', outcome: 'Interested', notes: 'Patient plans to renew next week.', agentName: 'Agent Smith', followUpDate: format(addDays(today, 7), 'yyyy-MM-dd') },
  { id: 'cl2', patientId: 2, patientName: 'Linda Gonzalez', callDate: format(addDays(today, -1), 'yyyy-MM-dd HH:mm'), callDuration: '5 mins', outcome: 'Voicemail', notes: 'Left voicemail regarding license expiration.', agentName: 'Agent Smith' },
];

export const dummyCommunicationTemplates: CommunicationTemplate[] = [
  { id: 'tpl1', name: '90-Day Email Reminder', type: 'email', subject: 'Your MMJ License Renewal Reminder', body: 'Hello {{patientName}}, your license is expiring in 90 days. Renew soon!', createdAt: format(addDays(today, -30), 'yyyy-MM-dd'), updatedAt: format(addDays(today, -5), 'yyyy-MM-dd') },
  { id: 'tpl2', name: '60-Day SMS Reminder', type: 'sms', body: 'Hi {{patientName}}, your MMJ license expires in 60 days. Visit us to renew!', createdAt: format(addDays(today, -30), 'yyyy-MM-dd'), updatedAt: format(addDays(today, -5), 'yyyy-MM-dd') },
];
