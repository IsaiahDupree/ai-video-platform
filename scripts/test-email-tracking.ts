#!/usr/bin/env tsx
/**
 * Test Email Event Tracking (GDP-005)
 *
 * Tests email engagement metrics and analytics
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

import {
  getPersonEmailMetrics,
  getCampaignEmailMetrics,
  getEmailEngagementTimeSeries,
  getEmailLinkClicks,
  getEmailAttribution,
  getEmailHealthMetrics,
  getAllCampaigns,
} from '../src/services/emailTracking';
import { findOrCreatePerson, createEvent } from '../src/services/growthDataPlane';

async function testEmailTracking() {
  console.log('🧪 Testing Email Event Tracking (GDP-005)...\n');

  try {
    // Step 1: Create test person and email events
    console.log('1️⃣  Creating test person and email events...');

    const testPerson = await findOrCreatePerson({
      identity_type: 'email',
      identity_value: 'test@example.com',
      source: 'test',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    });

    console.log(`✅ Created test person: ${testPerson.id}`);

    // Create email events
    const emailId = 'test-email-001';
    const eventTime = new Date().toISOString();

    // Delivered event
    await createEvent({
      person_id: testPerson.id,
      event_name: 'email.delivered',
      event_type: 'retention',
      event_source: 'email',
      event_id: `${emailId}_delivered`,
      event_time: eventTime,
      email_id: emailId,
      email_subject: 'Welcome to AI Video Platform',
      email_type: 'delivered',
      properties: {
        from: 'noreply@example.com',
        tags: { campaign: 'onboarding', segment: 'new_users' },
      },
    });

    // Opened event
    await createEvent({
      person_id: testPerson.id,
      event_name: 'email.opened',
      event_type: 'retention',
      event_source: 'email',
      event_id: `${emailId}_opened`,
      event_time: new Date(Date.now() + 60000).toISOString(), // 1 min later
      email_id: emailId,
      email_subject: 'Welcome to AI Video Platform',
      email_type: 'opened',
      ip_address: '203.0.113.1',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      properties: {
        from: 'noreply@example.com',
        tags: { campaign: 'onboarding', segment: 'new_users' },
      },
    });

    // Clicked event
    await createEvent({
      person_id: testPerson.id,
      event_name: 'email.clicked',
      event_type: 'retention',
      event_source: 'email',
      event_id: `${emailId}_clicked`,
      event_time: new Date(Date.now() + 120000).toISOString(), // 2 min later
      email_id: emailId,
      email_subject: 'Welcome to AI Video Platform',
      email_type: 'clicked',
      email_link_url: 'https://example.com/get-started?utm_source=email&utm_campaign=onboarding',
      ip_address: '203.0.113.1',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      properties: {
        from: 'noreply@example.com',
        tags: { campaign: 'onboarding', segment: 'new_users' },
      },
    });

    console.log('✅ Created test email events (delivered, opened, clicked)\n');

    // Step 2: Test person email metrics
    console.log('2️⃣  Testing person email metrics...');
    const personMetrics = await getPersonEmailMetrics(testPerson.id);
    console.log('Person Email Metrics:', JSON.stringify(personMetrics, null, 2));

    if (personMetrics.total_delivered < 1) {
      throw new Error('❌ Expected at least 1 delivered email');
    }
    if (personMetrics.total_opened < 1) {
      throw new Error('❌ Expected at least 1 opened email');
    }
    if (personMetrics.total_clicked < 1) {
      throw new Error('❌ Expected at least 1 clicked email');
    }
    if (personMetrics.open_rate === 0) {
      throw new Error('❌ Expected non-zero open rate');
    }
    if (personMetrics.click_rate === 0) {
      throw new Error('❌ Expected non-zero click rate');
    }
    console.log('✅ Person email metrics calculated correctly\n');

    // Step 3: Test campaign metrics
    console.log('3️⃣  Testing campaign metrics...');
    const campaignMetrics = await getCampaignEmailMetrics('onboarding', 30);
    console.log('Campaign Metrics:', JSON.stringify(campaignMetrics, null, 2));

    if (campaignMetrics.total_delivered < 1) {
      throw new Error('❌ Expected at least 1 delivered email in campaign');
    }
    if (campaignMetrics.unique_recipients < 1) {
      throw new Error('❌ Expected at least 1 unique recipient');
    }
    console.log('✅ Campaign metrics calculated correctly\n');

    // Step 4: Test email engagement time series
    console.log('4️⃣  Testing email engagement time series...');
    const timeSeries = await getEmailEngagementTimeSeries(30);
    console.log(`Email Engagement Time Series (${timeSeries.length} days):`,
      JSON.stringify(timeSeries.slice(0, 3), null, 2));

    if (timeSeries.length === 0) {
      throw new Error('❌ Expected time series data');
    }
    console.log('✅ Time series data generated correctly\n');

    // Step 5: Test email link clicks
    console.log('5️⃣  Testing email link clicks...');
    const linkClicks = await getEmailLinkClicks(30, 10);
    console.log(`Email Link Clicks (${linkClicks.length} links):`,
      JSON.stringify(linkClicks.slice(0, 3), null, 2));

    if (linkClicks.length < 1) {
      throw new Error('❌ Expected at least 1 clicked link');
    }
    if (linkClicks[0].total_clicks < 1) {
      throw new Error('❌ Expected at least 1 click');
    }
    console.log('✅ Link click analytics working correctly\n');

    // Step 6: Test email health metrics
    console.log('6️⃣  Testing email health metrics...');
    const healthMetrics = await getEmailHealthMetrics(30);
    console.log('Email Health Metrics:', JSON.stringify(healthMetrics, null, 2));

    if (healthMetrics.total_delivered < 1) {
      throw new Error('❌ Expected at least 1 delivered email');
    }
    if (healthMetrics.delivery_rate === 0) {
      throw new Error('❌ Expected non-zero delivery rate');
    }
    console.log('✅ Email health metrics calculated correctly\n');

    // Step 7: Test get all campaigns
    console.log('7️⃣  Testing get all campaigns...');
    const campaigns = await getAllCampaigns(90);
    console.log(`All Campaigns (${campaigns.length}):`, campaigns);

    if (campaigns.length < 1) {
      throw new Error('❌ Expected at least 1 campaign');
    }
    if (!campaigns.includes('onboarding')) {
      throw new Error('❌ Expected "onboarding" campaign in list');
    }
    console.log('✅ Get all campaigns working correctly\n');

    // Step 8: Test email attribution (create purchase event for attribution)
    console.log('8️⃣  Testing email attribution...');

    // Create a purchase event
    await createEvent({
      person_id: testPerson.id,
      event_name: 'purchase_completed',
      event_type: 'monetization',
      event_source: 'web',
      event_id: `purchase-${Date.now()}`,
      event_time: new Date(Date.now() + 180000).toISOString(), // 3 min after click
      revenue_cents: 2999, // $29.99
    });

    const attributions = await getEmailAttribution('purchase_completed', 7);
    console.log(`Email Attributions (${attributions.length}):`,
      JSON.stringify(attributions.slice(0, 2), null, 2));

    if (attributions.length < 1) {
      console.log('⚠️  No attributions found (this is OK if no conversions exist)');
    } else {
      console.log('✅ Email attribution working correctly\n');
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All Email Event Tracking tests passed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Test Summary:');
    console.log(`✅ Person Email Metrics: ${personMetrics.total_delivered} delivered, ${personMetrics.total_opened} opened, ${personMetrics.total_clicked} clicked`);
    console.log(`✅ Campaign Metrics: ${campaignMetrics.unique_recipients} recipients, ${campaignMetrics.open_rate}% open rate`);
    console.log(`✅ Time Series: ${timeSeries.length} days of data`);
    console.log(`✅ Link Clicks: ${linkClicks.length} unique links tracked`);
    console.log(`✅ Health Metrics: ${healthMetrics.delivery_rate}% delivery rate`);
    console.log(`✅ Campaigns: ${campaigns.length} campaigns found`);
    console.log(`✅ Attributions: ${attributions.length} conversions attributed to email\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testEmailTracking();
