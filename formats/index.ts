// Format registry
export * from './types';
export { explainer_v1 } from './explainer_v1';
export { listicle_v1 } from './listicle_v1';
export { comparison_v1 } from './comparison_v1';
export { shorts_v1 } from './shorts_v1';
export { devvlog_v1 } from './devvlog_v1';

import { VideoFormat } from './types';
import { explainer_v1 } from './explainer_v1';
import { listicle_v1 } from './listicle_v1';
import { comparison_v1 } from './comparison_v1';
import { shorts_v1 } from './shorts_v1';
import { devvlog_v1 } from './devvlog_v1';

export const FORMATS: Record<string, VideoFormat> = {
  explainer_v1,
  listicle_v1,
  comparison_v1,
  shorts_v1,
  devvlog_v1,
};

export function getFormat(id: string): VideoFormat {
  const format = FORMATS[id];
  if (!format) {
    throw new Error(`Unknown format: ${id}. Available formats: ${Object.keys(FORMATS).join(', ')}`);
  }
  return format;
}

export function listFormats(): VideoFormat[] {
  return Object.values(FORMATS);
}

export function getFormatIds(): string[] {
  return Object.keys(FORMATS);
}
