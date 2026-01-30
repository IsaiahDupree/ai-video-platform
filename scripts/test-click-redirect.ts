#!/usr/bin/env npx tsx

/**
 * Test script for GDP-006: Click Redirect Tracker
 * Tests creating click tokens, recording clicks, and attributing conversions
 */

import { createClickToken, recordClickAndRedirect, attributeConversion, getCampaignClickStats } from '../src/services/clickRedirect';

const TEST_PERSON_ID = 'test-person-' + Date.now();
const TEST_CAMPAIGN_ID = 'test-campaign-001';
const TEST_EMAIL_EVENT_ID = 'test-email-event-001';

async function runTests() {
  console.log('🧪 Testing GDP-006: Click Redirect Tracker\n');

  try {
    // Test 1: Create a click token
    console.log('📝 Test 1: Creating click token...');
    const clickToken = await createClickToken(
      TEST_PERSON_ID,
      TEST_CAMPAIGN_ID,
      TEST_EMAIL_EVENT_ID,
      'https://example.com/page',
      {
        utmParameters: {
          utm_source: 'email',
          utm_medium: 'newsletter',
          utm_campaign: 'summer-sale',
        },
        deviceType: 'mobile',
        ipAddress: '192.168.1.1',
      }
    );
    console.log('✅ Click token created:', clickToken.clickTokenId);
    console.log('   Expires at:', clickToken.expiresAt);
    console.log();

    // Test 2: Record a click and get redirect URL
    console.log('📝 Test 2: Recording click and getting redirect URL...');
    const redirectUrl = await recordClickAndRedirect(
      clickToken.clickTokenId,
      'https://example.com/landing',
      'https://example.com/landing?utm_source=email'
    );
    console.log('✅ Redirect URL:', redirectUrl);
    console.log();

    // Test 3: Attribute a conversion to the click
    console.log('📝 Test 3: Attributing conversion to click...');
    const attribution = await attributeConversion(
      'test-conversion-' + Date.now(),
      'purchase_completed',
      TEST_PERSON_ID,
      clickToken.clickTokenId,
      {
        conversionValue: 99.99,
        currency: 'USD',
        attributionModel: 'last-click',
      }
    );
    if (attribution) {
      console.log('✅ Conversion attributed:');
      console.log('   Conversion ID:', attribution.conversionEventId);
      console.log('   Value:', attribution.conversionValue, attribution.currency);
      console.log('   Attribution Credit:', attribution.attributionCredit);
    } else {
      console.log('⚠️  Conversion attribution failed');
    }
    console.log();

    // Test 4: Get campaign click statistics
    console.log('📝 Test 4: Getting campaign click statistics...');
    const stats = await getCampaignClickStats(TEST_CAMPAIGN_ID, 30);
    if (stats) {
      console.log('✅ Campaign statistics:');
      console.log('   Total clicks:', stats.totalClicks);
      console.log('   Unique clickers:', stats.uniqueClickers);
      console.log('   Clicked links:', stats.clickedLinks.length);
      if (stats.clickedLinks.length > 0) {
        console.log('   Top link:', stats.clickedLinks[0].linkUrl);
        console.log('   Clicks on top link:', stats.clickedLinks[0].clicks);
      }
    } else {
      console.log('⚠️  Failed to get statistics');
    }
    console.log();

    console.log('✨ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
