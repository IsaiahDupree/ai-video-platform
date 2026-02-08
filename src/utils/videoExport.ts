/**
 * Video Output Pipeline - T2V-010
 * Export T2V output to MP4 with proper encoding
 *
 * This utility provides comprehensive video handling functionality:
 * - Save video buffers to disk with proper encoding
 * - Validate video format and metadata
 * - Support multiple output formats (MP4, MOV, WebM)
 * - Extract video metadata (resolution, duration, fps, codec)
 * - Generate video thumbnails
 * - Optimize video encoding settings
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * EXPORT-001: Multi-Format Export (MP4, WebM, GIF)
 * Export rendered videos in multiple formats optimized for different platforms
 * Supported video output formats
 */
export type VideoFormat = 'mp4' | 'mov' | 'webm' | 'avi' | 'gif';

/**
 * Video codec options
 */
export type VideoCodec = 'libx264' | 'libx265' | 'libvpx-vp9' | 'prores';

/**
 * Video quality presets
 */
export type VideoQualityPreset = 'draft' | 'standard' | 'high' | 'max';

/**
 * Video metadata information
 */
export interface VideoMetadata {
  width: number;
  height: number;
  duration: number; // in seconds
  fps: number;
  codec: string;
  bitrate: number; // in kbps
  fileSize: number; // in bytes
  format: string;
}

/**
 * Video export configuration
 */
export interface VideoExportConfig {
  /** Output file path */
  outputPath: string;
  /** Video format (default: mp4) */
  format?: VideoFormat;
  /** Video codec (default: libx264) */
  codec?: VideoCodec;
  /** Quality preset (default: standard) */
  quality?: VideoQualityPreset;
  /** Custom CRF value (0-51, lower is better quality) */
  crf?: number;
  /** Custom bitrate (e.g., "2M", "5000k") */
  bitrate?: string;
  /** Pixel format (default: yuv420p for compatibility) */
  pixelFormat?: string;
  /** Additional ffmpeg output parameters */
  additionalParams?: string[];
  /** Overwrite existing file (default: false) */
  overwrite?: boolean;
}

/**
 * Thumbnail generation configuration
 */
export interface ThumbnailConfig {
  /** Output file path for thumbnail */
  outputPath: string;
  /** Time in seconds to capture thumbnail (default: 0.5) */
  timeSeconds?: number;
  /** Thumbnail width (height auto-calculated) */
  width?: number;
  /** Thumbnail height (width auto-calculated) */
  height?: number;
  /** Thumbnail format (default: jpg) */
  format?: 'jpg' | 'png' | 'webp';
  /** JPEG quality (1-100, default: 85) */
  quality?: number;
}

/**
 * Get quality preset CRF values and encoding speed
 */
function getQualityPreset(preset: VideoQualityPreset): { crf: number; preset: string } {
  switch (preset) {
    case 'draft':
      return { crf: 28, preset: 'ultrafast' };
    case 'standard':
      return { crf: 23, preset: 'medium' };
    case 'high':
      return { crf: 18, preset: 'slow' };
    case 'max':
      return { crf: 15, preset: 'veryslow' };
    default:
      return { crf: 23, preset: 'medium' };
  }
}

/**
 * Get codec-specific parameters
 */
function getCodecParams(codec: VideoCodec, crf: number): string[] {
  switch (codec) {
    case 'libx264':
      return ['-c:v', 'libx264', '-crf', String(crf), '-profile:v', 'high', '-level', '4.2'];
    case 'libx265':
      return ['-c:v', 'libx265', '-crf', String(crf), '-tag:v', 'hvc1'];
    case 'libvpx-vp9':
      return ['-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0'];
    case 'prores':
      return ['-c:v', 'prores_ks', '-profile:v', '3', '-qscale:v', String(Math.floor(crf / 5))];
    default:
      return ['-c:v', 'libx264', '-crf', String(crf)];
  }
}

/**
 * Check if ffmpeg is available
 */
function checkFfmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ensure ffmpeg is available, throw error if not
 */
function ensureFfmpeg(): void {
  if (!checkFfmpeg()) {
    throw new Error(
      'ffmpeg is not installed or not in PATH. Please install ffmpeg to use video export functionality.\n' +
        'Install: https://ffmpeg.org/download.html'
    );
  }
}

