import { VideoFormat } from './types';

export const tiktok_v1: VideoFormat = {
  id: 'tiktok_v1',
  name: 'TikTok',
  description: 'TikTok-optimized vertical (9:16, 15–60s) — maximum scroll-stopping energy',
  default_duration_sec: 30,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'hook',            duration_percent: 8,  required: true },
    { type: 'kinetic_caption', duration_percent: 74, required: true },
    { type: 'stat',            duration_percent: 8,  required: false },
    { type: 'cta',             duration_percent: 10, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#e5e7eb',
    accent_color: '#fe2c55',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(180deg, #010101 0%, #0d0d1a 100%)',
  },
};
