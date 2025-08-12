# EncantoIQ License Renewal Workflow - Complete Guide

## Overview
This document outlines the 3-tier license renewal contact system for EncantoIQ patients with expiring medical licenses.

## 🔄 Workflow Process

### Tier 1: SMS Automation (n8n)
**First point of contact - Automated SMS notifications**

- **Trigger**: Patients with licenses expiring in 7-60 days
- **System**: n8n automation reads from `customers` table
- **Contact Method**: SMS via patient's cell/phone number
- **API Endpoint**: `/api/n8n/sms-targets`

### Tier 2: Manual Call Logs (Agents)
**Second point of contact - Human agents make calls**

- **Trigger**: Patients who didn't respond to SMS or need follow-up
- **System**: Agents use the patient detail pages
- **Contact Method**: Phone calls with call log tracking
- **Interface**: Enhanced Call Logs section in patient details

### Tier 3: Email Automation (Future)
**Third point of contact - Automated email follow-up**

- **Status**: To be implemented
- **Trigger**: Patients who didn't respond to SMS or calls
- **Contact Method**: Automated email campaigns

## 📊 Database Structure

### Primary Table: `customers`
```sql
-- Core patient data with license information
customers (
  customerid VARCHAR PRIMARY KEY,  -- String ID (not numeric)
  firstname, lastname, email, cell, phone,
  redcard VARCHAR,                 -- License number (PA18-XXXXXXX)
  redcardyear, redcardmonth, redcardday,  -- Expiration date components
  location INTEGER,                -- References locations table
  deleted SMALLINT DEFAULT 0
)
```

### Legacy Tables (Being Migrated):
```sql
-- Call logs - currently uses numeric patient_id
call_logs (
  id UUID PRIMARY KEY,
  patient_id INTEGER,              -- Will migrate to customer_id VARCHAR
  call_outcome TEXT,
  call_notes TEXT,
  created_at TIMESTAMP,
  follow_up_date DATE
)

-- Patient notes - currently uses numeric patient_id  
patient_notes (
  id UUID PRIMARY KEY,
  patient_id INTEGER,              -- Will migrate to customer_id VARCHAR
  note_content TEXT,
  created_at TIMESTAMP
)
```

## 🔗 API Endpoints

### 1. For n8n SMS Automation
**GET** `/api/n8n/sms-targets`

**Parameters:**
- `days` (default: 30) - Days ahead to check for expiring licenses
- `urgency` (default: 'all') - Filter by urgency: 'critical', 'high', 'medium', 'all'
- `limit` (default: 100) - Maximum records to return

**Response Example:**
```json
{
  "success": true,
  "n8n_friendly": true,
  "data": [
    {
      "customer_id": "12345",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "primary_phone": "+1234567890",
      "email": "john@example.com",
      "license_number": "PA18-1234567",
      "expiration_date": "2025-09-15",
      "days_to_expiration": 15,
      "urgency_level": "high",
      "location_name": "Dorado Dispensary",
      "sms_ready": true,
      "sms_message_template": "Hi John, your medical license PA18-1234567 expires in 15 days. Schedule your renewal today to avoid interruption.",
      "workflow_priority": 2,
      "follow_up_days": 3
    }
  ],
  "metadata": {
    "total_sms_targets": 156,
    "urgency_breakdown": {
      "critical": 12,
      "high": 45,
      "medium": 99
    }
  }
}
```

**POST** `/api/n8n/sms-targets` - Log SMS status back from n8n

### 2. General Expiring Licenses API
**GET** `/api/expiring-licenses`

**Parameters:**
- `days` (default: 60) - Days ahead to check
- `format` ('json' or 'csv') - Response format
- `include_expired` (default: false) - Include already expired licenses

**Use Cases:**
- Export data for external analysis
- Generate reports
- Integrate with other systems

### 3. Data Verification API
**GET** `/api/check-data`

**Purpose:** Debug and verify customer data structure

## 🏥 User Interface Enhancements

### Patient Detail Page Improvements

1. **License Expiration Alert**
   - Visual alert for licenses expiring within 30 days
   - Color-coded by urgency (red=expired, orange=critical, yellow=warning)

