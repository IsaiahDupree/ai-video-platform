// retention-agent core types
// See docs/profit-os/research/youtube-video-agent-research.md for the schema this is based on
// and /Users/isaiahdupree/Documents/Software/acd/data/prds/youtube-retention-video-agent.md for scope.

export interface SectionShapeEntry {
  id: string;
  purpose: string;
  retention_device: string;
  percent: number;
  flexible: boolean;
}

export interface PatternInterrupts {
  minimum_spacing_seconds: number;
  maximum_spacing_seconds: number;
  allowed: string[];
}

export interface Pacing {
  preferred_interval_seconds: [number, number];
  maximum_unchanged_talking_head_seconds: number;
  maximum_static_image_seconds: number;
  maximum_caption_only_seconds: number;
  pattern_interrupts: PatternInterrupts;
}

export interface VoiceConfig {
  provider: string;
  voice_id: string;
  model_id: string;
  stability: number;
  similarity_boost: number;
  speech_rate_wpm: number;
}

export interface StyleSkill {
  id: string;
  version: number;
  format: string;
  description: string;
  voice: VoiceConfig;
  pacing: Pacing;
  captions: { enabled: boolean; emphasize_keywords: boolean };
  visual_language: string[];
  prohibited: string[];
  section_shape: SectionShapeEntry[];
}

/** Retention-tagged script section — this is what separates a script from a transcript
 * (research doc "Retention starts in the script"). */
export interface RetentionSection {
  scene_id: string;
  purpose: string;
  spoken_text: string;
  visual_promise: string;
  retention_device: string;
  open_loop: string;
  energy: number; // 0-1
  target_seconds: number;
  flexible: boolean;
  // filled in once synthesized:
  audio_path?: string;
  actual_seconds?: number;
  attempts?: number;
}

export interface ScriptDraft {
  topic: string;
  target_duration_seconds: number;
  tolerance_seconds: number;
  style_skill_id: string;
  sections: RetentionSection[];
  created_at: string;
  converged: boolean;
  total_actual_seconds?: number;
  iterations_log: IterationLogEntry[];
}

export interface IterationLogEntry {
  pass: number;
  section_id: string;
  action: 'draft' | 'expand' | 'compress' | 'accept';
  target_seconds: number;
  actual_seconds?: number;
  word_count?: number;
}

/** One entry of the applied visual-change / B-roll ruleset — logged with the reasoning
 * that produced it (research doc "don't blindly cut every 2s" + pattern-interrupt rules). */
export interface VisualEvent {
  section_id: string;
  start_time_sec: number;
  duration_sec: number;
  scene_type: string;
  reason: string;
  is_pattern_interrupt: boolean;
  content: Record<string, unknown>;
}

export interface EditPlan {
  topic: string;
  total_duration_sec: number;
  events: VisualEvent[];
  pattern_interrupt_count: number;
  max_unchanged_seconds_observed: number;
}

export interface QCFinding {
  severity: 'block' | 'warn';
  rule: string;
  section_id?: string;
  detail: string;
}

export interface QCGateResult {
  gate: string;
  pass: boolean;
  findings: QCFinding[];
  checked_at: string;
}