/**
 * Save a video buffer to disk with proper encoding
 *
 * @param videoBuffer - Video data as Buffer
 * @param config - Export configuration
 * @returns Promise<string> - Path to saved video file
 *
 * @example
 * ```typescript
 * const videoBuffer = await generateVideo(...);
 * const outputPath = await saveVideo(videoBuffer, {
 *   outputPath: 'output/video.mp4',
 *   quality: 'high',
 *   overwrite: true
 * });
 * console.log(`Video saved: ${outputPath}`);
 * ```
 */
export async function saveVideo(
  videoBuffer: Buffer,
  config: VideoExportConfig
): Promise<string> {
  ensureFfmpeg();

  const {
    outputPath,
    format = 'mp4',
    codec = 'libx264',
    quality = 'standard',
    crf: customCrf,
    bitrate,
    pixelFormat = 'yuv420p',
    additionalParams = [],
    overwrite = false,
  } = config;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Check if file exists and overwrite is false
  if (fs.existsSync(outputPath) && !overwrite) {
    throw new Error(`File already exists: ${outputPath}. Set overwrite: true to replace.`);
  }

  // Get quality preset
  const qualityPreset = getQualityPreset(quality);
  const crf = customCrf !== undefined ? customCrf : qualityPreset.crf;

  // Build ffmpeg command
  const tempInputPath = path.join(outputDir, `.temp_input_${Date.now()}.mp4`);

  try {
    // Write buffer to temporary file
    fs.writeFileSync(tempInputPath, videoBuffer);

    // Build ffmpeg arguments
    const args: string[] = [
      '-i',
      tempInputPath,
      ...getCodecParams(codec, crf),
      '-preset',
      qualityPreset.preset,
      '-pix_fmt',
      pixelFormat,
    ];

    // Add bitrate if specified
    if (bitrate) {
      args.push('-b:v', bitrate);
    }

    // Add audio codec (copy if exists, otherwise no audio)
    args.push('-c:a', 'aac', '-b:a', '128k');

    // Add additional parameters
    args.push(...additionalParams);

    // Add overwrite flag if needed
    if (overwrite) {
      args.push('-y');
    }

    // Add output path
    args.push(outputPath);

    // Execute ffmpeg
    const command = `ffmpeg ${args.join(' ')}`;
    console.log(`Executing: ${command}`);

    const { stdout, stderr } = await execAsync(command);

    // Clean up temp file
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }

    console.log(`Video saved successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    throw new Error(`Failed to save video: ${error}`);
  }
}

/**
 * Save video buffer directly without re-encoding
 * Use this when the video is already in the desired format
 *
 * @param videoBuffer - Video data as Buffer
 * @param outputPath - Path to save the video
 * @param overwrite - Overwrite existing file (default: false)
 * @returns Promise<string> - Path to saved video file
 *
 * @example
 * ```typescript
 * const videoBuffer = await generateVideo(...);
 * const outputPath = await saveVideoRaw(videoBuffer, 'output/video.mp4', true);
 * ```
 */
export async function saveVideoRaw(
  videoBuffer: Buffer,
  outputPath: string,
  overwrite: boolean = false
): Promise<string> {
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Check if file exists
  if (fs.existsSync(outputPath) && !overwrite) {
    throw new Error(`File already exists: ${outputPath}. Set overwrite to true to replace.`);
  }

  // Write buffer to file
  fs.writeFileSync(outputPath, videoBuffer);
  console.log(`Video saved: ${outputPath} (${videoBuffer.length} bytes)`);

  return outputPath;
}

/**
 * Extract video metadata using ffprobe
 *
 * @param videoPath - Path to video file
 * @returns Promise<VideoMetadata> - Video metadata information
 *
 * @example
 * ```typescript
 * const metadata = await getVideoMetadata('output/video.mp4');
 * console.log(`Resolution: ${metadata.width}x${metadata.height}`);
 * console.log(`Duration: ${metadata.duration}s at ${metadata.fps} fps`);
 * ```
 */
export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  ensureFfmpeg();

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  try {
    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);

    // Find video stream
    const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
    if (!videoStream) {
      throw new Error('No video stream found');
    }

    // Parse FPS (handle fraction format like "30/1")
    let fps = 30; // default
    if (videoStream.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
      fps = num / den;
    } else if (videoStream.avg_frame_rate) {
      const [num, den] = videoStream.avg_frame_rate.split('/').map(Number);
      fps = num / den;
    }

    // Parse bitrate (convert to kbps)
    const bitrate = data.format.bit_rate ? Math.round(data.format.bit_rate / 1000) : 0;

    return {
      width: videoStream.width || 0,
      height: videoStream.height || 0,
      duration: parseFloat(data.format.duration) || 0,
      fps,
      codec: videoStream.codec_name || 'unknown',
      bitrate,
      fileSize: parseInt(data.format.size) || 0,
      format: data.format.format_name || 'unknown',
    };
  } catch (error) {
    throw new Error(`Failed to extract video metadata: ${error}`);
  }
}

/**
 * Generate a thumbnail from a video
 *
 * @param videoPath - Path to source video
 * @param config - Thumbnail configuration
 * @returns Promise<string> - Path to generated thumbnail
 *
 * @example
 * ```typescript
 * const thumbnailPath = await generateThumbnail('output/video.mp4', {
 *   outputPath: 'output/thumbnail.jpg',
 *   timeSeconds: 1.0,
 *   width: 640,
 *   quality: 90
 * });
 * ```
 */
export async function generateThumbnail(
  videoPath: string,
  config: ThumbnailConfig
): Promise<string> {
  ensureFfmpeg();

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  const {
    outputPath,
    timeSeconds = 0.5,
    width,
    height,
    format = 'jpg',
    quality = 85,
  } = config;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Build ffmpeg command
    const args: string[] = [
      '-ss',
      String(timeSeconds),
      '-i',
      `"${videoPath}"`,
      '-vframes',
      '1',
    ];

    // Add scaling if specified
    if (width && height) {
      args.push('-vf', `scale=${width}:${height}`);
    } else if (width) {
      args.push('-vf', `scale=${width}:-1`);
    } else if (height) {
      args.push('-vf', `scale=-1:${height}`);
    }

    // Add quality for JPEG
    if (format === 'jpg') {
      args.push('-q:v', String(Math.floor((100 - quality) / 3)));
    }

    // Add output
    args.push('-y', outputPath);

    const command = `ffmpeg ${args.join(' ')}`;
    console.log(`Generating thumbnail: ${command}`);

    await execAsync(command);

    console.log(`Thumbnail generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error}`);
  }
}

/**
 * Validate video file format and integrity
 *
 * @param videoPath - Path to video file
 * @returns Promise<boolean> - True if valid, throws error if invalid
 *
 * @example
 * ```typescript
 * try {
 *   await validateVideo('output/video.mp4');
 *   console.log('Video is valid');
 * } catch (error) {
 *   console.error('Video validation failed:', error);
 * }
 * ```
 */
export async function validateVideo(videoPath: string): Promise<boolean> {
  ensureFfmpeg();

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  try {
    // Try to read video metadata
    const metadata = await getVideoMetadata(videoPath);

    // Basic validation checks
    if (metadata.width <= 0 || metadata.height <= 0) {
      throw new Error('Invalid video dimensions');
    }

    if (metadata.duration <= 0) {
      throw new Error('Invalid video duration');
    }

    if (metadata.fps <= 0 || metadata.fps > 240) {
      throw new Error('Invalid frame rate');
    }

    console.log('Video validation passed');
    return true;
  } catch (error) {
    throw new Error(`Video validation failed: ${error}`);
  }
}

/**
 * Convert video to different format
 *
 * @param inputPath - Path to source video
 * @param outputPath - Path for converted video
 * @param targetFormat - Target video format
 * @param config - Optional export configuration
 * @returns Promise<string> - Path to converted video
 *
 * @example
 * ```typescript
 * const converted = await convertVideo(
 *   'input.mov',
 *   'output.mp4',
 *   'mp4',
 *   { quality: 'high' }
 * );
 * ```
 */
export async function convertVideo(
  inputPath: string,
  outputPath: string,
  targetFormat: VideoFormat,
  config: Partial<VideoExportConfig> = {}
): Promise<string> {
  ensureFfmpeg();

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input video not found: ${inputPath}`);
  }

  // Read input video
  const videoBuffer = fs.readFileSync(inputPath);

  // Save with new format
  return saveVideo(videoBuffer, {
    outputPath,
    format: targetFormat,
    ...config,
  });
}

