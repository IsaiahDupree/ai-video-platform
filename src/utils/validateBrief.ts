/**
 * VID-010: Brief Validation
 * JSON schema validation for content briefs with helpful error messages
 */

import type {
  ContentBrief,
  VideoSettings,
  VideoStyle,
  Section,
  AudioConfig,
} from '../types/brief';

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a content brief
 */
export function validateBrief(brief: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Basic structure validation
  if (typeof brief !== 'object' || brief === null) {
    return {
      valid: false,
      errors: [{ path: 'root', message: 'Brief must be an object' }],
    };
  }

  // Required top-level fields
  validateRequired(brief, 'version', 'string', errors);
  validateRequired(brief, 'title', 'string', errors);
  validateRequired(brief, 'settings', 'object', errors);
  validateRequired(brief, 'style', 'object', errors);
  validateRequired(brief, 'sections', 'object', errors);

  if (!Array.isArray(brief.sections)) {
    errors.push({
      path: 'sections',
      message: 'sections must be an array',
      value: typeof brief.sections,
    });
  }

  // Validate settings
  if (brief.settings) {
    validateVideoSettings(brief.settings, errors);
  }

  // Validate style
  if (brief.style) {
    validateVideoStyle(brief.style, errors);
  }

  // Validate sections
  if (Array.isArray(brief.sections)) {
    brief.sections.forEach((section: any, index: number) => {
      validateSection(section, index, errors);
    });
  }

  // Validate audio config if present
  if (brief.audio) {
    validateAudioConfig(brief.audio, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate video settings
 */
function validateVideoSettings(settings: any, errors: ValidationError[]): void {
  const path = 'settings';

  // Required fields
  validateRequired(settings, 'width', 'number', errors, path);
  validateRequired(settings, 'height', 'number', errors, path);
  validateRequired(settings, 'fps', 'number', errors, path);

  // Validate ranges
  if (typeof settings.width === 'number') {
    if (settings.width < 1 || settings.width > 7680) {
      errors.push({
        path: `${path}.width`,
        message: 'width must be between 1 and 7680',
        value: settings.width,
      });
    }
  }

  if (typeof settings.height === 'number') {
    if (settings.height < 1 || settings.height > 4320) {
      errors.push({
        path: `${path}.height`,
        message: 'height must be between 1 and 4320',
        value: settings.height,
      });
    }
  }

  if (typeof settings.fps === 'number') {
    if (settings.fps < 1 || settings.fps > 120) {
      errors.push({
        path: `${path}.fps`,
        message: 'fps must be between 1 and 120',
        value: settings.fps,
      });
    }
  }

  // Validate codec if present
  if (settings.codec) {
    const validCodecs = ['h264', 'h265', 'vp8', 'vp9', 'prores'];
    if (!validCodecs.includes(settings.codec)) {
      errors.push({
        path: `${path}.codec`,
        message: `codec must be one of: ${validCodecs.join(', ')}`,
        value: settings.codec,
      });
    }
  }
}

/**
 * Validate video style
 */
function validateVideoStyle(style: any, errors: ValidationError[]): void {
  const path = 'style';

  // Required field: theme
  validateRequired(style, 'theme', 'string', errors, path);

  // Validate theme value
  if (typeof style.theme === 'string') {
    const validThemes = ['light', 'dark', 'custom'];
    if (!validThemes.includes(style.theme)) {
      errors.push({
        path: `${path}.theme`,
        message: `theme must be one of: ${validThemes.join(', ')}`,
        value: style.theme,
      });
    }
  }

  // Validate colors if present
  if (style.colors) {
    validateColors(style.colors, `${path}.colors`, errors);
  }

  // Validate typography if present
  if (style.typography) {
    validateTypography(style.typography, `${path}.typography`, errors);
  }

  // Validate animations if present
  if (style.animations) {
    validateAnimations(style.animations, `${path}.animations`, errors);
  }
}

/**
 * Validate colors object
 */
function validateColors(colors: any, path: string, errors: ValidationError[]): void {
  const colorFields = ['primary', 'secondary', 'background', 'text', 'accent'];

  colorFields.forEach((field) => {
    if (colors[field] && !isValidColor(colors[field])) {
      errors.push({
        path: `${path}.${field}`,
        message: 'must be a valid color (hex, rgb, rgba, or CSS color name)',
        value: colors[field],
      });
    }
  });
}

/**
 * Validate typography object
 */
function validateTypography(
  typography: any,
  path: string,
  errors: ValidationError[]
): void {
  if (typography.headingFont && typeof typography.headingFont !== 'string') {
    errors.push({
      path: `${path}.headingFont`,
      message: 'must be a string',
      value: typography.headingFont,
    });
  }

  if (typography.bodyFont && typeof typography.bodyFont !== 'string') {
    errors.push({
      path: `${path}.bodyFont`,
      message: 'must be a string',
      value: typography.bodyFont,
    });
  }

  if (typography.headingSize && typeof typography.headingSize !== 'number') {
    errors.push({
      path: `${path}.headingSize`,
      message: 'must be a number',
      value: typography.headingSize,
    });
  }

  if (typography.bodySize && typeof typography.bodySize !== 'number') {
    errors.push({
      path: `${path}.bodySize`,
      message: 'must be a number',
      value: typography.bodySize,
    });
  }
}

/**
 * Validate animations object
 */
function validateAnimations(
  animations: any,
  path: string,
  errors: ValidationError[]
): void {
  if (animations.transition) {
    const validTransitions = ['fade', 'slide', 'zoom', 'none'];
    if (!validTransitions.includes(animations.transition)) {
      errors.push({
        path: `${path}.transition`,
        message: `must be one of: ${validTransitions.join(', ')}`,
        value: animations.transition,
      });
    }
  }

  if (animations.duration && typeof animations.duration !== 'number') {
    errors.push({
      path: `${path}.duration`,
      message: 'must be a number',
      value: animations.duration,
    });
  }
}

/**
 * Validate section
 */
function validateSection(section: any, index: number, errors: ValidationError[]): void {
  const path = `sections[${index}]`;

  // Required fields
  validateRequired(section, 'id', 'string', errors, path);
  validateRequired(section, 'type', 'string', errors, path);
  validateRequired(section, 'durationInFrames', 'number', errors, path);

  // Validate type
  if (typeof section.type === 'string') {
    const validTypes = ['topic', 'intro', 'outro', 'transition', 'custom'];
    if (!validTypes.includes(section.type)) {
      errors.push({
        path: `${path}.type`,
        message: `type must be one of: ${validTypes.join(', ')}`,
        value: section.type,
      });
    }
  }

  // Validate durationInFrames
  if (typeof section.durationInFrames === 'number') {
    if (section.durationInFrames < 1) {
      errors.push({
        path: `${path}.durationInFrames`,
        message: 'durationInFrames must be at least 1',
        value: section.durationInFrames,
      });
    }
  }

  // Validate optional fields
  if (section.heading && typeof section.heading !== 'string') {
    errors.push({
      path: `${path}.heading`,
      message: 'heading must be a string',
      value: section.heading,
    });
  }

  if (section.body && typeof section.body !== 'string') {
    errors.push({
      path: `${path}.body`,
      message: 'body must be a string',
      value: section.body,
    });
  }

  if (section.voiceover && typeof section.voiceover !== 'string') {
    errors.push({
      path: `${path}.voiceover`,
      message: 'voiceover must be a string',
      value: section.voiceover,
    });
  }

  // Validate image if present
  if (section.image) {
    if (typeof section.image === 'string') {
      // String is valid
    } else if (typeof section.image === 'object') {
      validateRequired(section.image, 'src', 'string', errors, `${path}.image`);

      if (section.image.fit) {
        const validFits = ['cover', 'contain', 'fill'];
        if (!validFits.includes(section.image.fit)) {
          errors.push({
            path: `${path}.image.fit`,
            message: `fit must be one of: ${validFits.join(', ')}`,
            value: section.image.fit,
          });
        }
      }
    } else {
      errors.push({
        path: `${path}.image`,
        message: 'image must be a string or object',
        value: typeof section.image,
      });
    }
  }
}

/**
 * Validate audio config
 */
function validateAudioConfig(audio: any, errors: ValidationError[]): void {
  const path = 'audio';

  validateRequired(audio, 'voiceProvider', 'string', errors, path);

  if (typeof audio.voiceProvider === 'string') {
    const validProviders = ['openai', 'elevenlabs', 'indexed', 'custom'];
    if (!validProviders.includes(audio.voiceProvider)) {
      errors.push({
        path: `${path}.voiceProvider`,
        message: `voiceProvider must be one of: ${validProviders.join(', ')}`,
        value: audio.voiceProvider,
      });
    }
  }

  if (audio.speed && typeof audio.speed !== 'number') {
    errors.push({
      path: `${path}.speed`,
      message: 'speed must be a number',
      value: audio.speed,
    });
  }

  if (audio.pitch && typeof audio.pitch !== 'number') {
    errors.push({
      path: `${path}.pitch`,
      message: 'pitch must be a number',
      value: audio.pitch,
    });
  }

  if (audio.musicVolume && typeof audio.musicVolume !== 'number') {
    errors.push({
      path: `${path}.musicVolume`,
      message: 'musicVolume must be a number',
      value: audio.musicVolume,
    });
  }
}

/**
 * Helper: Validate required field
 */
function validateRequired(
  obj: any,
  field: string,
  type: string,
  errors: ValidationError[],
  path: string = 'root'
): void {
  if (!(field in obj)) {
    errors.push({
      path: path === 'root' ? field : `${path}.${field}`,
      message: `${field} is required`,
    });
    return;
  }

  if (typeof obj[field] !== type) {
    errors.push({
      path: path === 'root' ? field : `${path}.${field}`,
      message: `${field} must be a ${type}`,
      value: typeof obj[field],
    });
  }
}

/**
 * Helper: Check if string is a valid color
 */
function isValidColor(color: string): boolean {
  // Hex colors
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)) {
    return true;
  }

  // RGB/RGBA
  if (/^rgba?\([\d\s,./]+\)$/.test(color)) {
    return true;
  }

  // HSL/HSLA
  if (/^hsla?\([\d\s%,./]+\)$/.test(color)) {
    return true;
  }

  // CSS color names (simplified check)
  const cssColors = [
    'black',
    'white',
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
    'pink',
    'gray',
    'grey',
    'transparent',
  ];
  if (cssColors.includes(color.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Format validation errors as a readable string
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'No errors';
  }

  return errors
    .map((error, index) => {
      const valueStr = error.value !== undefined ? ` (got: ${error.value})` : '';
      return `${index + 1}. ${error.path}: ${error.message}${valueStr}`;
    })
    .join('\n');
}
