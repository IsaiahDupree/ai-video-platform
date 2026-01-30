/**
 * Segment Engine Service
 * GDP-012: Segment Engine
 *
 * Service for managing segments, evaluating membership, and triggering automations
 */

import { supabaseAdmin } from './supabase';
import {
  Segment,
  CreateSegmentInput,
  UpdateSegmentInput,
  SegmentMembership,
  SegmentAutomation,
  CreateSegmentAutomationInput,
  UpdateSegmentAutomationInput,
  AutomationExecution,
  CreateAutomationExecutionInput,
  Rule,
  SegmentEvaluationResult,
  BulkSegmentEvaluationResult,
} from '../types/segmentEngine';

/**
 * SEGMENT MANAGEMENT
 */

export async function createSegment(input: CreateSegmentInput): Promise<Segment> {
  const { data, error } = await supabaseAdmin
    .from('segment')
    .insert({
      name: input.name,
      description: input.description,
      rule: input.rule,
      is_active: input.is_active ?? true,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating segment: ${error.message}`);
  }

  return data;
}

export async function getSegment(id: string): Promise<Segment | null> {
  const { data, error } = await supabaseAdmin
    .from('segment')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching segment: ${error.message}`);
  }

  return data || null;
}

export async function getSegmentByName(name: string): Promise<Segment | null> {
  const { data, error } = await supabaseAdmin
    .from('segment')
    .select('*')
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching segment: ${error.message}`);
  }

  return data || null;
}

export async function listSegments(isActive?: boolean): Promise<Segment[]> {
  let query = supabaseAdmin.from('segment').select('*');

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  const { data, error } = await query.order('name');

  if (error) {
    throw new Error(`Error listing segments: ${error.message}`);
  }

  return data || [];
}

export async function updateSegment(
  id: string,
  input: UpdateSegmentInput
): Promise<Segment> {
  const updates: any = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.rule !== undefined) updates.rule = input.rule;
  if (input.is_active !== undefined) updates.is_active = input.is_active;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('segment')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating segment: ${error.message}`);
  }

  return data;
}

export async function deleteSegment(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('segment').delete().eq('id', id);

  if (error) {
    throw new Error(`Error deleting segment: ${error.message}`);
  }
}

/**
 * SEGMENT MEMBERSHIP
 */

export async function getSegmentMembers(
  segmentId: string,
  includeExited: boolean = false
): Promise<SegmentMembership[]> {
  let query = supabaseAdmin
    .from('segment_membership')
    .select('*')
    .eq('segment_id', segmentId);

  if (!includeExited) {
    query = query.eq('is_member', true);
  }

  const { data, error } = await query.order('entered_at', {
    ascending: false,
  });

  if (error) {
    throw new Error(
      `Error fetching segment members: ${error.message}`
    );
  }

  return data || [];
}

export async function getPersonSegments(personId: string): Promise<Segment[]> {
  const { data, error } = await supabaseAdmin
    .from('segment_membership')
    .select('segment:segment_id(id, name, description, rule, is_active)')
    .eq('person_id', personId)
    .eq('is_member', true);

  if (error) {
    throw new Error(
      `Error fetching person segments: ${error.message}`
    );
  }

  return data?.map((m: any) => m.segment).filter(Boolean) || [];
}

export async function getSegmentMembership(
  personId: string,
  segmentId: string
): Promise<SegmentMembership | null> {
  const { data, error } = await supabaseAdmin
    .from('segment_membership')
    .select('*')
    .eq('person_id', personId)
    .eq('segment_id', segmentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching membership: ${error.message}`);
  }

  return data || null;
}

/**
 * SEGMENT EVALUATION
 */

export async function evaluatePersonSegments(
  personId: string
): Promise<BulkSegmentEvaluationResult> {
  // Call the database function to evaluate person against all segments
  const { data, error } = await supabaseAdmin.rpc(
    'evaluate_person_segments',
    {
      p_person_id: personId,
    }
  );

  if (error) {
    throw new Error(`Error evaluating segments: ${error.message}`);
  }

  const evaluations: SegmentEvaluationResult[] = (data || []).map(
    (result: any) => ({
      segment_id: result.segment_id,
      matches: result.matches,
      cached: false,
    })
  );

  return {
    person_id: personId,
    evaluations,
  };
}

export async function evaluateSegmentForPerson(
  personId: string,
  segmentId: string
): Promise<SegmentEvaluationResult> {
  // Check cache first
  const { data: cacheData } = await supabaseAdmin
    .from('segment_evaluation_cache')
    .select('*')
    .eq('person_id', personId)
    .eq('segment_id', segmentId)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cacheData) {
    return {
      segment_id: segmentId,
      matches: cacheData.matches,
      cached: true,
    };
  }

  // Get segment rule
  const segment = await getSegment(segmentId);
  if (!segment) {
    throw new Error(`Segment not found: ${segmentId}`);
  }

  // Evaluate using database function
  const { data: evaluations, error } = await supabaseAdmin.rpc(
    'evaluate_segment_rule',
    {
      p_person_id: personId,
      p_rule: segment.rule,
    }
  );

  if (error) {
    throw new Error(`Error evaluating segment: ${error.message}`);
  }

  const matches = evaluations as boolean;

  // Update cache
  await supabaseAdmin
    .from('segment_evaluation_cache')
    .upsert({
      person_id: personId,
      segment_id: segmentId,
      matches,
      evaluated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    });

  return {
    segment_id: segmentId,
    matches,
    cached: false,
  };
}

/**
 * AUTOMATIONS
 */

export async function createAutomation(
  input: CreateSegmentAutomationInput
): Promise<SegmentAutomation> {
  const { data, error } = await supabaseAdmin
    .from('segment_automation')
    .insert({
      segment_id: input.segment_id,
      name: input.name,
      description: input.description,
      trigger_type: input.trigger_type,
      action: input.action,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating automation: ${error.message}`);
  }

  return data;
}

