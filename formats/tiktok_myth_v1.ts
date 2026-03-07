import { VideoFormat } from './types';

// TikTok Myth → Reality — pattern interrupt + authority builder
export const tiktok_myth_v1: VideoFormat = {
  id: 'tiktok_myth_v1',
  name: 'TikTok Myth/Reality',
  description: 'TikTok myth bust (9:16, 20–30s) — pattern interrupt drives 3-5x saves',
  default_duration_sec: 25,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'hook',         duration_percent: 12, required: true },
    { type: 'myth_reality', duration_percent: 64, required: true },
    { type: 'checklist',    duration_percent: 16, required: false },
    { type: 'cta',          duration_percent: 8,  required: true },
  ],
  default_style: {
    theme: 'tiktok',
    primary_color: '#ffffff',
    secondary_color: '#aaaaaa',
    accent_color: '#fe2c55',
    font_heading: 'Montserrat',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #0a0f1a 100%)',
  },
};
