import { VideoFormat } from './types';

// Threads Curiosity Gap — "nobody talks about this" pattern drives highest reply rates
export const threads_curiosity_v1: VideoFormat = {
  id: 'threads_curiosity_v1',
  name: 'Threads Curiosity Gap',
  description: 'Threads curiosity-gap reveal (4:5, 25–40s) — delayed reveal drives highest reply rates on Threads',
  default_duration_sec: 30,
  aspect_ratio: '4:5',
  resolution: { width: 1080, height: 1350 },
  scene_sequence: [
    { type: 'curiosity_gap', duration_percent: 67, required: true },
    { type: 'topic',         duration_percent: 23, required: false },
    { type: 'cta',           duration_percent: 10, required: true },
  ],
  default_style: {
    theme: 'threads',
    primary_color: '#f5f5f5',
    secondary_color: '#a8a8a8',
    accent_color: '#ffffff',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'solid',
    background_value: '#101010',
  },
};