export async function getAutomation(id: string): Promise<SegmentAutomation | null> {
  const { data, error } = await supabaseAdmin
    .from('segment_automation')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching automation: ${error.message}`);
  }

  return data || null;
}

export async function listAutomations(
  segmentId?: string,
  isActive?: boolean
): Promise<SegmentAutomation[]> {
  let query = supabaseAdmin.from('segment_automation').select('*');

  if (segmentId) {
    query = query.eq('segment_id', segmentId);
  }

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  const { data, error } = await query.order('name');

  if (error) {
    throw new Error(`Error listing automations: ${error.message}`);
  }

  return data || [];
}

export async function updateAutomation(
  id: string,
  input: UpdateSegmentAutomationInput
): Promise<SegmentAutomation> {
  const updates: any = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.trigger_type !== undefined) updates.trigger_type = input.trigger_type;
  if (input.action !== undefined) updates.action = input.action;
  if (input.is_active !== undefined) updates.is_active = input.is_active;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('segment_automation')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating automation: ${error.message}`);
  }

  return data;
}

export async function deleteAutomation(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('segment_automation')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting automation: ${error.message}`);
  }
}

/**
 * AUTOMATION EXECUTION
 */

export async function createAutomationExecution(
  input: CreateAutomationExecutionInput
): Promise<AutomationExecution> {
  const { data, error } = await supabaseAdmin
    .from('automation_execution')
    .insert({
      automation_id: input.automation_id,
      person_id: input.person_id,
      status: input.status ?? 'pending',
      error_message: input.error_message,
      trigger_event_id: input.trigger_event_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Error creating automation execution: ${error.message}`
    );
  }

  return data;
}

export async function getAutomationExecutions(
  automationId: string,
  limit: number = 100
): Promise<AutomationExecution[]> {
  const { data, error } = await supabaseAdmin
    .from('automation_execution')
    .select('*')
    .eq('automation_id', automationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `Error fetching automation executions: ${error.message}`
    );
  }

  return data || [];
}

export async function updateAutomationExecution(
  id: string,
  status: 'pending' | 'sent' | 'failed' | 'skipped',
  errorMessage?: string
): Promise<AutomationExecution> {
  const { data, error } = await supabaseAdmin
    .from('automation_execution')
    .update({
      status,
      error_message: errorMessage || null,
      executed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Error updating automation execution: ${error.message}`
    );
  }

  return data;
}

/**
 * SEGMENT OPERATIONS (Higher-level)
 */

export async function triggerSegmentAutomations(
  personId: string,
  triggerType: 'enter' | 'exit',
  segmentId: string
): Promise<AutomationExecution[]> {
  // Get automations for this segment and trigger type
  const automations = await listAutomations(segmentId);
  const relevantAutomations = automations.filter(
    (a) => a.trigger_type === triggerType && a.is_active
  );

  const executions: AutomationExecution[] = [];

  for (const automation of relevantAutomations) {
    try {
      const execution = await createAutomationExecution({
        automation_id: automation.id,
        person_id: personId,
        status: 'pending',
      });
      executions.push(execution);

      // For now, just mark as sent (in production, would actually execute action)
      await updateAutomationExecution(execution.id, 'sent');
    } catch (err) {
      console.error(
        `Error triggering automation ${automation.id}:`,
        err
      );
    }
  }

  return executions;
}

export async function clearSegmentCache(
  personId?: string,
  segmentId?: string
): Promise<void> {
  let query = supabaseAdmin.from('segment_evaluation_cache').delete();

  if (personId) {
    query = query.eq('person_id', personId);
  }

  if (segmentId) {
    query = query.eq('segment_id', segmentId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Error clearing cache: ${error.message}`);
  }
}

/**
 * BULK OPERATIONS
 */

export async function evaluateAllPeopleForSegment(
  segmentId: string,
  batchSize: number = 100
): Promise<{ evaluated: number; error: number }> {
  // Get all people
  const { data: people, error: peopleError } = await supabaseAdmin
    .from('person')
    .select('id')
    .limit(1000); // Adjust as needed

  if (peopleError) {
    throw new Error(`Error fetching people: ${peopleError.message}`);
  }

  let evaluated = 0;
  let evalError = 0;

  // Evaluate in batches
  for (let i = 0; i < (people?.length || 0); i += batchSize) {
    const batch = people!.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (person) => {
        try {
          await evaluateSegmentForPerson(person.id, segmentId);
          evaluated++;
        } catch (err) {
          console.error(`Error evaluating person ${person.id}:`, err);
          evalError++;
        }
      })
    );
  }

  return { evaluated, error: evalError };
}
