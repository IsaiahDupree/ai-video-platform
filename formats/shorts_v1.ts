import { VideoFormat } from './types';

export const shorts_v1: VideoFormat = {
  id: 'shorts_v1',
  name: 'Short Form',
  description: 'Fast-paced short content (15-60s)',
  default_duration_sec: 30,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'hook', duration_percent: 10, required: true },
    { type: 'content', duration_percent: 80, required: true },
    { type: 'cta', duration_percent: 10, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#e5e5e5',
    accent_color: '#ef4444',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
  },
};
