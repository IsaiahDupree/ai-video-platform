/**
 * Segment Engine Types
 * GDP-012: Segment Engine
 *
 * Types for audience segmentation and automation
 */

// Segment rule DSL (Domain Specific Language)

export type RuleType = 'and' | 'or' | 'condition';

export interface BaseRule {
  type: RuleType;
}

export interface AndRule extends BaseRule {
  type: 'and';
  conditions: Rule[];
}

export interface OrRule extends BaseRule {
  type: 'or';
  conditions: Rule[];
}

export type ConditionAttribute =
  | 'total_events'
  | 'active_days'
  | 'total_renders'
  | 'pricing_page_views'
  | 'email'
  | 'country'
  | 'event'
  | 'subscription_status'
  | 'custom_property';

export type ComparisonOperator =
  | '>'
  | '>='
  | '<'
  | '<='
  | '='
  | '!='
  | 'contains'
  | 'starts_with'
  | 'in';

export interface ConditionRule extends BaseRule {
  type: 'condition';
  attribute: ConditionAttribute;
  operator: ComparisonOperator;
  value: unknown; // Can be number, string, string[], etc.
}

export interface EventConditionRule extends BaseRule {
  type: 'condition';
  attribute: 'event';
  operator: '>' | '=' | 'in';
  event_name?: string;
  event_type?: string;
  days?: number; // Look back window in days (default 30)
  value: number; // Number of events
}

export type Rule = AndRule | OrRule | ConditionRule | EventConditionRule;

// Segment definition
export interface Segment {
  id: string;
  name: string;
  description?: string;
  rule: Rule;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSegmentInput {
  name: string;
  description?: string;
  rule: Rule;
  is_active?: boolean;
  created_by?: string;
}

export interface UpdateSegmentInput {
  name?: string;
  description?: string;
  rule?: Rule;
  is_active?: boolean;
}

// Segment membership
export interface SegmentMembership {
  id: string;
  person_id: string;
  segment_id: string;
  is_member: boolean;
  entered_at: string;
  exited_at?: string;
  last_evaluated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSegmentMembershipInput {
  person_id: string;
  segment_id: string;
  is_member?: boolean;
}

// Automation triggers
export type AutomationTriggerType = 'enter' | 'exit' | 'periodic';

export interface SegmentAutomation {
  id: string;
  segment_id: string;
  name: string;
  description?: string;
  trigger_type: AutomationTriggerType;
  action: AutomationAction;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSegmentAutomationInput {
  segment_id: string;
  name: string;
  description?: string;
  trigger_type: AutomationTriggerType;
  action: AutomationAction;
  is_active?: boolean;
}

export interface UpdateSegmentAutomationInput {
  name?: string;
  description?: string;
  trigger_type?: AutomationTriggerType;
  action?: AutomationAction;
  is_active?: boolean;
}

// Automation action types
export type AutomationActionType = 'email' | 'event' | 'webhook' | 'update_person';

export interface BaseAutomationAction {
  type: AutomationActionType;
  properties?: Record<string, unknown>;
}

export interface EmailAutoAction extends BaseAutomationAction {
  type: 'email';
  template_id: string;
  subject?: string;
  variables?: Record<string, unknown>;
}

export interface EventAutoAction extends BaseAutomationAction {
  type: 'event';
  event_name: string;
  event_type?: string;
  event_source?: string;
  properties?: Record<string, unknown>;
}

export interface WebhookAutoAction extends BaseAutomationAction {
  type: 'webhook';
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload?: Record<string, unknown>;
}

export interface UpdatePersonAutoAction extends BaseAutomationAction {
  type: 'update_person';
  fields: Record<string, unknown>;
}

export type AutomationAction =
  | EmailAutoAction
  | EventAutoAction
  | WebhookAutoAction
  | UpdatePersonAutoAction;

// Automation execution log
export interface AutomationExecution {
  id: string;
  automation_id: string;
  person_id: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  error_message?: string;
  trigger_event_id?: string;
  executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAutomationExecutionInput {
  automation_id: string;
  person_id: string;
  status?: 'pending' | 'sent' | 'failed' | 'skipped';
  error_message?: string;
  trigger_event_id?: string;
}

// Segment evaluation cache
export interface SegmentEvaluationCache {
  id: string;
  person_id: string;
  segment_id: string;
  matches: boolean;
  evaluated_at: string;
  expires_at: string;
  created_at: string;
}

// Segment evaluation result
export interface SegmentEvaluationResult {
  segment_id: string;
  matches: boolean;
  cached: boolean;
}

// Bulk evaluation result
export interface BulkSegmentEvaluationResult {
  person_id: string;
  evaluations: SegmentEvaluationResult[];
}

// Example segment definitions
export const EXAMPLE_SEGMENTS = {
  HIGH_ENGAGERS: {
    name: 'High Engagers',
    description: 'Users who have rendered 5+ videos',
    rule: {
      type: 'condition' as const,
      attribute: 'total_renders' as const,
      operator: '>=' as const,
      value: 5,
    } as ConditionRule,
  },

  ACTIVE_USERS: {
    name: 'Active Users',
    description: 'Users active in the last 7 days with 10+ events',
    rule: {
      type: 'and' as const,
      conditions: [
        {
          type: 'condition' as const,
          attribute: 'total_events' as const,
          operator: '>=' as const,
          value: 10,
        } as ConditionRule,
        {
          type: 'condition' as const,
          attribute: 'event' as const,
          operator: '>' as const,
          event_name: undefined,
          days: 7,
          value: 0,
        } as EventConditionRule,
      ],
    } as AndRule,
  },

  PRICING_VIEWERS: {
    name: 'Pricing Viewers',
    description: 'Users who have viewed the pricing page',
    rule: {
      type: 'condition' as const,
      attribute: 'pricing_page_views' as const,
      operator: '>' as const,
      value: 0,
    } as ConditionRule,
  },

  US_BASED: {
    name: 'US Based Users',
    description: 'Users located in the United States',
    rule: {
      type: 'condition' as const,
      attribute: 'country' as const,
      operator: '=' as const,
      value: 'US',
    } as ConditionRule,
  },
};
