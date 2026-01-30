/**
 * Growth Data Plane Service
 * GDP-001: Supabase Schema Setup
 *
 * This service provides methods to interact with the Growth Data Plane schema:
 * - Person management (find, create, update, merge)
 * - Event tracking (create, query)
 * - Subscription management (create, update)
 * - Identity stitching
 */

import { supabaseAdmin } from './supabase';
import {
  Person,
  IdentityLink,
  Event,
  Subscription,
  CreatePersonInput,
  CreateEventInput,
  CreateSubscriptionInput,
  FindOrCreatePersonParams,
  IdentityType,
} from '../types/growthDataPlane';

/**
 * Person Management
 */

export async function findPersonByIdentity(
  identityType: IdentityType,
  identityValue: string
): Promise<Person | null> {
  const { data: link, error: linkError } = await supabaseAdmin
    .from('identity_link')
    .select('person_id')
    .eq('identity_type', identityType)
    .eq('identity_value', identityValue)
    .single();

  if (linkError || !link) {
    return null;
  }

  const { data: person, error: personError } = await supabaseAdmin
    .from('person')
    .select('*')
    .eq('id', link.person_id)
    .single();

  if (personError) {
    throw new Error(`Error fetching person: ${personError.message}`);
  }

  return person;
}

export async function findOrCreatePerson(
  params: FindOrCreatePersonParams
): Promise<Person> {
  // Use the database function for atomic find-or-create
  const { data, error } = await supabaseAdmin.rpc('find_or_create_person', {
    p_identity_type: params.identity_type,
    p_identity_value: params.identity_value,
    p_source: params.source || null,
    p_email: params.email || null,
    p_user_id: params.user_id || null,
    p_first_name: params.first_name || null,
    p_last_name: params.last_name || null,
  });

  if (error) {
    throw new Error(`Error in find_or_create_person: ${error.message}`);
  }

  // Fetch and return the person record
  const { data: person, error: personError } = await supabaseAdmin
    .from('person')
    .select('*')
    .eq('id', data)
    .single();

  if (personError) {
    throw new Error(`Error fetching person: ${personError.message}`);
  }

  return person;
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const { data, error } = await supabaseAdmin
    .from('person')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating person: ${error.message}`);
  }

  return data;
}

export async function updatePerson(
  personId: string,
  updates: Partial<CreatePersonInput>
): Promise<Person> {
  const { data, error } = await supabaseAdmin
    .from('person')
    .update(updates)
    .eq('id', personId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating person: ${error.message}`);
  }

  return data;
}

export async function mergePersonRecords(
  sourcePersonId: string,
  targetPersonId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('merge_person_records', {
    p_source_person_id: sourcePersonId,
    p_target_person_id: targetPersonId,
  });

  if (error) {
    throw new Error(`Error merging person records: ${error.message}`);
  }

  return data;
}

/**
 * Event Tracking
 */

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data, error } = await supabaseAdmin
    .from('event')
    .insert(input)
    .select()
    .single();

  if (error) {
    // Check for duplicate event_id (deduplication)
    if (error.code === '23505') {
      console.log(`Event deduplicated: ${input.event_id} from ${input.event_source}`);
      // Fetch existing event
      const { data: existing } = await supabaseAdmin
        .from('event')
        .select('*')
        .eq('event_id', input.event_id)
        .eq('event_source', input.event_source)
        .single();
      return existing!;
    }
    throw new Error(`Error creating event: ${error.message}`);
  }

  return data;
}

export async function getPersonEvents(
  personId: string,
  limit = 100
): Promise<Event[]> {
  const { data, error } = await supabaseAdmin
    .from('event')
    .select('*')
    .eq('person_id', personId)
    .order('event_time', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error fetching person events: ${error.message}`);
  }

  return data;
}

export async function getEventsByName(
  eventName: string,
  limit = 100
): Promise<Event[]> {
  const { data, error } = await supabaseAdmin
    .from('event')
    .select('*')
    .eq('event_name', eventName)
    .order('event_time', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error fetching events: ${error.message}`);
  }

  return data;
}

/**
 * Subscription Management
 */

export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<Subscription> {
  const { data, error } = await supabaseAdmin
    .from('subscription')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating subscription: ${error.message}`);
  }

  return data;
}

export async function updateSubscription(
  stripeSubscriptionId: string,
  updates: Partial<CreateSubscriptionInput>
): Promise<Subscription> {
  const { data, error } = await supabaseAdmin
    .from('subscription')
    .update(updates)
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating subscription: ${error.message}`);
  }

  return data;
}

export async function getSubscription(
  subscriptionId: string
): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from('subscription')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No rows found
    return null;
  }

  if (error) {
    throw new Error(`Error fetching subscription: ${error.message}`);
  }

  return data;
}

export async function getPersonSubscriptions(
  personId: string
): Promise<Subscription[]> {
  const { data, error } = await supabaseAdmin
    .from('subscription')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching person subscriptions: ${error.message}`);
  }

  return data;
}

/**
 * Identity Management
 */

export async function addIdentityLink(
  personId: string,
  identityType: IdentityType,
  identityValue: string,
  source?: string
): Promise<IdentityLink> {
  const { data, error } = await supabaseAdmin
    .from('identity_link')
    .insert({
      person_id: personId,
      identity_type: identityType,
      identity_value: identityValue,
      source,
    })
    .select()
    .single();

  if (error) {
    // If identity already exists, update last_seen_at
    if (error.code === '23505') {
      const { data: existing, error: updateError } = await supabaseAdmin
        .from('identity_link')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('identity_type', identityType)
        .eq('identity_value', identityValue)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error updating identity link: ${updateError.message}`);
      }

      return existing;
    }
    throw new Error(`Error creating identity link: ${error.message}`);
  }

  return data;
}

export async function getPersonIdentities(
  personId: string
): Promise<IdentityLink[]> {
  const { data, error } = await supabaseAdmin
    .from('identity_link')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching person identities: ${error.message}`);
  }

  return data;
}

/**
 * Person Features Computation
 */

export async function updatePersonFeatures(personId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('update_person_features', {
    p_person_id: personId,
  });

  if (error) {
    throw new Error(`Error updating person features: ${error.message}`);
  }
}

/**
 * Analytics / Queries
 */

export async function getActivePeople(daysBack = 30): Promise<Person[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data, error } = await supabaseAdmin
    .from('person')
    .select('*')
    .gte('last_seen_at', cutoffDate.toISOString())
    .order('last_seen_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching active people: ${error.message}`);
  }

  return data;
}

export async function getRevenueByPerson(personId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('event')
    .select('revenue_cents')
    .eq('person_id', personId)
    .not('revenue_cents', 'is', null);

  if (error) {
    throw new Error(`Error fetching revenue: ${error.message}`);
  }

  const totalRevenue = data.reduce((sum, event) => sum + (event.revenue_cents || 0), 0);
  return totalRevenue;
}
