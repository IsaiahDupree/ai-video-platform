/**
 * Verify Stripe Webhook Integration (GDP-007)
 * Checks that all files exist and are properly structured
 */

import fs from 'fs';
import path from 'path';

const CHECKS = [
  {
    name: 'Stripe webhook types file exists',
    check: () =>
      fs.existsSync(path.join(process.cwd(), 'src/types/stripeWebhook.ts')),
  },
  {
    name: 'Stripe webhook processor service exists',
    check: () =>
      fs.existsSync(path.join(process.cwd(), 'src/services/stripeWebhookProcessor.ts')),
  },
  {
    name: 'Stripe webhook verification utility exists',
    check: () =>
      fs.existsSync(path.join(process.cwd(), 'src/utils/stripeWebhookVerify.ts')),
  },
  {
    name: 'Stripe webhook API route exists',
    check: () =>
      fs.existsSync(path.join(process.cwd(), 'src/app/api/webhooks/stripe/route.ts')),
  },
];

async function verify() {
  console.log('\n=== Stripe Webhook Integration Verification (GDP-007) ===\n');

  let allPassed = true;

  for (const check of CHECKS) {
    try {
      const passed = check.check();
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      if (!passed) {
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${check.name}`);
      console.log(`   Error: ${error}`);
      allPassed = false;
    }
  }

  // Check imports
  console.log('\nChecking imports...');
  try {
    const typesFile = fs.readFileSync(
      path.join(process.cwd(), 'src/types/stripeWebhook.ts'),
      'utf-8'
    );
    if (
      typesFile.includes('StripeWebhookEvent') &&
      typesFile.includes('StripeSubscription') &&
      typesFile.includes('ParsedStripeEvent')
    ) {
      console.log('✅ Stripe types exported correctly');
    } else {
      console.log('❌ Stripe types not properly exported');
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error checking types: ${error}`);
    allPassed = false;
  }

  try {
    const processorFile = fs.readFileSync(
      path.join(process.cwd(), 'src/services/stripeWebhookProcessor.ts'),
      'utf-8'
    );
    if (
      processorFile.includes('processStripeWebhook') &&
      processorFile.includes('parseStripeWebhook')
    ) {
      console.log('✅ Stripe webhook processor exports required functions');
    } else {
      console.log('❌ Stripe webhook processor missing required functions');
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error checking processor: ${error}`);
    allPassed = false;
  }

  try {
    const verifyFile = fs.readFileSync(
      path.join(process.cwd(), 'src/utils/stripeWebhookVerify.ts'),
      'utf-8'
    );
    if (
      verifyFile.includes('verifyStripeWebhook') &&
      verifyFile.includes('validateWebhookTimestamp')
    ) {
      console.log('✅ Stripe verification utility exports required functions');
    } else {
      console.log('❌ Stripe verification utility missing required functions');
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error checking verification: ${error}`);
    allPassed = false;
  }

  try {
    const routeFile = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/webhooks/stripe/route.ts'),
      'utf-8'
    );
    if (routeFile.includes('POST') && routeFile.includes('GET')) {
      console.log('✅ Stripe webhook API route has POST and GET handlers');
    } else {
      console.log('❌ Stripe webhook API route missing handlers');
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error checking route: ${error}`);
    allPassed = false;
  }

  console.log('\nChecking environment variables...');
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('✅ STRIPE_WEBHOOK_SECRET is configured');
  } else {
    console.log('⚠️  STRIPE_WEBHOOK_SECRET not configured (required for production)');
  }

  console.log('\n' + (allPassed ? '✅ All checks passed!' : '❌ Some checks failed'));
  console.log('\nSetup Instructions:');
  console.log('1. Add STRIPE_WEBHOOK_SECRET to .env');
  console.log('2. Go to https://dashboard.stripe.com/webhooks');
  console.log('3. Create a webhook endpoint');
  console.log('4. Set URL: https://your-domain.com/api/webhooks/stripe');
  console.log('5. Enable events:');
  console.log('   - customer.subscription.created');
  console.log('   - customer.subscription.updated');
  console.log('   - customer.subscription.deleted');
  console.log('   - invoice.payment_succeeded');
  console.log('   - invoice.payment_failed');
  console.log('   - charge.succeeded');
  console.log('   - charge.failed');
  console.log('6. Copy signing secret to STRIPE_WEBHOOK_SECRET in .env\n');

  process.exit(allPassed ? 0 : 1);
}

verify().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
