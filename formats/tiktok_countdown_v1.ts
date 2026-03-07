import { VideoFormat } from './types';

// TikTok 3-2-1 countdown hook — proven 65%+ 3-second retention
export const tiktok_countdown_v1: VideoFormat = {
  id: 'tiktok_countdown_v1',
  name: 'TikTok Countdown Hook',
  description: 'TikTok 3-2-1 countdown hook (9:16, 25–35s) — proven 65%+ 3-second retention',
  default_duration_sec: 30,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'countdown',       duration_percent: 18, required: true },
    { type: 'hook',            duration_percent: 24, required: true,  max_instances: 3 },
    { type: 'kinetic_caption', duration_percent: 45, required: false },
    { type: 'cta',             duration_percent: 13, required: true },
  ],
  default_style: {
    theme: 'tiktok',
    primary_color: '#ffffff',
    secondary_color: '#aaaaaa',
    accent_color: '#fe2c55',
    font_heading: 'Montserrat',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)',
  },
};
