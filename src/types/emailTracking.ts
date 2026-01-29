/**
 * Email Event Tracking Types
 * GDP-005: Email Event Tracking
 */

import { EmailEventType } from './growthDataPlane';

/**
 * Email engagement metrics for a person
 */
export interface PersonEmailMetrics {
  person_id: string;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_complained: number;
  unique_emails_opened: number;
  unique_emails_clicked: number;
  open_rate: number; // opened / delivered
  click_rate: number; // clicked / delivered
  click_to_open_rate: number; // clicked / opened
  last_email_opened_at: string | null;
  last_email_clicked_at: string | null;
  most_clicked_links: string[];
}

/**
 * Campaign email metrics
 */
export interface CampaignEmailMetrics {
  campaign: string;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_complained: number;
  unique_recipients: number;
  unique_openers: number;
  unique_clickers: number;
  open_rate: number;
  click_rate: number;
  click_to_open_rate: number;
  bounce_rate: number;
  complaint_rate: number;
  most_clicked_links: Array<{ url: string; clicks: number }>;
}

/**
 * Email engagement over time
 */
export interface EmailEngagementTimeSeries {
  date: string;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}

/**
 * Email link click analytics
 */
export interface EmailLinkClick {
  link_url: string;
  total_clicks: number;
  unique_clickers: number;
  first_clicked_at: string;
  last_clicked_at: string;
  campaigns: string[];
}

/**
 * Email attribution data
 */
export interface EmailAttribution {
  person_id: string;
  email: string;
  email_id: string;
  email_subject: string;
  clicked_link: string;
  click_time: string;
  conversion_event: string;
  conversion_time: string;
  revenue_cents: number | null;
  time_to_convert_seconds: number;
}

/**
 * Email event query filters
 */
export interface EmailEventFilters {
  person_id?: string;
  campaign?: string;
  email_type?: EmailEventType;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

/**
 * Email health metrics
 */
export interface EmailHealthMetrics {
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_complained: number;
  delivery_rate: number;
  bounce_rate: number;
  complaint_rate: number;
  domains_with_issues: Array<{ domain: string; bounces: number; complaints: number }>;
}
