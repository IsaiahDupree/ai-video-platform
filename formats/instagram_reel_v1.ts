import { VideoFormat } from './types';

export const instagram_reel_v1: VideoFormat = {
  id: 'instagram_reel_v1',
  name: 'Instagram Reel',
  description: 'Vertical Instagram Reel (9:16, 15–90s) with aesthetic hook, kinetic captions, CTA',
  default_duration_sec: 30,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'hook',            duration_percent: 10, required: true },
    { type: 'kinetic_caption', duration_percent: 65, required: true },
    { type: 'stat',            duration_percent: 10, required: false },
    { type: 'testimonial',     duration_percent: 5,  required: false },
    { type: 'cta',             duration_percent: 10, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#e5e7eb',
    accent_color: '#e1306c',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 40%, #0a0a1a 100%)',
  },
};
