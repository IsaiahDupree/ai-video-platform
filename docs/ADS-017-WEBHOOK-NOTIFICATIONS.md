# ADS-017: Render Complete Webhook

**Status**: ✅ Complete
**Priority**: P2
**Effort**: 5pts
**Category**: static-ads

## Overview

A comprehensive webhook notification system that sends HTTP POST requests to registered endpoints when render jobs complete or fail. Provides secure HMAC-signed payloads, automatic retry logic with exponential backoff, delivery tracking, and statistics.

## Features

### Core Functionality

1. **Webhook Registration**
   - Register webhook URLs for specific events
   - Per-webhook secret for HMAC signature verification
   - Event-based subscriptions (complete, failed, started)
   - Enable/disable webhooks without deletion
   - Metadata attachment for custom context

2. **Event Types**
   - `render.complete` - Job completed successfully
   - `render.failed` - Job failed with error
   - `render.started` - Job processing started
   - `batch.complete` - Batch job completed
   - `batch.failed` - Batch job failed

3. **Secure Delivery**
   - HMAC-SHA256 signature in `X-Webhook-Signature` header
   - Webhook ID and event type in headers
   - User-Agent identification
   - Signature verification utility

4. **Retry Logic**
   - Configurable maximum attempts (default: 3)
   - Exponential backoff (default: 1s, 2s, 4s)
   - Configurable timeout (default: 30s)
   - Automatic retry on non-2xx responses

5. **Delivery Tracking**
   - Complete delivery history
   - Response time tracking
   - Success/failure rates
   - Per-webhook statistics
   - Attempt tracking

6. **Management Features**
   - Update webhook configuration
   - Rotate webhook secrets
   - Delete webhooks
   - Test webhook endpoints
   - Clear delivery history

## Architecture

### Components

```
┌──────────────────────────────────────────────────┐
│              Render Queue                         │
│  (Job completion events)                         │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│         Webhook Service                          │
│  - Event subscription                            │
│  - Signature generation                          │
│  - Retry management                              │
│  - Delivery tracking                             │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│         HTTP POST Request                        │
│  - HMAC signature                                │
│  - JSON payload                                  │
│  - Custom headers                                │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│         User Webhook Endpoint                    │
│  (Your application server)                       │
└──────────────────────────────────────────────────┘
```

### Data Flow

```
1. Render job completes in queue
   ↓
2. Webhook service queries registered webhooks
   ↓
3. Generate HMAC signature for payload
   ↓
4. Send HTTP POST to webhook URLs
   ↓
5. Retry on failure with backoff
   ↓
6. Store delivery result
   ↓
7. Update statistics
```

## Implementation

### File Structure

```
src/services/
  ├── webhooks.ts                     # Main webhook service (650+ lines)
  └── renderQueueWithWebhooks.ts      # Integration with render queue (75 lines)

scripts/
  └── test-webhooks.ts                # Test suite (650+ lines)

docs/
  └── ADS-017-WEBHOOK-NOTIFICATIONS.md  # This documentation

data/
  └── webhooks/
      └── webhooks.json               # Webhook storage
```

### Dependencies

All dependencies are built-in Node.js modules:
- `crypto` - HMAC signature generation
- `fs` - File storage
- `http` - Test server
- `fetch` - HTTP requests (Node.js 18+)

## Usage

### 1. Register a Webhook

```typescript
import { getWebhookService, WebhookEventType } from '../src/services/webhooks';

const webhookService = getWebhookService();

const webhook = webhookService.registerWebhook(
  'https://your-app.com/webhooks/render-complete',
  [WebhookEventType.RENDER_COMPLETE, WebhookEventType.RENDER_FAILED],
  {
    project: 'my-project',
    environment: 'production',
  }
);

console.log('Webhook registered!');
console.log('ID:', webhook.id);
console.log('Secret:', webhook.secret); // Store this securely!
```

### 2. Integrate with Render Queue

