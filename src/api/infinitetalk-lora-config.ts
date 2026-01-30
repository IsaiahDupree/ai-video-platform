// =============================================================================
// InfiniteTalk LoRA Configuration
// Speed LoRA and quality optimization profiles
// =============================================================================

/**
 * Quality profile with LoRA support for InfiniteTalk
 */
export interface InfiniteTalkProfile {
  name: string;
  description: string;
  sampleSteps: number;      // Inference steps (lower = faster)
  sampleShift: number;      // Sampling shift parameter
  useLoRA: boolean;         // Use FusioniX Speed LoRA
  loraScale: number;        // LoRA scaling factor (0.0-1.0)
  maxDurationSec: number;   // Max video duration in seconds
  estimatedVRAM: number;    // Estimated VRAM usage in GB
  estimatedSpeedMultiplier: number; // Relative speed vs reference
}

/**
 * Available InfiniteTalk quality profiles
 */
export const INFINITETALK_PROFILES: Record<string, InfiniteTalkProfile> = {
  // Ultra-fast with LoRA
  fast_lora: {
    name: 'Fast with LoRA',
    description: 'Ultra-fast generation with FusioniX Speed LoRA for improved quality',
    sampleSteps: 8,
    sampleShift: 2,
    useLoRA: true,
    loraScale: 0.85,
    maxDurationSec: 10,
    estimatedVRAM: 45,
    estimatedSpeedMultiplier: 1.2,
  },

  // Standard quality profile
  balanced: {
    name: 'Balanced',
    description: 'Good quality with reasonable generation time',
    sampleSteps: 20,
    sampleShift: 3,
    useLoRA: false,
    loraScale: 0,
    maxDurationSec: 15,
    estimatedVRAM: 55,
    estimatedSpeedMultiplier: 1.0,
  },

  // High quality (no LoRA)
  quality: {
    name: 'High Quality',
    description: 'Highest quality output, longest generation time',
    sampleSteps: 40,
    sampleShift: 7,
    useLoRA: false,
    loraScale: 0,
    maxDurationSec: 20,
    estimatedVRAM: 70,
    estimatedSpeedMultiplier: 0.5,
  },

  // Draft mode
  draft: {
    name: 'Draft',
    description: 'Very fast preview generation',
    sampleSteps: 4,
    sampleShift: 1,
    useLoRA: false,
    loraScale: 0,
    maxDurationSec: 5,
    estimatedVRAM: 35,
    estimatedSpeedMultiplier: 2.5,
  },
};

/**
 * LoRA configuration for FusioniX Speed LoRA
 */
export interface LoRAConfig {
  enabled: boolean;
  scale: number;           // LoRA strength (0.0-1.0)
  path?: string;          // Path to LoRA weights (optional, defaults to HF hub)
  huggingFaceId: string;  // HuggingFace model ID
  loraAlpha: number;      // LoRA alpha parameter
  loraRank: number;       // LoRA rank parameter
}

/**
 * Default FusioniX LoRA configuration
 */
export const DEFAULT_LORA_CONFIG: LoRAConfig = {
  enabled: false,
  scale: 0.85,
  huggingFaceId: 'MeiGen-AI/InfiniteTalk-FusioniX-LoRA',
  loraAlpha: 16,
  loraRank: 32,
};

/**
 * Get profile by name
 */
export function getProfile(profileName: string): InfiniteTalkProfile {
  const profile = INFINITETALK_PROFILES[profileName];
  if (!profile) {
    console.warn(`Unknown profile: ${profileName}, using balanced`);
    return INFINITETALK_PROFILES.balanced;
  }
  return profile;
}

/**
 * Get recommended profile based on constraints
 */
export function getRecommendedProfile(options: {
  maxDuration?: number;
  prioritizeSpeed?: boolean;
  priorityQuality?: boolean;
  availableVRAM?: number;
}): string {
  const {
    maxDuration = 15,
    prioritizeSpeed = false,
    priorityQuality = false,
    availableVRAM = 80,
  } = options;

  // Priority: Quality
  if (priorityQuality) {
    if (maxDuration <= 20 && availableVRAM >= 70) {
      return 'quality';
    }
    return 'balanced';
  }

  // Priority: Speed
  if (prioritizeSpeed) {
    if (maxDuration <= 10 && availableVRAM >= 45) {
      return 'fast_lora'; // Use LoRA for better quality at same speed
    }
    return 'draft';
  }

  // Default: Balanced based on duration
  if (maxDuration <= 5) {
    return 'draft';
  }
  if (maxDuration <= 10) {
    return 'fast_lora';
  }
  if (maxDuration <= 20) {
    return 'balanced';
  }
  return 'quality';
}

/**
 * Build inference command arguments for InfiniteTalk with LoRA
 */
export function buildInferenceCmdArgs(profile: InfiniteTalkProfile, extraArgs?: string[]): string[] {
  const args = [
    `--sample_steps=${profile.sampleSteps}`,
    `--sample_shift=${profile.sampleShift}`,
    '--num_persistent_param_in_dit=0',
  ];

  if (profile.useLoRA) {
    args.push(`--use_lora=true`);
    args.push(`--lora_scale=${profile.loraScale}`);
    args.push(`--lora_path=${DEFAULT_LORA_CONFIG.huggingFaceId}`);
  }

  if (extraArgs) {
    args.push(...extraArgs);
  }

  return args;
}

/**
 * Estimate generation time based on profile
 */
export function estimateGenerationTime(
  videoDurationSec: number,
  profile: InfiniteTalkProfile
): number {
  // Base time for 5 seconds at 20 steps: ~30 seconds on A100
  const baseTimePerSec = 30 / 5; // 6 seconds per video second at 20 steps
  const stepsRatio = profile.sampleSteps / 20; // Normalize to 20 steps
  const speedMultiplier = profile.estimatedSpeedMultiplier;

  const estimatedSeconds = (baseTimePerSec * videoDurationSec * stepsRatio) / speedMultiplier;
  return Math.round(estimatedSeconds);
}
