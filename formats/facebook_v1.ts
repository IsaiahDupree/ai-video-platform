import { VideoFormat } from './types';

export const facebook_v1: VideoFormat = {
  id: 'facebook_v1',
  name: 'Facebook',
  description: 'Facebook feed video (1:1, 30–60s) — warm, social proof, clear value prop',
  default_duration_sec: 45,
  aspect_ratio: '1:1',
  resolution: { width: 1080, height: 1080 },
  scene_sequence: [
    { type: 'hook',        duration_percent: 10, required: true },
    { type: 'topic',       duration_percent: 40, required: true,  max_instances: 2 },
    { type: 'stat',        duration_percent: 12, required: false },
    { type: 'testimonial', duration_percent: 20, required: false, max_instances: 2 },
    { type: 'cta',         duration_percent: 18, required: true },
  ],
  default_style: {
    theme: 'light',
    primary_color: '#1c1e21',
    secondary_color: '#65676b',
    accent_color: '#1877f2',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'solid',
    background_value: '#ffffff',
  },
};