/**
 * Batch process multiple videos with the same configuration
 *
 * @param videos - Array of { buffer, outputPath } objects
 * @param config - Export configuration to apply to all videos
 * @returns Promise<string[]> - Array of output paths
 *
 * @example
 * ```typescript
 * const results = await batchProcessVideos([
 *   { buffer: video1, outputPath: 'output/video1.mp4' },
 *   { buffer: video2, outputPath: 'output/video2.mp4' }
 * ], { quality: 'high' });
 * ```
 */
export async function batchProcessVideos(
  videos: Array<{ buffer: Buffer; outputPath: string }>,
  config: Partial<VideoExportConfig> = {}
): Promise<string[]> {
  const results: string[] = [];

  for (const { buffer, outputPath } of videos) {
    const result = await saveVideo(buffer, {
      outputPath,
      ...config,
    });
    results.push(result);
  }

  return results;
}

/**
 * Get video file size in human-readable format
 *
 * @param videoPath - Path to video file
 * @returns string - File size (e.g., "5.2 MB")
 */
export function getVideoFileSize(videoPath: string): string {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  const stats = fs.statSync(videoPath);
  const bytes = stats.size;

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Helper function to create export config with common defaults
 */
export function createExportConfig(overrides: Partial<VideoExportConfig>): VideoExportConfig {
  return {
    outputPath: overrides.outputPath || 'output/video.mp4',
    format: overrides.format || 'mp4',
    codec: overrides.codec || 'libx264',
    quality: overrides.quality || 'standard',
    pixelFormat: overrides.pixelFormat || 'yuv420p',
    overwrite: overrides.overwrite !== undefined ? overrides.overwrite : false,
    ...overrides,
  };
}

/**
 * EXPORT-001: Convert video to animated GIF
 * Optimized for web sharing and social media
 *
 * @param inputPath - Path to input video file
 * @param outputPath - Path for output GIF file
 * @param options - Optional GIF generation options
 * @returns Promise<string> - Path to generated GIF
 *
 * @example
 * ```typescript
 * const gifPath = await convertVideoToGif(
 *   'input.mp4',
 *   'output.gif',
 *   { fps: 10, scale: 640 }
 * );
 * ```
 */
export async function convertVideoToGif(
  inputPath: string,
  outputPath: string,
  options: {
    fps?: number; // Frames per second (default: 10)
    scale?: number; // Width in pixels (default: 640)
    quality?: number; // GIF quality 1-100 (default: 75)
    duration?: number; // Max duration in seconds (default: 10)
  } = {}
): Promise<string> {
  ensureFfmpeg();

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input video not found: ${inputPath}`);
  }

  const fps = options.fps || 10;
  const scale = options.scale || 640;
  const quality = Math.min(100, Math.max(1, options.quality || 75));
  const duration = options.duration || 10;

  // FFmpeg command to generate palette and GIF
  const paletteCmd = `ffmpeg -i "${inputPath}" -vf "fps=${fps},scale=${scale}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -t ${duration} "${outputPath}" -y`;

  try {
    await execAsync(paletteCmd, { maxBuffer: 10 * 1024 * 1024 });

    if (!fs.existsSync(outputPath)) {
      throw new Error('GIF generation failed - output file not created');
    }

    return outputPath;
  } catch (error) {
    throw new Error(
      `Failed to convert video to GIF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * EXPORT-001: Export video in optimal format for target platform
 * Automatically selects codec and bitrate based on target platform
 *
 * @param inputPath - Path to input video
 * @param outputPath - Path for output file
 * @param platform - Target platform (youtube, instagram, tiktok, twitter, web)
 * @returns Promise<string> - Path to exported video
 */
export async function exportForPlatform(
  inputPath: string,
  outputPath: string,
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'web'
): Promise<string> {
  const platformConfigs: Record<string, Partial<VideoExportConfig>> = {
    youtube: {
      format: 'mp4',
      codec: 'libx264',
      quality: 'high',
      bitrate: '5M', // 5 Mbps for HD
      pixelFormat: 'yuv420p',
    },
    instagram: {
      format: 'mp4',
      codec: 'libx264',
      quality: 'standard',
      bitrate: '2M', // 2 Mbps
      pixelFormat: 'yuv420p',
    },
    tiktok: {
      format: 'mp4',
      codec: 'libx264',
      quality: 'standard',
      bitrate: '1500k', // 1.5 Mbps for mobile
      pixelFormat: 'yuv420p',
    },
    twitter: {
      format: 'mp4',
      codec: 'libx264',
      quality: 'standard',
      bitrate: '2M',
      pixelFormat: 'yuv420p',
    },
    web: {
      format: 'webm',
      codec: 'libvpx-vp9',
      quality: 'standard',
      bitrate: '1M',
    },
  };

  const config = platformConfigs[platform];
  return convertVideo(inputPath, outputPath, config.format as VideoFormat, config);
}
