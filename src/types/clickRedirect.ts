/**
 * Click Redirect Tracking Types - GDP-006
 *
 * Attribution spine for email → click → conversion tracking
 * Provides a redirect mechanism to track email link clicks and attribute them to subsequent conversions
 */

/**
 * Click token generated when email link is clicked
 * Used to identify and track the click through to conversion
 */
export interface ClickToken {
  // Unique identifier for this click token
  clickTokenId: string;

  // Person who clicked the link
  personId: string;

  // Email campaign identifier
  campaignId: string;

  // Email event that was clicked (from email_event table)
  emailEventId: string;

  // Original destination URL
  originalUrl: string;

  // UTM parameters captured at click time
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  // Session information
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';

  // Click metadata
  clickedAt: string; // ISO timestamp
  clickedLinkIndex?: number; // Which link in the email was clicked (0-based)

  // Attribution
  firstTouchAttributedEventId?: string; // First event after click
  allAttributedEventIds?: string[]; // All events within attribution window

  // Conversion tracking
  conversionEventId?: string; // Primary conversion event
  conversionEventName?: string; // e.g., 'purchase_completed'
  conversionValue?: number; // Revenue or other value
  timeToConvert?: number; // Milliseconds from click to conversion

  // Metadata
  createdAt: string;
  updatedAt: string;
  expiresAt: string; // When this click token expires (attribution window end)
}

/**
 * Click redirect URL parameters
 */
export interface ClickRedirectParams {
  clickTokenId: string;
  destinationUrl?: string;
  personalizedUrl?: string;
}

/**
 * Attribution window configuration
 */
export interface AttributionWindow {
  clickAttribution: number; // Hours to track conversions after click
  viewAttribution: number; // Hours for view-through attribution
}

/**
 * Email click statistics
 */
export interface EmailClickStats {
  campaignId: string;
  totalClicks: number;
  uniqueClickers: number;
  clickedLinks: Array<{
    linkUrl: string;
    linkText?: string;
    clicks: number;
    uniqueClickers: number;
    conversionRate?: number;
    attributedRevenue?: number;
  }>;
  conversionsByLink: Record<string, number>;
  revenueByLink: Record<string, number>;
}

/**
 * Conversion attribution record
 */
export interface ConversionAttribution {
  conversionEventId: string;
  conversionEventName: string;
  personId: string;
  clickTokenId: string;
  emailCampaignId: string;
  emailEventId: string;

  // Conversion details
  conversionValue?: number;
  currency?: string;
  timestamp: string;

  // Attribution model
  attributionModel: 'first-click' | 'last-click' | 'linear' | 'time-decay';
  attributionCredit: number; // 0-1, portion of credit attributed to this click

  // Metadata
  createdAt: string;
}

/**
 * Multi-touch attribution result
 */
export interface MultiTouchAttribution {
  conversionEventId: string;
  conversionEventName: string;
  conversionValue?: number;
  personId: string;

  // All touchpoints leading to conversion
  touchpoints: Array<{
    type: 'email_delivered' | 'email_opened' | 'email_clicked' | 'page_view' | 'other';
    timestamp: string;
    eventId: string;
    credit: number; // Attribution credit (0-1)
  }>;

  // Attribution summary
  totalCredit: number;
  topChannel: string;
  topCampaign: string;

  createdAt: string;
}

/**
 * Click redirect request payload
 */
export interface ClickRedirectRequest {
  clickTokenId: string;
  destinationUrl?: string;
  personalizedUrl?: string;
  campaignId?: string;
  emailEventId?: string;
}

/**
 * Click redirect response
 */
export interface ClickRedirectResponse {
  success: boolean;
  redirectUrl: string;
  clickTokenId: string;
  message?: string;
  error?: string;
}
