/**
 * Email Event Tracking Service
 * GDP-005: Email Event Tracking
 *
 * Provides analytics and metrics for email engagement:
 * - Person-level email metrics
 * - Campaign performance
 * - Link click analytics
 * - Email attribution
 */

import { supabaseAdmin } from './supabase';
import {
  PersonEmailMetrics,
  CampaignEmailMetrics,
  EmailEngagementTimeSeries,
  EmailLinkClick,
  EmailAttribution,
  EmailEventFilters,
  EmailHealthMetrics,
} from '../types/emailTracking';

/**
 * Get email engagement metrics for a specific person
 */
export async function getPersonEmailMetrics(
  personId: string
): Promise<PersonEmailMetrics> {
  // Get all email events for this person
  const { data: events, error } = await supabaseAdmin
    .from('event')
    .select('*')
    .eq('person_id', personId)
    .eq('event_source', 'email')
    .order('event_time', { ascending: false });

  if (error) {
    throw new Error(`Error fetching person email events: ${error.message}`);
  }

  const delivered = events.filter((e) => e.email_type === 'delivered');
  const opened = events.filter((e) => e.email_type === 'opened');
  const clicked = events.filter((e) => e.email_type === 'clicked');
  const bounced = events.filter((e) => e.email_type === 'bounced');
  const complained = events.filter((e) => e.email_type === 'complained');

  // Unique emails opened/clicked (by email_id)
  const uniqueEmailsOpened = new Set(opened.map((e) => e.email_id)).size;
  const uniqueEmailsClicked = new Set(clicked.map((e) => e.email_id)).size;

  // Calculate rates
  const totalDelivered = delivered.length;
  const openRate =
    totalDelivered > 0 ? (opened.length / totalDelivered) * 100 : 0;
  const clickRate =
    totalDelivered > 0 ? (clicked.length / totalDelivered) * 100 : 0;
  const clickToOpenRate = opened.length > 0 ? (clicked.length / opened.length) * 100 : 0;

  // Most clicked links
  const linkCounts = new Map<string, number>();
  clicked.forEach((e) => {
    if (e.email_link_url) {
      linkCounts.set(e.email_link_url, (linkCounts.get(e.email_link_url) || 0) + 1);
    }
  });
  const mostClickedLinks = Array.from(linkCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry) => entry[0]);

  return {
    person_id: personId,
    total_delivered: delivered.length,
    total_opened: opened.length,
    total_clicked: clicked.length,
    total_bounced: bounced.length,
    total_complained: complained.length,
    unique_emails_opened: uniqueEmailsOpened,
    unique_emails_clicked: uniqueEmailsClicked,
    open_rate: Math.round(openRate * 100) / 100,
    click_rate: Math.round(clickRate * 100) / 100,
    click_to_open_rate: Math.round(clickToOpenRate * 100) / 100,
    last_email_opened_at: opened[0]?.event_time || null,
    last_email_clicked_at: clicked[0]?.event_time || null,
    most_clicked_links: mostClickedLinks,
  };
}

/**
 * Get email campaign metrics
 */
export async function getCampaignEmailMetrics(
  campaign: string,
  daysBack = 30
): Promise<CampaignEmailMetrics> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: events, error } = await supabaseAdmin
    .from('event')
    .select('*')
    .eq('event_source', 'email')
    .gte('event_time', cutoffDate.toISOString());

  if (error) {
    throw new Error(`Error fetching campaign email events: ${error.message}`);
  }

  // Filter by campaign tag
  const campaignEvents = events.filter(
    (e) => e.properties?.tags?.campaign === campaign
  );

  const delivered = campaignEvents.filter((e) => e.email_type === 'delivered');
  const opened = campaignEvents.filter((e) => e.email_type === 'opened');
  const clicked = campaignEvents.filter((e) => e.email_type === 'clicked');
  const bounced = campaignEvents.filter((e) => e.email_type === 'bounced');
  const complained = campaignEvents.filter((e) => e.email_type === 'complained');

  // Unique counts
  const uniqueRecipients = new Set(campaignEvents.map((e) => e.person_id)).size;
  const uniqueOpeners = new Set(opened.map((e) => e.person_id)).size;
  const uniqueClickers = new Set(clicked.map((e) => e.person_id)).size;

  // Calculate rates
  const totalDelivered = delivered.length;
  const openRate = totalDelivered > 0 ? (uniqueOpeners / totalDelivered) * 100 : 0;
  const clickRate = totalDelivered > 0 ? (uniqueClickers / totalDelivered) * 100 : 0;
  const clickToOpenRate = uniqueOpeners > 0 ? (uniqueClickers / uniqueOpeners) * 100 : 0;
  const bounceRate = totalDelivered > 0 ? (bounced.length / totalDelivered) * 100 : 0;
  const complaintRate = totalDelivered > 0 ? (complained.length / totalDelivered) * 100 : 0;

  // Most clicked links
  const linkCounts = new Map<string, number>();
  clicked.forEach((e) => {
    if (e.email_link_url) {
      linkCounts.set(e.email_link_url, (linkCounts.get(e.email_link_url) || 0) + 1);
    }
  });
  const mostClickedLinks = Array.from(linkCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([url, clicks]) => ({ url, clicks }));

  return {
    campaign,
    total_delivered: delivered.length,
    total_opened: opened.length,
    total_clicked: clicked.length,
    total_bounced: bounced.length,
    total_complained: complained.length,
    unique_recipients: uniqueRecipients,
    unique_openers: uniqueOpeners,
    unique_clickers: uniqueClickers,
    open_rate: Math.round(openRate * 100) / 100,
    click_rate: Math.round(clickRate * 100) / 100,
    click_to_open_rate: Math.round(clickToOpenRate * 100) / 100,
    bounce_rate: Math.round(bounceRate * 100) / 100,
    complaint_rate: Math.round(complaintRate * 100) / 100,
    most_clicked_links: mostClickedLinks,
  };
}

