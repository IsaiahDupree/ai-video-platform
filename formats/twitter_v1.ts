import { VideoFormat } from './types';

export const twitter_v1: VideoFormat = {
  id: 'twitter_v1',
  name: 'Twitter / X',
  description: 'Twitter/X landscape clip (16:9, 30–140s) with quote cards and rapid reveals',
  default_duration_sec: 60,
  aspect_ratio: '16:9',
  resolution: { width: 1280, height: 720 },
  scene_sequence: [
    { type: 'hook',       duration_percent: 8,  required: true },
    { type: 'quote_card', duration_percent: 25, required: false, max_instances: 3 },
    { type: 'stat',       duration_percent: 15, required: false, max_instances: 2 },
    { type: 'topic',      duration_percent: 32, required: true,  max_instances: 3 },
    { type: 'compare',    duration_percent: 10, required: false },
    { type: 'cta',        duration_percent: 10, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#e7e9ea',
    secondary_color: '#71767b',
    accent_color: '#1d9bf0',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'solid',
    background_value: '#000000',
  },
};
