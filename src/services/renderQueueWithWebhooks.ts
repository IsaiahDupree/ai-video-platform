/**
 * Render Queue with Webhooks Integration
 *
 * Extends the render queue to automatically trigger webhooks
 * on render job completion events.
 */

import { RenderQueue, type QueueConfig } from './renderQueue';
import { getWebhookService, WebhookEventType } from './webhooks';

/**
 * Extended queue configuration with webhook options
 */
export interface QueueConfigWithWebhooks extends QueueConfig {
  webhooks?: {
    enabled?: boolean;
    storageDir?: string;
  };
}

/**
 * Setup webhooks for render queue events
 *
 * This function extends an existing RenderQueue to automatically
 * trigger webhooks when render jobs complete or fail.
 */
export function setupRenderQueueWebhooks(
  queue: RenderQueue,
  config?: QueueConfigWithWebhooks
): void {
  const webhookEnabled = config?.webhooks?.enabled !== false;

  if (!webhookEnabled) {
    console.log('Webhooks disabled');
    return;
  }

  const webhookService = getWebhookService(config?.webhooks?.storageDir);

  // Setup event listeners for render queue
  queue.setupEventListener(
    // On completed
    async (jobId, result) => {
      try {
        console.log(`[Webhook] Triggering webhooks for completed job: ${jobId}`);

        const event = result.success
          ? WebhookEventType.RENDER_COMPLETE
          : WebhookEventType.RENDER_FAILED;

        const deliveries = await webhookService.triggerWebhooks(
          event,
          jobId,
          result
        );

        if (deliveries.length > 0) {
          const successful = deliveries.filter((d) => d.success).length;
          console.log(
            `[Webhook] Sent ${deliveries.length} webhooks for job ${jobId} (${successful} successful)`
          );
        }
      } catch (error) {
        console.error(`[Webhook] Error triggering webhooks for job ${jobId}:`, error);
      }
    },
    // On failed
    async (jobId, error) => {
      try {
        console.log(`[Webhook] Triggering webhooks for failed job: ${jobId}`);

        const deliveries = await webhookService.triggerWebhooks(
          WebhookEventType.RENDER_FAILED,
          jobId,
          {
            success: false,
            error: error.message,
            timestamp: Date.now(),
          }
        );

        if (deliveries.length > 0) {
          const successful = deliveries.filter((d) => d.success).length;
          console.log(
            `[Webhook] Sent ${deliveries.length} webhooks for failed job ${jobId} (${successful} successful)`
          );
        }
      } catch (err) {
        console.error(`[Webhook] Error triggering webhooks for failed job ${jobId}:`, err);
      }
    }
  );

  console.log('Render queue webhooks enabled');
}

/**
 * Create a render queue with webhook support
 */
export function createRenderQueueWithWebhooks(
  config?: QueueConfigWithWebhooks
): RenderQueue {
  const queue = new RenderQueue(config);
  setupRenderQueueWebhooks(queue, config);
  return queue;
}