```typescript
import { createRenderQueueWithWebhooks } from '../src/services/renderQueueWithWebhooks';

// Create queue with webhook support enabled
const queue = createRenderQueueWithWebhooks({
  webhooks: {
    enabled: true,
    storageDir: 'data/webhooks',
  },
});

// Start worker
queue.startWorker(2);

// Add a job - webhooks will fire automatically on completion
await queue.addTemplateRenderJob(template, { format: 'png' });
```

### 3. Receive Webhooks

Your webhook endpoint should handle POST requests:

```typescript
// Express.js example
app.post('/webhooks/render-complete', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const webhookId = req.headers['x-webhook-id'];
  const event = req.headers['x-webhook-event'];

  // Get webhook secret from your database
  const webhook = await getWebhookFromDB(webhookId);

  // Verify signature
  const payload = JSON.stringify(req.body);
  const isValid = webhookService.verifySignature(
    payload,
    signature,
    webhook.secret
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  console.log('Render job completed:', req.body.jobId);
  console.log('Total rendered:', req.body.data.totalRendered);
  console.log('Duration:', req.body.data.duration, 'ms');

  // Respond with 2xx to acknowledge receipt
  res.json({ received: true });
});
```

### 4. Webhook Payload Format

```json
{
  "event": "render.complete",
  "timestamp": 1706400000000,
  "jobId": "template-ad-1-1706400000000",
  "data": {
    "success": true,
    "results": [
      {
        "success": true,
        "outputPath": "/path/to/output.png",
        "format": "png",
        "width": 1080,
        "height": 1080,
        "fileSize": 245678,
        "duration": 1234
      }
    ],
    "totalRendered": 1,
    "totalFailed": 0,
    "startTime": 1706400000000,
    "endTime": 1706400001234,
    "duration": 1234
  },
  "metadata": {
    "project": "my-project",
    "environment": "production"
  }
}
```

### 5. Manage Webhooks

#### Get All Webhooks

```typescript
const webhooks = webhookService.getAllWebhooks();
console.log(`Total webhooks: ${webhooks.length}`);
```

#### Update Webhook

```typescript
const updated = webhookService.updateWebhook(webhookId, {
  enabled: false,
  events: [WebhookEventType.RENDER_COMPLETE],
  metadata: { environment: 'staging' },
});
```

#### Rotate Secret

```typescript
const webhook = webhookService.rotateSecret(webhookId);
console.log('New secret:', webhook.secret);
```

#### Delete Webhook

```typescript
const deleted = webhookService.deleteWebhook(webhookId);
if (deleted) {
  console.log('Webhook deleted');
}
```

#### Test Webhook

```typescript
const delivery = await webhookService.testWebhook(webhookId);
if (delivery.success) {
  console.log('Test successful!');
} else {
  console.log('Test failed:', delivery.error);
}
```

### 6. Delivery Statistics

```typescript
const stats = webhookService.getDeliveryStats(webhookId);
console.log('Total deliveries:', stats.total);
console.log('Success rate:', stats.successRate, '%');
console.log('Average response time:', stats.avgResponseTime, 'ms');
```

### 7. Delivery History

```typescript
const history = webhookService.getDeliveryHistory(webhookId, 10);
history.forEach(delivery => {
  console.log(`${delivery.timestamp}: ${delivery.success ? 'Success' : delivery.error}`);
  console.log(`  Response time: ${delivery.responseTime}ms`);
  console.log(`  Status code: ${delivery.statusCode}`);
});
```

## Security

### HMAC Signature Verification

Every webhook includes an HMAC-SHA256 signature in the `X-Webhook-Signature` header:

```typescript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Best Practices

1. **Store secrets securely** - Never commit webhook secrets to version control
2. **Always verify signatures** - Reject requests with invalid signatures
3. **Use HTTPS endpoints** - Only register HTTPS webhook URLs in production
4. **Implement idempotency** - Use `jobId` to deduplicate webhook deliveries
5. **Respond quickly** - Return 2xx status within timeout period
6. **Handle retries** - Expect duplicate deliveries on transient failures
7. **Rotate secrets** - Periodically rotate webhook secrets

## Configuration

### Webhook Service Options

```typescript
const webhookService = new WebhookService(
  'data/webhooks', // Storage directory
  {
    maxAttempts: 3,          // Number of retry attempts
    retryDelay: 1000,        // Initial retry delay (ms)
    timeout: 30000,          // Request timeout (ms)
    backoffMultiplier: 2,    // Exponential backoff multiplier
  }
);
```

### Render Queue Integration

```typescript
const queue = createRenderQueueWithWebhooks({
  redis: {
    host: 'localhost',
    port: 6379,
  },
  webhooks: {
    enabled: true,              // Enable webhooks
    storageDir: 'data/webhooks', // Storage location
  },
});
```

## Testing

### Run Test Suite

```bash
# Run all tests
npm run test-webhooks all

# Run specific tests
npm run test-webhooks register
npm run test-webhooks delivery
npm run test-webhooks signature
npm run test-webhooks retry
npm run test-webhooks stats
npm run test-webhooks events
npm run test-webhooks test
```

### Test Output

```
============================================================
  WEBHOOK SERVICE TEST SUITE - ADS-017
============================================================

============================================================
  TEST: Webhook Registration and Management
============================================================
✓ Webhook registered
✓ Webhook retrieved successfully
✓ Webhook updated
✓ Total webhooks: 1

============================================================
  TEST: Webhook Delivery
============================================================
✓ Webhook delivered successfully
✓ Server received 1 webhook(s)

============================================================
  TEST: Signature Verification
============================================================
✓ Valid signature verified correctly
✓ Invalid signature rejected correctly

============================================================
  TEST: Retry Logic
============================================================
✓ Delivery completed after 3 attempts

============================================================
  TEST: Delivery Statistics
============================================================
✓ Delivery Statistics:
  - Total: 5
  - Successful: 5
  - Failed: 0
  - Success Rate: 100%

============================================================
  ALL TESTS PASSED ✓
============================================================
```

## API Reference

### WebhookService

#### `registerWebhook(url, events, metadata?)`
Register a new webhook endpoint.

**Returns**: `WebhookConfig`

#### `getWebhook(webhookId)`
Get webhook configuration by ID.

**Returns**: `WebhookConfig | null`

#### `getAllWebhooks()`
Get all registered webhooks.

**Returns**: `WebhookConfig[]`

#### `getWebhooksForEvent(event)`
Get webhooks subscribed to specific event.

**Returns**: `WebhookConfig[]`

#### `updateWebhook(webhookId, updates)`
Update webhook configuration.

**Returns**: `WebhookConfig | null`

#### `deleteWebhook(webhookId)`
Delete a webhook.

**Returns**: `boolean`

#### `rotateSecret(webhookId)`
Generate new secret for webhook.

**Returns**: `WebhookConfig | null`

#### `sendWebhook(webhook, payload)`
Send webhook with retry logic.

**Returns**: `Promise<WebhookDelivery>`

#### `triggerWebhooks(event, jobId, data, metadata?)`
Trigger all webhooks for an event.

**Returns**: `Promise<WebhookDelivery[]>`

#### `testWebhook(webhookId)`
Send test webhook delivery.

**Returns**: `Promise<WebhookDelivery>`

#### `getDeliveryHistory(webhookId, limit?)`
Get delivery history for webhook.

**Returns**: `WebhookDelivery[]`

#### `getDeliveryStats(webhookId)`
Get delivery statistics.

**Returns**: `{ total, successful, failed, successRate, avgResponseTime }`

#### `verifySignature(payload, signature, secret)`
Verify HMAC signature.

**Returns**: `boolean`

## Integration Examples

### With Ad Editor

```typescript
// In ad editor, after rendering
const job = await queue.addTemplateRenderJob(template);

// Webhook will automatically fire when job completes
// Your endpoint receives notification with results
```

### With Campaign Generator

```typescript
// Generate campaign pack
const job = await queue.addCampaignRenderJob(templates);

// Receive webhook when all renders complete
// Payload includes results for all variants
```

### With Batch Import

```typescript
// Process CSV batch
const job = await queue.addBatchRenderJob(compositionIds);