2. **Enhanced Call Logs Section**
   - Renamed to "License Renewal Call Management"
   - Pre-configured call outcomes specific to renewal process
   - Prominent placement for agent workflow

3. **Contact Information**
   - Clickable phone numbers (`tel:` links)
   - Clickable email addresses (`mailto:` links)
   - Clear indication when contact info is missing

4. **Removed Patient Notes**
   - Eliminated redundancy (Call Logs serve the same purpose)
   - Streamlined interface for agents

## 📋 Call Outcome Types

Pre-configured options for agents:

- **License Renewal Interested** - Patient shows interest
- **License Renewal Scheduled** - Appointment booked
- **Renewal Appointment Booked** - Specific appointment set
- **Renewal Documents Needed** - Patient needs to gather documents
- **Renewal Payment Discussed** - Payment options explained
- **Not Interested in Renewal** - Patient declines
- **No Answer** - Call went unanswered
- **Callback Requested** - Patient requests callback
- **Voicemail Left** - Message left
- **Wrong Number** - Incorrect contact info
- **Do Not Call** - Patient requests no more calls
- **Follow-up Needed** - Requires additional contact
- **Completed Renewal Process** - Patient successfully renewed
- **Expired License Discussed** - Discussed expired status

## 🔧 Migration Plan

### Phase 1: Current State (Implemented)
- ✅ Fixed ID consistency issues between `customers` and legacy tables
- ✅ Updated patient listing to use `customers` table
- ✅ Enhanced call logs interface
- ✅ Created n8n SMS API endpoint
- ✅ Added license expiration alerts

### Phase 2: Database Migration (Recommended)
- 📋 Run migration script to add `customer_id` columns to legacy tables
- 📋 Update service functions to use `customer_id` instead of `patient_id`
- 📋 Remove temporary ID conversion logic

### Phase 3: Email Automation (Future)
- 📋 Implement email campaign system
- 📋 Create email templates for renewal reminders
- 📋 Build email automation workflow

## 🚀 Deployment Instructions

### For n8n Integration:
1. **SMS Workflow Setup:**
   ```
   HTTP Request Node → GET /api/n8n/sms-targets?days=30&urgency=critical
   ```

2. **Data Processing:**
   - Loop through each customer in response
   - Send SMS using your SMS provider
   - Log results back via POST endpoint

3. **Scheduling:**
   - Run daily for critical urgency (≤7 days)
   - Run weekly for high urgency (8-30 days)
   - Run monthly for medium urgency (31-60 days)

### For Agent Workflow:
1. **Access patient listing:** `/patients`
2. **Filter by expiration:** Use "1-60 Days (Most Urgent)" filter
3. **Open patient details:** Click on patient name
4. **Make call:** Use provided phone number links
5. **Log outcome:** Use "License Renewal Call Management" section

## 📈 Monitoring & Metrics

### Key Performance Indicators:
- **SMS Response Rate:** Track replies to automated SMS
- **Call Conversion Rate:** Successful renewals from agent calls
- **License Expiration Prevention:** Patients who renew before expiration
- **Agent Productivity:** Calls logged per agent per day

### Reporting Queries:
```sql
-- Daily expiring licenses count
SELECT COUNT(*) as expiring_today
FROM customers 
WHERE redcardyear = EXTRACT(year FROM CURRENT_DATE + INTERVAL '0 days')
  AND redcardmonth = EXTRACT(month FROM CURRENT_DATE + INTERVAL '0 days')
  AND deleted = 0;

-- Call outcomes summary
SELECT call_outcome, COUNT(*) as count
FROM call_logs 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY call_outcome
ORDER BY count DESC;
```

## 🔗 Next Steps

1. **Test the n8n integration** with the new API endpoint
2. **Train agents** on the enhanced call log workflow
3. **Run the database migration** when ready for full transition
4. **Monitor SMS and call metrics** to optimize the process
5. **Plan email automation** as the third tier of contact

---

This workflow ensures no patient with an expiring license falls through the cracks, with automated SMS as the first touch point, human agents for follow-up, and future email automation for comprehensive coverage.
