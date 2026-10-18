import { VideoFormat } from './types';

export const linkedin_v1: VideoFormat = {
  id: 'linkedin_v1',
  name: 'LinkedIn',
  description: 'LinkedIn authority video (1:1, 45–60s) — clean, data-forward, always-on captions',
  default_duration_sec: 55,
  aspect_ratio: '1:1',
  resolution: { width: 1080, height: 1080 },
  scene_sequence: [
    { type: 'hook',        duration_percent: 10, required: true },
    { type: 'stat',        duration_percent: 18, required: true,  max_instances: 2 },
    { type: 'topic',       duration_percent: 35, required: true,  max_instances: 3 },
    { type: 'compare',     duration_percent: 12, required: false },
    { type: 'testimonial', duration_percent: 15, required: false },
    { type: 'cta',         duration_percent: 10, required: true },
  ],
  default_style: {
    theme: 'light',
    primary_color: '#0a0a0a',
    secondary_color: '#374151',
    accent_color: '#0077b5',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #f8fafc 0%, #e8f4fd 100%)',
  },
};
