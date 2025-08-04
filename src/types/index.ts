// types/index.ts - Add these interfaces to your existing types file

// Your existing Patient interface (keep as is)
export interface Patient {
  id: number;
  days_to_expiration: number;
  lastname: string;
  firstname: string;
  middlename?: string;
  mmj_card: string;
  mmj_card_expiration: string; // Date string "YYYY-MM-DD"
  birthdate: string; // Date string "YYYY-MM-DD"
  address1: string;
  city: string;
  state: string;
  zip: string;
  member_status: 'Member' | 'Non-Member' | 'VIP';
  email: string;
  cell: string;
  emailoptin: boolean;
  smsoptin: boolean;
  drivers_license?: string;
  license_expiration?: string; // Date string "YYYY-MM-DD"
  dispensary_name: string;
  customer_since: string; // Date string "YYYY-MM-DD"
  member_since?: string; // Date string "YYYY-MM-DD"
  number_of_visits: number;
  spent_to_date: number;
  last_communication_type?: 'email' | 'sms' | 'call';
  last_communication_date?: string; // Date string "YYYY-MM-DD"
  renewal_status?: 'Renewed' | 'Pending' | 'Lost';
  license_photo_url?: string;
  email_marketing_status?: string; // e.g., 'Subscribed', 'Unsubscribed'
}

// Add these new MailWizz interfaces to your existing types
export interface MailWizzSubscriber {
  subscriber_uid: string;
  email: string;
  status: string;
  date_added: string;
  last_updated: string;
  first_name?: string;
  last_name?: string;
}

export interface MailWizzCampaign {
  campaign_uid: string;
  campaign_id: string;
  name: string;
  status: string;
  date_sent?: string;
  subject?: string;
  type: string;
}

export interface EmailEngagement {
  campaign_uid: string;
  campaign_name: string;
  date_sent: string;
  opened: boolean;
  open_date?: string;
  clicked: boolean;
  click_date?: string;
  bounced: boolean;
  bounce_reason?: string;
  unsubscribed: boolean;
  unsubscribe_date?: string;
  delivered: boolean;
}

export interface EmailHistoryItem {
  type: string;
  patient: string;
  patient_email?: string;
  details: string;
  time: string;
  status: string;
  campaign_name: string;
  engagement_type: string;
}

// Keep all your existing interfaces below...
export interface Note {
  id: string;
  patient_id: number;
  note_content: string;
  created_at: string; // ISO date string
  // Optional user information if joined from the users table
  user?: {
    displayName?: string | null;
    email?: string | null;
  } | null;
}

export interface LicenseSubmission {
  id: string;
  submitted_at: string; // ISO date string
  submission_type: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  email: string;
  phone_number: string;
  date_of_birth: string;
  mmj_card_number: string;
  new_mmj_expiration_date: string;
  drivers_license_number?: string | null;
  drivers_license_expiration_date?: string | null;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  dispensary_location?: string | null;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  license_photo_url?: string | null;
  patient_id?: number | null;
  status: string;
  processed_at?: string | null;
  notes?: string | null;
}

// Extend the Note interface to include patient details when joined
export interface NoteWithPatient extends Note {
  patient?: Patient | null; // Includes patient data when joined
}

export interface EnhancedLicenseSubmission extends LicenseSubmission {
  isExistingPatient: boolean;
  matchedPatientId?: number | null;
}

export interface DashboardStats {
  totalPatients: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  communicationsSent: number;
  renewalRate: number;
}

export interface DashboardExpirationCardStats {
  expiredPatients: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  renewalRatePercentage?: number;
}

export interface ExpirationDataPoint {
  month: string;
  patients: number;
}

export interface ActivityLogItem {
  id: number;
  type: 'email' | 'sms' | 'call' | 'visit' | 'system';
  patient?: string;
  details: string;
  time: string;
  status?: 'sent' | 'delivered' | 'opened' | 'completed' | 'failed' | 'scheduled';
  user?: string;
}

