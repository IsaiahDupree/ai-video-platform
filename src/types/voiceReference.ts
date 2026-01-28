/**
 * Voice Reference Types - VC-005
 * Type definitions for voice reference metadata
 */

/**
 * Voice reference metadata
 *
 * Each voice reference includes audio files and metadata about
 * the voice characteristics, source, and usage information.
 */
export interface VoiceReference {
  /** Unique identifier for this voice reference */
  id: string;

  /** Display name for the voice */
  name: string;

  /** Description of the voice characteristics */
  description?: string;

  /** Voice category (e.g., "male", "female", "child", "neutral") */
  category: 'male' | 'female' | 'child' | 'neutral' | 'custom';

  /** Voice characteristics */
  characteristics?: {
    /** Age range (e.g., "young", "middle-aged", "senior") */
    age?: 'young' | 'middle-aged' | 'senior';
    /** Accent (e.g., "american", "british", "australian") */
    accent?: string;
    /** Tone (e.g., "professional", "casual", "energetic", "calm") */
    tone?: string[];
    /** Pitch (e.g., "low", "medium", "high") */
    pitch?: 'low' | 'medium' | 'high';
  };

  /** Source information */
  source: {
    /** How the reference was generated (e.g., "elevenlabs", "recorded", "synthetic") */
    type: 'elevenlabs' | 'recorded' | 'synthetic' | 'cloned' | 'other';
    /** Original ElevenLabs voice ID if applicable */
    elevenLabsVoiceId?: string;
    /** Source description or attribution */
    attribution?: string;
  };

  /** Audio files for this voice reference */
  audioFiles: VoiceAudioFile[];

  /** Tags for organization and search */
  tags?: string[];

  /** When this reference was created */
  createdAt: string;

  /** Last time this reference was updated */
  updatedAt: string;

  /** Usage statistics */
  stats?: {
    /** Number of times this voice has been used */
    timesUsed?: number;
    /** Last time this voice was used */
    lastUsedAt?: string;
  };
}

/**
 * Audio file reference
 */
export interface VoiceAudioFile {
  /** File path relative to voices directory */
  path: string;

  /** Audio format (e.g., "mp3", "wav", "ogg") */
  format: 'mp3' | 'wav' | 'ogg' | 'flac';

  /** Duration in seconds */
  duration?: number;

  /** Sample rate in Hz */
  sampleRate?: number;

  /** File size in bytes */
  size?: number;

  /** Text that was used to generate this audio */
  text?: string;

  /** Purpose of this file (e.g., "primary", "variation", "sample") */
  purpose?: 'primary' | 'variation' | 'sample' | 'test';
}

/**
 * Voice library - collection of voice references
 */
export interface VoiceLibrary {
  /** Library metadata */
  metadata: {
    version: string;
    lastUpdated: string;
    totalVoices: number;
  };

  /** All voice references in the library */
  voices: Record<string, VoiceReference>;
}

/**
 * Voice search criteria
 */
export interface VoiceSearchCriteria {
  /** Search by name or description */
  query?: string;

  /** Filter by category */
  category?: VoiceReference['category'];

  /** Filter by source type */
  sourceType?: VoiceReference['source']['type'];

  /** Filter by tags */
  tags?: string[];

  /** Filter by characteristics */
  characteristics?: {
    age?: 'young' | 'middle-aged' | 'senior';
    accent?: string;
    pitch?: 'low' | 'medium' | 'high';
  };
}
