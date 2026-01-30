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
