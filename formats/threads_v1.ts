import { VideoFormat } from './types';

export const threads_v1: VideoFormat = {
  id: 'threads_v1',
  name: 'Threads',
  description: 'Threads portrait video (4:5, 30–60s) — conversational, text-forward opinions',
  default_duration_sec: 40,
  aspect_ratio: '4:5',
  resolution: { width: 1080, height: 1350 },
  scene_sequence: [
    { type: 'hook',       duration_percent: 12, required: true },
    { type: 'topic',      duration_percent: 50, required: true,  max_instances: 3 },
    { type: 'quote_card', duration_percent: 20, required: false, max_instances: 2 },
    { type: 'stat',       duration_percent: 8,  required: false },
    { type: 'cta',        duration_percent: 10, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#f5f5f5',
    secondary_color: '#a8a8a8',
    accent_color: '#ffffff',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'solid',
    background_value: '#101010',
  },
};