export interface CallLog {
  id: string;
  patientId: number;
  patientName: string;
  callDate: string;
  callDuration: string;
  outcome: 'Renewed' | 'Interested' | 'Not Interested' | 'Voicemail' | 'No Answer' | 'Follow-up Required';
  notes: string;
  agentName: string;
  followUpDate?: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string; // Only for email
  body: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Types for dashboard submission stats
interface LocationStat {
  location: string;
  count: number;
}

export interface MonthlyTrendItem {
  month: string; // Formatted for display e.g., "Jan 2024"
  monthKey: string; // Formatted for sorting e.g., "2024-01"
  renewals: number;
  newLicenses: number;
  total: number;
}

export interface TypedSubmissionStats {
  topLocation: LocationStat | null;
  monthlyTrend: { month: string; monthKey: string; count: number }[];
  totalCount: number;
}

export interface MonthlyLocationBreakdown {
  location: string;
  month: string; // Display month e.g., "Jan 25"
  monthKey: string; // Sortable month key e.g., "2025-01"
  renewals: number;
  newLicenses: number;
}

export interface SubmissionStats {
  renewalStats: TypedSubmissionStats;
  newLicenseStats: TypedSubmissionStats;
  allLocationsMonthlyBreakdown: MonthlyLocationBreakdown[];
}

// Types for Demo Patient Page
export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  dataAiHint?: string;
}

export interface PurchaseRecord extends Product {
  purchaseDate: string; // e.g., "YYYY-MM-DD"
  quantity: number;
}

export interface AIProductSuggestion {
  productName: string;
  rationale: string;
}

export interface DemoNote {
  id: string;
  content: string;
  createdAt: string; // ISO string
  createdBy: string;
}

export interface DemoCommunicationLog {
  id: string;
  campaignName: string;
  type: 'EMAIL' | 'SMS';
  listOrSegment: string;
  sentAt: string; // ISO string
  status: string;
  templateName?: string;
}

// Types for Marketing Integration
export interface MarketingSendLog {
    id: string; // uuid
    subscriber_email: string;
    patient_id?: number | null;
    campaign_id?: string | null;
    campaign_name: string;
    campaign_type: 'EMAIL' | 'SMS' | 'OTHER';
    subject_line?: string | null;
    list_or_segment_targeted?: string | null;
    sent_at: string; // timestamptz
    status_from_marketing_system?: string | null;
    created_at?: string; // timestamptz
}

// Types for Chat Inbox
export interface ChatConversation {
  conversation_id: number;
  contact_name: string;
  sender_number: string;
  recipient_number: string;
  status: string; // "Open", "Solved", "Unread", etc.
  updated_at: string; // timestamptz
  created_at: string; // timestamptz
  last_message_content?: string | null;
  last_message_timestamp?: string | null;
}

export interface ChatMessage {
  message_id: number;
  conversation_id: number;
  message: string;
  direction: 'to' | 'from'; // "to" (received by us), "from" (sent by us)
  timestamp: string; // timestamptz
  sms_type: 'whatsapp'; // Assuming always "whatsapp" for this feature
  media_url?: string | null;
}

// Types for Chat Dashboard Analytics
// This type might become redundant if statusDistribution is directly an array
export interface ChatStatusDistributionObject {
  [status: string]: number; // e.g., { "Open": 10, "Solved": 5 }
}

export interface ChatStatusDistributionItem {
  status: string;
  count: number;
}

export interface ChatDashboardTodayMetrics {
  totalConversationsToday: number;
  responseRateToday: number; // Percentage
  avgResponseTimeMinutes: number; // In minutes, as per new SQL
  statusDistribution: ChatStatusDistributionItem[]; // Array of objects as per new SQL
  totalMessagesToday: number;
  sentMessagesToday: number;
  receivedMessagesToday: number;
  busiestHourToday: string; // String like "14:00" or "No data", as per new SQL
}