// Get notified when batch completes
// Can trigger ZIP export or email notification
```

### Notification System

```typescript
// In webhook handler
app.post('/webhooks/render-complete', async (req, res) => {
  const { jobId, data } = req.body;

  // Send email notification
  await sendEmail({
    to: 'user@example.com',
    subject: 'Render Complete',
    body: `Your render job ${jobId} completed successfully!
           Rendered ${data.totalRendered} files in ${data.duration}ms.`,
  });

  // Update database
  await db.jobs.update(jobId, {
    status: 'completed',
    results: data.results,
  });

  res.json({ received: true });
});
```

### Slack Integration

```typescript
app.post('/webhooks/render-complete', async (req, res) => {
  const { event, jobId, data } = req.body;

  const message = event === 'render.complete'
    ? `✅ Render job ${jobId} completed: ${data.totalRendered} files in ${data.duration}ms`
    : `❌ Render job ${jobId} failed: ${data.error}`;

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });

  res.json({ received: true });
});
```

## Performance Considerations

### Retry Strategy

- **Fast failures**: 1s, 2s, 4s (total ~7s)
- **Network issues**: Exponential backoff prevents overwhelming endpoint
- **Configurable**: Adjust attempts and delays per use case

### Delivery Tracking

- **History limit**: Keeps last 1000 deliveries to prevent unbounded growth
- **Storage format**: JSON file (consider Redis for high traffic)
- **Statistics**: Computed on-demand from delivery history

### Scaling

For high-volume scenarios:
- Move storage from JSON file to Redis
- Use message queue (BullMQ) for webhook delivery
- Separate webhook service from render queue
- Implement webhook delivery worker pool

## Troubleshooting

### Webhook Not Firing

**Check**:
1. Is webhook enabled? `webhook.enabled === true`
2. Is event subscribed? `webhook.events.includes(event)`
3. Are render queue events setup? `queue.setupEventListener(...)`
4. Check webhook service logs

### Signature Verification Failed

**Check**:
1. Using correct webhook secret
2. Signature from `X-Webhook-Signature` header
3. Payload is raw JSON string (not parsed object)
4. Using HMAC-SHA256 algorithm

### Deliveries Failing

**Check**:
1. Endpoint returns 2xx status code
2. Endpoint responds within timeout (30s)
3. URL is accessible from server
4. HTTPS certificate is valid
5. Check delivery history for error details

### High Retry Count

**Solutions**:
- Increase timeout if endpoint is slow
- Check endpoint error logs
- Verify network connectivity
- Consider async processing in endpoint

## Future Enhancements

1. **Webhook Dashboard**
   - Web UI for webhook management
   - Real-time delivery monitoring
   - Delivery replay functionality

2. **Advanced Retry**
   - Jitter in backoff delays
   - Different retry strategies per webhook
   - Dead letter queue for failed deliveries

3. **Webhook Templates**
   - Custom payload transformations
   - Conditional triggering
   - Payload filtering

4. **Security Features**
   - IP allowlisting
   - Rate limiting per webhook
   - Webhook authentication tokens

5. **Analytics**
   - Delivery success trends
   - Response time charts
   - Failed delivery alerts

## Dependencies

- **ADS-009**: Render Job Queue (required for event integration)

## Related Features

This feature enables:
- Real-time render notifications
- External system integration
- Automated workflows
- Monitoring and alerting

## Success Metrics

✅ Webhook registration and management complete
✅ HMAC signature generation and verification
✅ HTTP POST delivery with retry logic
✅ Exponential backoff implemented
✅ Delivery tracking and history
✅ Statistics and analytics
✅ Render queue integration
✅ Comprehensive test suite (7/7 tests passing)
✅ Production-ready security
✅ Complete documentation

## Conclusion

ADS-017 provides a robust, secure webhook notification system for render job events. With HMAC signature verification, automatic retry logic, and comprehensive delivery tracking, it enables real-time integration with external systems and automated workflows.
