/**
 * Click Redirect Service - GDP-006
 *
 * Manages email click tracking and attribution
 * Creates unique click tokens and tracks conversions back to email campaigns
 */

import { createClient } from '@supabase/supabase-js';
import {
  ClickToken,
  ConversionAttribution,
  MultiTouchAttribution,
  EmailClickStats,
  AttributionWindow,
} from '../types/clickRedirect';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

const DEFAULT_ATTRIBUTION_WINDOW: AttributionWindow = {
  clickAttribution: 72, // 3 days
  viewAttribution: 24, // 1 day
};

/**
 * Generate a unique click token for an email link
 */
export async function createClickToken(
  personId: string,
  campaignId: string,
  emailEventId: string,
  originalUrl: string,
  options?: {
    utmParameters?: Record<string, string>;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    linkIndex?: number;
  }
): Promise<ClickToken> {
  const clickTokenId = `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const attributionWindowHours = DEFAULT_ATTRIBUTION_WINDOW.clickAttribution;
  const expiresAt = new Date(Date.now() + attributionWindowHours * 60 * 60 * 1000).toISOString();

  const clickToken: ClickToken = {
    clickTokenId,
    personId,
    campaignId,
    emailEventId,
    originalUrl,
    utmSource: options?.utmParameters?.utm_source,
    utmMedium: options?.utmParameters?.utm_medium,
    utmCampaign: options?.utmParameters?.utm_campaign,
    utmContent: options?.utmParameters?.utm_content,
    utmTerm: options?.utmParameters?.utm_term,
    sessionId: options?.sessionId,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    deviceType: options?.deviceType,
    clickedAt: new Date().toISOString(),
    clickedLinkIndex: options?.linkIndex,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt,
  };

  // Store in database
  const { error } = await supabase.from('click_tokens').insert([
    {
      click_token_id: clickToken.clickTokenId,
      person_id: clickToken.personId,
      campaign_id: clickToken.campaignId,
      email_event_id: clickToken.emailEventId,
      original_url: clickToken.originalUrl,
      utm_source: clickToken.utmSource,
      utm_medium: clickToken.utmMedium,
      utm_campaign: clickToken.utmCampaign,
      utm_content: clickToken.utmContent,
      utm_term: clickToken.utmTerm,
      session_id: clickToken.sessionId,
      ip_address: clickToken.ipAddress,
      user_agent: clickToken.userAgent,
      device_type: clickToken.deviceType,
      clicked_at: clickToken.clickedAt,
      clicked_link_index: clickToken.clickedLinkIndex,
      expires_at: clickToken.expiresAt,
    },
  ]);

  if (error) {
    console.error('Error creating click token:', error);
    throw new Error(`Failed to create click token: ${error.message}`);
  }

  return clickToken;
}

/**
 * Record a click event and return redirect URL
 */
export async function recordClickAndRedirect(
  clickTokenId: string,
  destinationUrl: string,
  personalizedUrl?: string
): Promise<string> {
  // Update click token with click timestamp
  const { data, error } = await supabase
    .from('click_tokens')
    .update({
      clicked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('click_token_id', clickTokenId)
    .select()
    .single();

  if (error) {
    console.error('Error recording click:', error);
    // Still redirect even if recording fails
    return personalizedUrl || destinationUrl;
  }

  // Return redirect URL (personalized if available, otherwise original destination)
  return personalizedUrl || destinationUrl || data?.original_url || '/';
}

/**
 * Track a conversion back to email clicks
 */
export async function attributeConversion(
  conversionEventId: string,
  conversionEventName: string,
  personId: string,
  clickTokenId?: string,
  options?: {
    conversionValue?: number;
    currency?: string;
    timestamp?: string;
    attributionModel?: 'first-click' | 'last-click' | 'linear' | 'time-decay';
  }
): Promise<ConversionAttribution | null> {
  const timestamp = options?.timestamp || new Date().toISOString();

  // If no click token provided, try to find one for this person
  let finalClickTokenId = clickTokenId;

  if (!finalClickTokenId) {
    const { data, error } = await supabase
      .from('click_tokens')
      .select('click_token_id')
      .eq('person_id', personId)
      .gt('expires_at', new Date().toISOString())
      .order('clicked_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      finalClickTokenId = data.click_token_id;
    }
  }

  if (!finalClickTokenId) {
    console.warn(`No click token found for person ${personId}`);
    return null;
  }

  // Get click token details
  const { data: clickToken, error: getError } = await supabase
    .from('click_tokens')
    .select('*')
    .eq('click_token_id', finalClickTokenId)
    .single();

  if (getError || !clickToken) {
    console.error('Error finding click token:', getError);
    return null;
  }

  const attribution: ConversionAttribution = {
    conversionEventId,
    conversionEventName,
    personId,
    clickTokenId: finalClickTokenId,
    emailCampaignId: clickToken.campaign_id,
    emailEventId: clickToken.email_event_id,
    conversionValue: options?.conversionValue,
    currency: options?.currency,
    timestamp,
    attributionModel: options?.attributionModel || 'last-click',
    attributionCredit: 1.0, // Full credit to this click
    createdAt: new Date().toISOString(),
  };

  // Store attribution in database
  const { error: insertError } = await supabase.from('conversion_attributions').insert([
    {
      conversion_event_id: attribution.conversionEventId,
      conversion_event_name: attribution.conversionEventName,
      person_id: attribution.personId,
      click_token_id: attribution.clickTokenId,
      email_campaign_id: attribution.emailCampaignId,
      email_event_id: attribution.emailEventId,
      conversion_value: attribution.conversionValue,
      currency: attribution.currency,
      timestamp: attribution.timestamp,
      attribution_model: attribution.attributionModel,
      attribution_credit: attribution.attributionCredit,
    },
  ]);

  if (insertError) {
    console.error('Error recording conversion attribution:', insertError);
    throw new Error(`Failed to record conversion attribution: ${insertError.message}`);
  }

  // Update click token with conversion info
  await supabase
    .from('click_tokens')
    .update({
      conversion_event_id: conversionEventId,
      conversion_event_name: conversionEventName,
      conversion_value: options?.conversionValue,
      updated_at: new Date().toISOString(),
    })
    .eq('click_token_id', finalClickTokenId);

  return attribution;
}

/**
 * Get email click statistics for a campaign
 */
export async function getCampaignClickStats(
  campaignId: string,
  daysBack: number = 30
): Promise<EmailClickStats | null> {
  const sinceDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const { data: clicks, error } = await supabase
    .from('click_tokens')
    .select('*')
    .eq('campaign_id', campaignId)
    .gte('clicked_at', sinceDate);

  if (error) {
    console.error('Error getting click stats:', error);
    return null;
  }

  if (!clicks || clicks.length === 0) {
    return {
      campaignId,
      totalClicks: 0,
      uniqueClickers: 0,
      clickedLinks: [],
      conversionsByLink: {},
      revenueByLink: {},
    };
  }

  // Group by link
  const linkStats: Record<string, any> = {};

  for (const click of clicks) {
    const link = click.original_url;
    if (!linkStats[link]) {
      linkStats[link] = {
        linkUrl: link,
        clicks: 0,
        uniqueClickers: new Set(),
        conversions: 0,
        revenue: 0,
      };
    }
    linkStats[link].clicks++;
    linkStats[link].uniqueClickers.add(click.person_id);
    if (click.conversion_event_id) {
      linkStats[link].conversions++;
      if (click.conversion_value) {
        linkStats[link].revenue += click.conversion_value;
      }
    }
  }

  // Convert to arrays
  const clickedLinks = Object.values(linkStats).map((stat: any) => ({
    linkUrl: stat.linkUrl,
    clicks: stat.clicks,
    uniqueClickers: stat.uniqueClickers.size,
    conversionRate: stat.uniqueClickers.size > 0 ? stat.conversions / stat.uniqueClickers.size : 0,
    attributedRevenue: stat.revenue || undefined,
  }));

  return {
    campaignId,
    totalClicks: clicks.length,
    uniqueClickers: new Set(clicks.map((c) => c.person_id)).size,
    clickedLinks,
    conversionsByLink: Object.fromEntries(
      clickedLinks.map((l) => [l.linkUrl, Math.round(l.conversionRate * l.uniqueClickers)])
    ),
    revenueByLink: Object.fromEntries(
      clickedLinks.map((l) => [l.linkUrl, l.attributedRevenue || 0])
    ),
  };
}

/**
 * Get multi-touch attribution for a conversion
 */
export async function getMultiTouchAttribution(
  conversionEventId: string,
  personId: string
): Promise<MultiTouchAttribution | null> {
  // Get conversion details
  const { data: conversionData, error: convError } = await supabase
    .from('events')
    .select('*')
    .eq('event_name', 'purchase_completed')
    .eq('person_id', personId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (convError || !conversionData) {
    console.error('Error finding conversion:', convError);
    return null;
  }

  // Get all events for this person in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: allEvents, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('person_id', personId)
    .gte('timestamp', thirtyDaysAgo)
    .order('timestamp');

  if (eventsError) {
    console.error('Error getting events:', eventsError);
    return null;
  }

  // Build touchpoint attribution
  const touchpoints = (allEvents || []).map((event: any) => ({
    type: getEventType(event.event_name),
    timestamp: event.timestamp,
    eventId: event.event_id,
    credit: 0, // Will be calculated below
  }));

  // Calculate attribution using time-decay model
  const conversionTime = new Date(conversionData.timestamp).getTime();
  let totalCredit = 0;

  for (let i = 0; i < touchpoints.length; i++) {
    const touchpointTime = new Date(touchpoints[i].timestamp).getTime();
    const hoursBack = (conversionTime - touchpointTime) / (1000 * 60 * 60);

    // Time decay: more recent events get more credit
    const credit = Math.exp(-hoursBack / 24);
    touchpoints[i].credit = credit;
    totalCredit += credit;
  }

  // Normalize credits
  for (const touchpoint of touchpoints) {
    touchpoint.credit = totalCredit > 0 ? touchpoint.credit / totalCredit : 0;
  }

  const topTouchpoint = touchpoints.reduce((max, tp) => (tp.credit > max.credit ? tp : max), touchpoints[0]);

  return {
    conversionEventId: conversionData.event_id,
    conversionEventName: conversionData.event_name,
    conversionValue: conversionData.properties?.revenue || conversionData.properties?.value,
    personId,
    touchpoints,
    totalCredit,
    topChannel: topTouchpoint.type,
    topCampaign: 'unknown',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Helper function to determine event type
 */
function getEventType(
  eventName: string
): 'email_delivered' | 'email_opened' | 'email_clicked' | 'page_view' | 'other' {
  if (eventName.includes('email_delivered')) return 'email_delivered';
  if (eventName.includes('email_opened')) return 'email_opened';
  if (eventName.includes('email_clicked')) return 'email_clicked';
  if (eventName.includes('page_view')) return 'page_view';
  return 'other';
}

/**
 * Cleanup expired click tokens
 */
export async function cleanupExpiredClickTokens(): Promise<number> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('click_tokens')
    .delete()
    .lt('expires_at', now)
    .select();

  if (error) {
    console.error('Error cleaning up expired click tokens:', error);
    return 0;
  }

  return (data || []).length;
}
