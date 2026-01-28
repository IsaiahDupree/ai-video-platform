/**
 * Voice Reference Management Service - VC-005
 * Store and organize voice reference files with metadata
 *
 * This service manages the voice reference library, including:
 * - Creating and updating voice references
 * - Searching and filtering voices
 * - Managing metadata and audio files
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  VoiceReference,
  VoiceLibrary,
  VoiceSearchCriteria,
  VoiceAudioFile,
} from '../types/voiceReference';

/**
 * Voice Reference Manager
 *
 * Manages a library of voice references with metadata
 */
export class VoiceReferenceManager {
  private voicesDir: string;
  private libraryPath: string;
  private library: VoiceLibrary;

  /**
   * Create a new voice reference manager
   *
   * @param voicesDir - Directory for voice references (default: public/assets/voices)
   */
  constructor(voicesDir?: string) {
    this.voicesDir = voicesDir || path.join(process.cwd(), 'public', 'assets', 'voices');
    this.libraryPath = path.join(this.voicesDir, 'library.json');

    // Ensure voices directory exists
    if (!fs.existsSync(this.voicesDir)) {
      fs.mkdirSync(this.voicesDir, { recursive: true });
    }

    // Load or create library
    this.library = this.loadLibrary();
  }

  /**
   * Load the voice library from disk
   */
  private loadLibrary(): VoiceLibrary {
    if (fs.existsSync(this.libraryPath)) {
      try {
        const data = fs.readFileSync(this.libraryPath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.error('Error loading voice library:', error);
      }
    }

    // Create new library
    return {
      metadata: {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalVoices: 0,
      },
      voices: {},
    };
  }

  /**
   * Save the voice library to disk
   */
  private saveLibrary(): void {
    this.library.metadata.lastUpdated = new Date().toISOString();
    this.library.metadata.totalVoices = Object.keys(this.library.voices).length;

    fs.writeFileSync(this.libraryPath, JSON.stringify(this.library, null, 2));
  }

  /**
   * Create a new voice reference
   *
   * @param reference - Voice reference metadata
   * @returns The created voice reference
   */
  createVoiceReference(reference: Omit<VoiceReference, 'createdAt' | 'updatedAt'>): VoiceReference {
    const now = new Date().toISOString();

    const fullReference: VoiceReference = {
      ...reference,
      createdAt: now,
      updatedAt: now,
    };

    // Create voice-specific directory
    const voiceDir = path.join(this.voicesDir, reference.id);
    if (!fs.existsSync(voiceDir)) {
      fs.mkdirSync(voiceDir, { recursive: true });
    }

    // Add to library
    this.library.voices[reference.id] = fullReference;
    this.saveLibrary();

    return fullReference;
  }

  /**
   * Get a voice reference by ID
   *
   * @param id - Voice reference ID
   * @returns The voice reference or undefined
   */
  getVoiceReference(id: string): VoiceReference | undefined {
    return this.library.voices[id];
  }

  /**
   * Update a voice reference
   *
   * @param id - Voice reference ID
   * @param updates - Partial updates to apply
   * @returns Updated voice reference
   */
  updateVoiceReference(id: string, updates: Partial<VoiceReference>): VoiceReference {
    const existing = this.library.voices[id];
    if (!existing) {
      throw new Error(`Voice reference not found: ${id}`);
    }

    const updated: VoiceReference = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    this.library.voices[id] = updated;
    this.saveLibrary();

    return updated;
  }

  /**
   * Delete a voice reference
   *
   * @param id - Voice reference ID
   * @param deleteFiles - Whether to delete audio files (default: false)
   */
  deleteVoiceReference(id: string, deleteFiles: boolean = false): void {
    const reference = this.library.voices[id];
    if (!reference) {
      throw new Error(`Voice reference not found: ${id}`);
    }

    // Delete from library
    delete this.library.voices[id];
    this.saveLibrary();

    // Optionally delete files
    if (deleteFiles) {
      const voiceDir = path.join(this.voicesDir, id);
      if (fs.existsSync(voiceDir)) {
        fs.rmSync(voiceDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * List all voice references
   *
   * @returns Array of all voice references
   */
  listVoiceReferences(): VoiceReference[] {
    return Object.values(this.library.voices);
  }

  /**
   * Search voice references
   *
   * @param criteria - Search criteria
   * @returns Array of matching voice references
   */
  searchVoiceReferences(criteria: VoiceSearchCriteria): VoiceReference[] {
    let results = this.listVoiceReferences();

    // Filter by query (name or description)
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (criteria.category) {
      results = results.filter((v) => v.category === criteria.category);
    }

    // Filter by source type
    if (criteria.sourceType) {
      results = results.filter((v) => v.source.type === criteria.sourceType);
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter((v) =>
        criteria.tags!.some((tag) => v.tags?.includes(tag))
      );
    }

    // Filter by characteristics
    if (criteria.characteristics) {
      if (criteria.characteristics.age) {
        results = results.filter((v) => v.characteristics?.age === criteria.characteristics!.age);
      }
      if (criteria.characteristics.accent) {
        results = results.filter(
          (v) => v.characteristics?.accent === criteria.characteristics!.accent
        );
      }
      if (criteria.characteristics.pitch) {
        results = results.filter(
          (v) => v.characteristics?.pitch === criteria.characteristics!.pitch
        );
      }
    }

    return results;
  }

  /**
   * Add audio file to a voice reference
   *
   * @param voiceId - Voice reference ID
   * @param audioFile - Audio file metadata
   * @returns Updated voice reference
   */
  addAudioFile(voiceId: string, audioFile: VoiceAudioFile): VoiceReference {
    const reference = this.getVoiceReference(voiceId);
    if (!reference) {
      throw new Error(`Voice reference not found: ${voiceId}`);
    }

    const audioFiles = [...reference.audioFiles, audioFile];

    return this.updateVoiceReference(voiceId, { audioFiles });
  }

  /**
   * Remove audio file from a voice reference
   *
   * @param voiceId - Voice reference ID
   * @param filePath - Path to the audio file to remove
   * @param deleteFile - Whether to delete the file from disk
   * @returns Updated voice reference
   */
  removeAudioFile(
    voiceId: string,
    filePath: string,
    deleteFile: boolean = false
  ): VoiceReference {
    const reference = this.getVoiceReference(voiceId);
    if (!reference) {
      throw new Error(`Voice reference not found: ${voiceId}`);
    }

    const audioFiles = reference.audioFiles.filter((f) => f.path !== filePath);

    if (deleteFile) {
      const fullPath = path.join(this.voicesDir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    return this.updateVoiceReference(voiceId, { audioFiles });
  }

  /**
   * Increment usage statistics for a voice
   *
   * @param voiceId - Voice reference ID
   */
  recordUsage(voiceId: string): void {
    const reference = this.getVoiceReference(voiceId);
    if (!reference) {
      throw new Error(`Voice reference not found: ${voiceId}`);
    }

    const stats = {
      timesUsed: (reference.stats?.timesUsed || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    };

    this.updateVoiceReference(voiceId, { stats });
  }

  /**
   * Get the absolute path to a voice's directory
   *
   * @param voiceId - Voice reference ID
   * @returns Absolute path to voice directory
   */
  getVoiceDirectory(voiceId: string): string {
    return path.join(this.voicesDir, voiceId);
  }

  /**
   * Export library to JSON
   *
   * @returns Voice library as JSON string
   */
  exportLibrary(): string {
    return JSON.stringify(this.library, null, 2);
  }

  /**
   * Import library from JSON
   *
   * @param json - Library JSON string
   * @param merge - Whether to merge with existing library (default: false)
   */
  importLibrary(json: string, merge: boolean = false): void {
    const imported: VoiceLibrary = JSON.parse(json);

    if (merge) {
      // Merge with existing library
      this.library.voices = {
        ...this.library.voices,
        ...imported.voices,
      };
    } else {
      // Replace library
      this.library = imported;
    }

    this.saveLibrary();
  }
}

/**
 * Create a voice reference manager instance
 *
 * @param voicesDir - Optional custom voices directory
 * @returns VoiceReferenceManager instance
 */
export function createVoiceReferenceManager(voicesDir?: string): VoiceReferenceManager {
  return new VoiceReferenceManager(voicesDir);
}