/**
 * Get email engagement time series data
 */
export async function getEmailEngagementTimeSeries(
  daysBack = 30
): Promise<EmailEngagementTimeSeries[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: events, error } = await supabaseAdmin
    .from('event')
    .select('event_time, email_type')
    .eq('event_source', 'email')
    .gte('event_time', cutoffDate.toISOString())
    .order('event_time', { ascending: true });

  if (error) {
    throw new Error(`Error fetching email time series: ${error.message}`);
  }

  // Group events by date
  const dateMap = new Map<string, EmailEngagementTimeSeries>();

  events.forEach((event) => {
    const date = event.event_time.split('T')[0]; // YYYY-MM-DD
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
      });
    }

    const dayData = dateMap.get(date)!;
    if (event.email_type === 'delivered') dayData.delivered++;
    if (event.email_type === 'opened') dayData.opened++;
    if (event.email_type === 'clicked') dayData.clicked++;
    if (event.email_type === 'bounced') dayData.bounced++;
    if (event.email_type === 'complained') dayData.complained++;
  });

  return Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/**
 * Get email link click analytics
 */
export async function getEmailLinkClicks(
  daysBack = 30,
  limit = 20
): Promise<EmailLinkClick[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: events, error } = await supabaseAdmin
    .from('event')
    .select('*')
    .eq('event_source', 'email')
    .eq('email_type', 'clicked')
    .gte('event_time', cutoffDate.toISOString())
    .not('email_link_url', 'is', null)
    .order('event_time', { ascending: false });

  if (error) {
    throw new Error(`Error fetching email link clicks: ${error.message}`);
  }

  // Group by link URL
  const linkMap = new Map<string, {
    clicks: number;
    uniqueClickers: Set<string>;
    firstClickedAt: string;
    lastClickedAt: string;
    campaigns: Set<string>;
  }>();

  events.forEach((event) => {
    const url = event.email_link_url!;
    if (!linkMap.has(url)) {
      linkMap.set(url, {
        clicks: 0,
        uniqueClickers: new Set(),
        firstClickedAt: event.event_time,
        lastClickedAt: event.event_time,
        campaigns: new Set(),
      });
    }

    const linkData = linkMap.get(url)!;
    linkData.clicks++;
    linkData.uniqueClickers.add(event.person_id);
    linkData.lastClickedAt = event.event_time;

    const campaign = event.properties?.tags?.campaign;
    if (campaign) {
      linkData.campaigns.add(campaign);
    }
  });

  // Convert to array and sort by clicks
  const linkClicks: EmailLinkClick[] = Array.from(linkMap.entries())
    .map(([url, data]) => ({
      link_url: url,
      total_clicks: data.clicks,
      unique_clickers: data.uniqueClickers.size,
      first_clicked_at: data.firstClickedAt,
      last_clicked_at: data.lastClickedAt,
      campaigns: Array.from(data.campaigns),
    }))
    .sort((a, b) => b.total_clicks - a.total_clicks)
    .slice(0, limit);

  return linkClicks;
}

/**
 * Get email attribution data
 * Find conversions that happened after email clicks
 */
