/**
 * Voice Clone API Client - VC-003
 * TypeScript client for calling Modal voice clone endpoint
 *
 * This service provides a type-safe interface to the Modal voice cloning API.
 * It handles audio encoding/decoding and error handling.
 */

import fs from 'fs';
import path from 'path';

/**
 * Configuration for voice cloning requests
 */
export interface VoiceCloneConfig {
  /** Text to synthesize */
  text: string;
  /** Path to reference audio file or URL */
  referenceAudio: string | Buffer;
  /** Name for the cloned voice (used for caching) */
  speakerName?: string;
  /** Speech speed multiplier (0.5-2.0) */
  speed?: number;
  /** Sampling temperature (0.1-1.0) */
  temperature?: number;
}

/**
 * Response from voice clone API
 */
export interface VoiceCloneResponse {
  /** Base64-encoded audio data */
  audio: string;
  /** Audio format (e.g., "wav") */
  format: string;
  /** Sample rate in Hz */
  sample_rate: number;
}

/**
 * Error response from API
 */
export interface VoiceCloneError {
  error: string;
  details?: string;
}

/**
 * Voice Clone API Client
 *
 * Communicates with the Modal voice cloning service to generate
 * speech using cloned voices.
 */
export class VoiceCloneClient {
  private apiUrl: string;
  private timeout: number;

  /**
   * Create a new voice clone client
   *
   * @param apiUrl - Modal web endpoint URL (from MODAL_VOICE_CLONE_URL env var)
   * @param timeout - Request timeout in milliseconds (default: 60000)
   */
  constructor(apiUrl?: string, timeout: number = 60000) {
    this.apiUrl = apiUrl || process.env.MODAL_VOICE_CLONE_URL || '';
    this.timeout = timeout;

    if (!this.apiUrl) {
      throw new Error(
        'Modal voice clone URL not configured. Set MODAL_VOICE_CLONE_URL environment variable.'
      );
    }
  }

  /**
   * Clone a voice and generate speech
   *
   * @param config - Voice cloning configuration
   * @returns Audio data as Buffer
   * @throws Error if the API request fails
   */
  async cloneVoice(config: VoiceCloneConfig): Promise<Buffer> {
    try {
      // Prepare reference audio
      let referenceAudioBase64: string;

      if (Buffer.isBuffer(config.referenceAudio)) {
        // Already a buffer, encode to base64
        referenceAudioBase64 = config.referenceAudio.toString('base64');
      } else if (config.referenceAudio.startsWith('http://') || config.referenceAudio.startsWith('https://')) {
        // It's a URL - let the API fetch it
        return this.cloneVoiceFromUrl(config);
      } else {
        // It's a file path - read and encode
        const audioBuffer = fs.readFileSync(config.referenceAudio);
        referenceAudioBase64 = audioBuffer.toString('base64');
      }

      // Prepare request body
      const requestBody = {
        text: config.text,
        reference_audio_base64: referenceAudioBase64,
        speaker_name: config.speakerName || 'default',
        speed: config.speed || 1.0,
        temperature: config.temperature || 0.7,
      };

      // Make API request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Voice clone API error (${response.status}): ${
              (errorData as VoiceCloneError).error || response.statusText
            }`
          );
        }

        const data: VoiceCloneResponse = await response.json();

        // Decode base64 audio to buffer
        const audioBuffer = Buffer.from(data.audio, 'base64');

        return audioBuffer;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Voice clone request timed out after ${this.timeout}ms`);
        }
        throw new Error(`Failed to clone voice: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Clone voice using reference audio from URL
   *
   * @param config - Voice cloning configuration with URL
   * @returns Audio data as Buffer
   */
  private async cloneVoiceFromUrl(config: VoiceCloneConfig): Promise<Buffer> {
    if (typeof config.referenceAudio !== 'string') {
      throw new Error('Reference audio must be a URL string');
    }

    const requestBody = {
      text: config.text,
      reference_audio_url: config.referenceAudio,
      speaker_name: config.speakerName || 'default',
      speed: config.speed || 1.0,
      temperature: config.temperature || 0.7,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Voice clone API error (${response.status}): ${
            (errorData as VoiceCloneError).error || response.statusText
          }`
        );
      }

      const data: VoiceCloneResponse = await response.json();
      const audioBuffer = Buffer.from(data.audio, 'base64');

      return audioBuffer;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Clone voice and save to file
   *
   * @param config - Voice cloning configuration
   * @param outputPath - Path to save the generated audio
   * @returns Path to the saved audio file
   */
  async cloneVoiceToFile(config: VoiceCloneConfig, outputPath: string): Promise<string> {
    const audioBuffer = await this.cloneVoice(config);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write audio to file
    fs.writeFileSync(outputPath, audioBuffer);

    return outputPath;
  }

  /**
   * Batch clone multiple texts using the same reference voice
   *
   * @param texts - Array of texts to synthesize
   * @param referenceAudio - Path to reference audio file, URL, or Buffer
   * @param speakerName - Name for the cloned voice
   * @param outputDir - Directory to save output files
   * @returns Array of output file paths
   */
  async batchClone(
    texts: string[],
    referenceAudio: string | Buffer,
    speakerName: string = 'default',
    outputDir?: string
  ): Promise<Buffer[] | string[]> {
    const results: Buffer[] = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      console.log(`Cloning voice ${i + 1}/${texts.length}: "${text.substring(0, 50)}..."`);

      const audioBuffer = await this.cloneVoice({
        text,
        referenceAudio,
        speakerName,
      });

      results.push(audioBuffer);
    }

    // If output directory provided, save files
    if (outputDir) {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePaths: string[] = [];
      for (let i = 0; i < results.length; i++) {
        const outputPath = path.join(outputDir, `${speakerName}_${i + 1}.wav`);
        fs.writeFileSync(outputPath, results[i]);
        filePaths.push(outputPath);
      }

      return filePaths;
    }

    return results;
  }
}

/**
 * Create a voice clone client with default configuration
 *
 * @returns VoiceCloneClient instance
 */
export function createVoiceCloneClient(): VoiceCloneClient {
  return new VoiceCloneClient();
}

/**
 * Quick helper to clone a voice and save to file
 *
 * @param text - Text to synthesize
 * @param referenceAudioPath - Path to reference audio
 * @param outputPath - Path to save output
 * @param options - Additional options
 */
export async function cloneVoice(
  text: string,
  referenceAudioPath: string,
  outputPath: string,
  options: {
    speakerName?: string;
    speed?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const client = createVoiceCloneClient();
  return client.cloneVoiceToFile(
    {
      text,
      referenceAudio: referenceAudioPath,
      ...options,
    },
    outputPath
  );
}
