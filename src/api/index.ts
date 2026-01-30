/**
 * API Module
 *
 * Exports:
 * - REST API Gateway with auth, rate limiting, webhooks
 * - Job Queue system for async job processing
 * - Growth Data Plane for analytics
 */

export { APIGateway, APIRequest, APIResponse, RouteHandler, GatewayConfig } from './gateway';
export { JobQueue, Job, JobStatus, JobHandler, JobInput, JobResult, QueueConfig } from './job-queue';
export {
  VideoToVideoClient,
  VideoToVideoOptions,
  VideoToVideoResult,
  STYLE_PROMPT_TEMPLATES,
  generateStylePrompt,
  ENHANCEMENT_TYPES,
} from './video-to-video';

// Re-export data types
export {
  Person,
  IdentityLink,
  UnifiedEvent,
  Subscription,
  FunnelStage,
  Cohort,
  GrowthDataPlaneDB,
  InMemoryGrowthDataPlane,
  EventBuilder,
} from '../data/growth-data-plane';

export default APIGateway;
