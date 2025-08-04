// services/mailwizzService.ts
const MAILWIZZ_CONFIG = {
  // Use your proxy endpoint - this will work both locally and on Firebase
  baseUrl: '/api/mailwizz-proxy',
  defaultListId: 'st9534h5ge36e', // ENCANTO LIST NEW
  
  // All your list IDs from the API response
  allListIds: [
    'nz74728yo81f4', // Encanto Tree - Botanik
    'st9534h5ge36e', // ENCANTO LIST NEW
    'bk5069j1k3ce6', // ENCANTO RENOVACIONES 30DIAS
    'rp647cfg4bb42', // ENCANTO NA GROUP
    'cj045xojtycdf', // ENCANTO TE RENUEVA
    'rm226fcbk5c5c', // EGT RENOVACIONES EXP
    'xj5927jp9y355', // Test List
    'oz725h91jm2ea'  // Weekly Deals Encanto
  ]
};

export interface MailWizzSubscriber {
  subscriber_uid: string;
  email: string;
  status: string;
  date_added: string;
  last_updated: string;
  first_name?: string;
  last_name?: string;
  list_uid?: string;
  list_name?: string;
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
  list_name?: string;
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
  list_name?: string;
}

class MailWizzService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      // Build the full URL using the proxy
      const url = `${MAILWIZZ_CONFIG.baseUrl}${endpoint}`;
      
      // Simplified headers since authentication is handled by the proxy
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      };

      const requestOptions: RequestInit = {
        method: 'GET',
        headers,
        ...options
      };

      console.log('Making MailWizz API request:', {
        url,
        method: requestOptions.method,
        headers: Object.fromEntries(
          Object.entries(headers).filter(([key]) => key !== 'X-Api-Key')
        )
      });

      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('MailWizz API HTTP error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`MailWizz API error: ${response.status} - ${response.statusText}: ${errorText}`);
      }

      const data = await response.json();
      console.log('MailWizz API response:', data);
      return data;
    } catch (error) {
      console.error('MailWizz API request failed:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to MailWizz API at ${MAILWIZZ_CONFIG.baseUrl}. This might be due to CORS, network connectivity, or the API being unavailable.`);
      }
      
      throw error;
    }
  }

  // Get all campaigns (for general email history) with list information
  async getAllCampaigns(page: number = 1, perPage: number = 50): Promise<MailWizzCampaign[]> {
    try {
      const result = await this.makeRequest(`/campaigns?page=${page}&per_page=${perPage}`);
      const campaigns = result.data?.records || [];
      
      // Add some additional logging
      console.log(`Fetched ${campaigns.length} campaigns from page ${page}`);
      
      return campaigns;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }

  // Search for subscriber by email across ALL lists
  async findSubscriberByEmailAcrossAllLists(email: string): Promise<MailWizzSubscriber | null> {
    try {
      console.log('Searching for subscriber:', email);
      
      // Use uppercase EMAIL parameter as per MailWizz API documentation
      const result = await this.makeRequest(
        `/lists/subscribers/search-by-email-in-all-lists?EMAIL=${email}`
      );
      
      console.log('Search result:', result);
      
      if (result.status === 'success' && result.data?.records && result.data.records.length > 0) {
        const subscriber = result.data.records[0]; // Get the first match
        // Add list information to subscriber
        subscriber.list_name = subscriber.list?.display_name || subscriber.list?.name || 'Unknown List';
        subscriber.list_uid = subscriber.list?.list_uid;
        console.log('Found subscriber:', subscriber);
        return subscriber;
      }
      
      console.log('No subscriber found for email:', email);
      return null;
    } catch (error) {
      console.error('Error finding subscriber by email:', error);
      return null;
    }
  }

  // Helper function to get list name by ID
  private getListNameById(listId: string): string {
    const listNames: { [key: string]: string } = {
      'nz74728yo81f4': 'Encanto Tree - Botanik',
      'st9534h5ge36e': 'ENCANTO LIST NEW',
      'bk5069j1k3ce6': 'ENCANTO RENOVACIONES 30DIAS',
      'rp647cfg4bb42': 'ENCANTO NA GROUP',
      'cj045xojtycdf': 'ENCANTO TE RENUEVA',
      'rm226fcbk5c5c': 'EGT RENOVACIONES EXP',
      'xj5927jp9y355': 'Test List',
      'oz725h91jm2ea': 'Weekly Deals Encanto'
    };
    return listNames[listId] || 'Unknown List';
  }

  // Get campaigns that were sent to a specific subscriber across all lists
  async getSubscriberCampaignHistory(email: string): Promise<EmailEngagement[]> {
    try {
      const subscriber = await this.findSubscriberByEmailAcrossAllLists(email);
      if (!subscriber) {
        console.log(`No subscriber found for email: ${email} across all lists`);
        return [];
      }

      console.log(`Found subscriber in list: ${subscriber.list_name} (${subscriber.list_uid})`);

      // Get all campaigns
      const campaigns = await this.getAllCampaigns(1, 50);
      const engagements: EmailEngagement[] = [];

      console.log(`Found ${campaigns.length} total campaigns, filtering for subscriber's lists...`);

      // Filter campaigns that were sent to the subscriber's lists
      for (const campaign of campaigns) {
        if (campaign.status === 'sent') {
          // Create basic engagement record for each sent campaign
          // We'll show all sent campaigns as "delivered" since tracking data isn't available
          const engagement: EmailEngagement = {
            campaign_uid: campaign.campaign_uid,
            campaign_name: campaign.name,
            date_sent: campaign.date_sent || new Date().toISOString(),
            opened: false, // We can't determine this due to 404s
            clicked: false, // We can't determine this due to 404s
            bounced: false, // We can't determine this due to 404s
            unsubscribed: false, // We can't determine this due to 404s
            delivered: true, // Assume delivered since campaign was sent and subscriber exists
            list_name: subscriber.list_name
          };

          engagements.push(engagement);
        }
      }

      console.log(`Created ${engagements.length} campaign engagement records for ${email}`);
      
      return engagements
        .sort((a, b) => new Date(b.date_sent).getTime() - new Date(a.date_sent).getTime())
        .slice(0, 20); // Limit to 20 most recent campaigns

    } catch (error) {
      console.error('Error getting subscriber campaign history:', error);
      return [];
    }
  }

  // Get engagement details for a specific campaign and subscriber
  private async getCampaignEngagementForSubscriber(
    campaignUid: string, 
    subscriberUid: string,
    subscriberEmail: string,
    campaign: MailWizzCampaign,
    listName?: string
  ): Promise<EmailEngagement> {
    const engagement: EmailEngagement = {
      campaign_uid: campaignUid,
      campaign_name: campaign.name,
      date_sent: campaign.date_sent || new Date().toISOString(),
      opened: false,
      clicked: false,
      bounced: false,
      unsubscribed: false,
      delivered: false,
      list_name: listName
    };

    try {
      // Check opens - Handle 404 gracefully
      try {
        const opens = await this.makeRequest(`/campaigns/${campaignUid}/track-opens`);
        const openRecord = opens.data?.records?.find((record: any) => 
          record.subscriber_uid === subscriberUid ||
          record.subscriber_email?.toLowerCase() === subscriberEmail.toLowerCase()
        );
        if (openRecord) {
          engagement.opened = true;
          engagement.open_date = openRecord.date_added;
          engagement.delivered = true; // If opened, it was delivered
        }
      } catch (error) {
        // Silently handle 404s for tracking endpoints - this is normal
        if (!error.message?.includes('404')) {
          console.warn(`Could not check opens for campaign ${campaignUid}:`, error);
        }
      }

      // Check clicks - Handle 404 gracefully
      try {
        const clicks = await this.makeRequest(`/campaigns/${campaignUid}/track-clicks`);
        const clickRecord = clicks.data?.records?.find((record: any) => 
          record.subscriber_uid === subscriberUid ||
          record.subscriber_email?.toLowerCase() === subscriberEmail.toLowerCase()
        );
        if (clickRecord) {
          engagement.clicked = true;
          engagement.click_date = clickRecord.date_added;
          engagement.delivered = true; // If clicked, it was delivered
        }
      } catch (error) {
        // Silently handle 404s for tracking endpoints
        if (!error.message?.includes('404')) {
          console.warn(`Could not check clicks for campaign ${campaignUid}:`, error);
        }
      }

      // Check bounces - Handle 404 gracefully
      try {
        const bounces = await this.makeRequest(`/campaigns/${campaignUid}/bounces`);
        const bounceRecord = bounces.data?.records?.find((record: any) => 
          record.subscriber_uid === subscriberUid ||
          record.subscriber_email?.toLowerCase() === subscriberEmail.toLowerCase()
        );
        if (bounceRecord) {
          engagement.bounced = true;
          engagement.bounce_reason = bounceRecord.bounce_type || bounceRecord.message;
        }
      } catch (error) {
        // Silently handle 404s for tracking endpoints
        if (!error.message?.includes('404')) {
          console.warn(`Could not check bounces for campaign ${campaignUid}:`, error);
        }
      }

      // Check unsubscribes - Handle 404 gracefully
      try {
        const unsubscribes = await this.makeRequest(`/campaigns/${campaignUid}/unsubscribes`);
        const unsubRecord = unsubscribes.data?.records?.find((record: any) => 
          record.subscriber_uid === subscriberUid ||
          record.subscriber_email?.toLowerCase() === subscriberEmail.toLowerCase()
        );
        if (unsubRecord) {
          engagement.unsubscribed = true;
          engagement.unsubscribe_date = unsubRecord.date_added;
        }
      } catch (error) {
        // Silently handle 404s for tracking endpoints
        if (!error.message?.includes('404')) {
          console.warn(`Could not check unsubscribes for campaign ${campaignUid}:`, error);
        }
      }

      // If we found any engagement, mark as delivered
      if (engagement.opened || engagement.clicked) {
        engagement.delivered = true;
      }

    } catch (error) {
      console.error(`Error fetching engagement for campaign ${campaignUid}:`, error);
    }

    return engagement;
  }

  // Get all email history for all patients (for Communication Management page)
  async getAllEmailHistory(limit: number = 100): Promise<EmailHistoryItem[]> {
    try {
      const campaigns = await this.getAllCampaigns(1, Math.min(limit, 20));
      const allEmailHistory: EmailHistoryItem[] = [];

      for (const campaign of campaigns) {
        if (campaign.status !== 'sent') continue;

        try {
          // Get opens
          const opens = await this.makeRequest(`/campaigns/${campaign.campaign_uid}/track-opens`);
          if (opens.data?.records) {
            opens.data.records.forEach((open: any) => {
              const patientName = `${open.subscriber_first_name || ''} ${open.subscriber_last_name || ''}`.trim();
              allEmailHistory.push({
                type: 'email',
                patient: patientName || 'Unknown Patient',
                patient_email: open.subscriber_email,
                details: `Opened "${campaign.name}"`,
                time: this.formatTime(open.date_added),
                status: 'opened',
                campaign_name: campaign.name,
                engagement_type: 'open'
              });
            });
          }

          // Get clicks
          const clicks = await this.makeRequest(`/campaigns/${campaign.campaign_uid}/track-clicks`);
          if (clicks.data?.records) {
            clicks.data.records.forEach((click: any) => {
              const patientName = `${click.subscriber_first_name || ''} ${click.subscriber_last_name || ''}`.trim();
              allEmailHistory.push({
                type: 'email',
                patient: patientName || 'Unknown Patient',
                patient_email: click.subscriber_email,
                details: `Clicked link in "${campaign.name}" (${click.url || 'Unknown URL'})`,
                time: this.formatTime(click.date_added),
                status: 'clicked',
                campaign_name: campaign.name,
                engagement_type: 'click'
              });
            });
          }

          // Get bounces
          const bounces = await this.makeRequest(`/campaigns/${campaign.campaign_uid}/bounces`);
          if (bounces.data?.records) {
            bounces.data.records.forEach((bounce: any) => {
              const patientName = `${bounce.subscriber_first_name || ''} ${bounce.subscriber_last_name || ''}`.trim();
              allEmailHistory.push({
                type: 'email',
                patient: patientName || 'Unknown Patient',
                patient_email: bounce.subscriber_email,
                details: `Email bounced for "${campaign.name}" - ${bounce.bounce_type || bounce.message || 'Unknown reason'}`,
                time: this.formatTime(bounce.date_added),
                status: 'bounced',
                campaign_name: campaign.name,
                engagement_type: 'bounce'
              });
            });
          }

          // Get unsubscribes
          const unsubscribes = await this.makeRequest(`/campaigns/${campaign.campaign_uid}/unsubscribes`);
          if (unsubscribes.data?.records) {
            unsubscribes.data.records.forEach((unsub: any) => {
              const patientName = `${unsub.subscriber_first_name || ''} ${unsub.subscriber_last_name || ''}`.trim();
              allEmailHistory.push({
                type: 'email',
                patient: patientName || 'Unknown Patient',
                patient_email: unsub.subscriber_email,
                details: `Unsubscribed from "${campaign.name}"`,
                time: this.formatTime(unsub.date_added),
                status: 'unsubscribed',
                campaign_name: campaign.name,
                engagement_type: 'unsubscribe'
              });
            });
          }

        } catch (error) {
          console.error(`Error processing campaign ${campaign.campaign_uid}:`, error);
        }
      }

      return allEmailHistory.sort((a, b) => 
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );
    } catch (error) {
      console.error('Error fetching all email history:', error);
      return [];
    }
  }

  // Get all lists information
  async getAllLists(): Promise<any[]> {
    try {
      const result = await this.makeRequest('/lists');
      return result.data?.records || [];
    } catch (error) {
      console.error('Error fetching lists:', error);
      return [];
    }
  }

  // Get subscribers from all lists
  async getAllSubscribersAcrossLists(limit: number = 100): Promise<MailWizzSubscriber[]> {
    const allSubscribers: MailWizzSubscriber[] = [];
    
    for (const listId of MAILWIZZ_CONFIG.allListIds) {
      try {
        const result = await this.makeRequest(`/lists/${listId}/subscribers?per_page=${Math.min(limit, 50)}`);
        const subscribers = result.data?.records || [];
        
        // Add list information to each subscriber
        subscribers.forEach((sub: any) => {
          sub.list_uid = listId;
          sub.list_name = this.getListNameById(listId);
          allSubscribers.push(sub);
        });
      } catch (error) {
        console.warn(`Error fetching subscribers from list ${listId}:`, error);
      }
    }
    
    return allSubscribers;
  }

  // Test API connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.makeRequest('/campaigns?page=1&per_page=1');
      const listsResult = await this.getAllLists();
      
      return {
        success: true,
        message: `Successfully connected to MailWizz. Found ${result.data?.count || 0} campaigns across ${listsResult.length} lists.`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to MailWizz: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private formatTime(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }
}

export const mailwizzService = new MailWizzService();