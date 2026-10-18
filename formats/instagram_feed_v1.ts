import { VideoFormat } from './types';

export const instagram_feed_v1: VideoFormat = {
  id: 'instagram_feed_v1',
  name: 'Instagram Feed',
  description: 'Square Instagram feed video (1:1, 30–60s) — authority/testimonial style',
  default_duration_sec: 45,
  aspect_ratio: '1:1',
  resolution: { width: 1080, height: 1080 },
  scene_sequence: [
    { type: 'hook',        duration_percent: 12, required: true },
    { type: 'stat',        duration_percent: 20, required: false, max_instances: 2 },
    { type: 'topic',       duration_percent: 40, required: true,  max_instances: 2 },
    { type: 'testimonial', duration_percent: 18, required: false },
    { type: 'cta',         duration_percent: 10, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#d1d5db',
    accent_color: '#e1306c',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0f0f0f 0%, #1a0a1a 100%)',
  },
};