export async function getEmailAttribution(
  conversionEventName: string,
  attributionWindowDays = 7
): Promise<EmailAttribution[]> {
  const { data: clickEvents, error: clickError } = await supabaseAdmin
    .from('event')
    .select('*')
    .eq('event_source', 'email')
    .eq('email_type', 'clicked')
    .order('event_time', { ascending: false })
    .limit(1000);

  if (clickError) {
    throw new Error(`Error fetching click events: ${clickError.message}`);
  }

  const attributions: EmailAttribution[] = [];

  for (const clickEvent of clickEvents) {
    const windowEnd = new Date(clickEvent.event_time);
    windowEnd.setDate(windowEnd.getDate() + attributionWindowDays);

    // Find conversion events for this person within attribution window
    const { data: conversions, error: conversionError } = await supabaseAdmin
      .from('event')
      .select('*')
      .eq('person_id', clickEvent.person_id)
      .eq('event_name', conversionEventName)
      .gt('event_time', clickEvent.event_time)
      .lt('event_time', windowEnd.toISOString())
      .order('event_time', { ascending: true })
      .limit(1);

    if (conversionError) {
      console.error('Error fetching conversions:', conversionError);
      continue;
    }

    if (conversions && conversions.length > 0) {
      const conversion = conversions[0];

      // Get person email
      const { data: person } = await supabaseAdmin
        .from('person')
        .select('email')
        .eq('id', clickEvent.person_id)
        .single();

      const clickTime = new Date(clickEvent.event_time);
      const conversionTime = new Date(conversion.event_time);
      const timeToConvertSeconds = Math.floor(
        (conversionTime.getTime() - clickTime.getTime()) / 1000
      );

      attributions.push({
        person_id: clickEvent.person_id,
        email: person?.email || '',
        email_id: clickEvent.email_id || '',
        email_subject: clickEvent.email_subject || '',
        clicked_link: clickEvent.email_link_url || '',
        click_time: clickEvent.event_time,
        conversion_event: conversionEventName,
        conversion_time: conversion.event_time,
        revenue_cents: conversion.revenue_cents,
        time_to_convert_seconds: timeToConvertSeconds,
      });
    }
  }

  return attributions;
}

/**
 * Get email health metrics
 */
export async function getEmailHealthMetrics(
  daysBack = 30
): Promise<EmailHealthMetrics> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: events, error } = await supabaseAdmin
    .from('event')
    .select('*')
    .eq('event_source', 'email')
    .gte('event_time', cutoffDate.toISOString());

  if (error) {
    throw new Error(`Error fetching email health metrics: ${error.message}`);
  }

  const delivered = events.filter((e) => e.email_type === 'delivered');
  const bounced = events.filter((e) => e.email_type === 'bounced');
  const complained = events.filter((e) => e.email_type === 'complained');

  // Calculate rates
  const totalSent = delivered.length + bounced.length;
  const deliveryRate = totalSent > 0 ? (delivered.length / totalSent) * 100 : 0;
  const bounceRate = totalSent > 0 ? (bounced.length / totalSent) * 100 : 0;
  const complaintRate = delivered.length > 0 ? (complained.length / delivered.length) * 100 : 0;

  // Analyze domains with issues
  const domainIssues = new Map<string, { bounces: number; complaints: number }>();

  // Get person emails for bounced/complained events
  const problematicPersonIds = new Set([
    ...bounced.map((e) => e.person_id),
    ...complained.map((e) => e.person_id),
  ]);

  const { data: people } = await supabaseAdmin
    .from('person')
    .select('id, email')
    .in('id', Array.from(problematicPersonIds));

  const personEmailMap = new Map(
    people?.map((p) => [p.id, p.email]) || []
  );

  bounced.forEach((event) => {
    const email = personEmailMap.get(event.person_id);
    if (email) {
      const domain = email.split('@')[1];
      if (!domainIssues.has(domain)) {
        domainIssues.set(domain, { bounces: 0, complaints: 0 });
      }
      domainIssues.get(domain)!.bounces++;
    }
  });

  complained.forEach((event) => {
    const email = personEmailMap.get(event.person_id);
    if (email) {
      const domain = email.split('@')[1];
      if (!domainIssues.has(domain)) {
        domainIssues.set(domain, { bounces: 0, complaints: 0 });
      }
      domainIssues.get(domain)!.complaints++;
    }
  });

  const domainsWithIssues = Array.from(domainIssues.entries())
    .map(([domain, issues]) => ({ domain, ...issues }))
    .filter((d) => d.bounces + d.complaints > 5)
    .sort((a, b) => (b.bounces + b.complaints) - (a.bounces + a.complaints))
    .slice(0, 10);

  return {
    total_sent: totalSent,
    total_delivered: delivered.length,
    total_bounced: bounced.length,
    total_complained: complained.length,
    delivery_rate: Math.round(deliveryRate * 100) / 100,
    bounce_rate: Math.round(bounceRate * 100) / 100,
    complaint_rate: Math.round(complaintRate * 100) / 100,
    domains_with_issues: domainsWithIssues,
  };
}

/**
 * Get all campaigns
 */
export async function getAllCampaigns(daysBack = 90): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data: events, error } = await supabaseAdmin
    .from('event')
    .select('properties')
    .eq('event_source', 'email')
    .gte('event_time', cutoffDate.toISOString());

  if (error) {
    throw new Error(`Error fetching campaigns: ${error.message}`);
  }

  const campaigns = new Set<string>();
  events.forEach((event) => {
    const campaign = event.properties?.tags?.campaign;
    if (campaign) {
      campaigns.add(campaign);
    }
  });

  return Array.from(campaigns).sort();
}
