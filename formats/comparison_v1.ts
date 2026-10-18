import { VideoFormat } from './types';

export const comparison_v1: VideoFormat = {
  id: 'comparison_v1',
  name: 'Comparison Video',
  description: 'Side-by-side comparison format (X vs Y)',
  default_duration_sec: 60,
  aspect_ratio: '16:9',
  resolution: { width: 1920, height: 1080 },
  scene_sequence: [
    { type: 'intro', duration_percent: 10, required: true },
    { type: 'comparison', duration_percent: 75, required: true, max_instances: 5 },
    { type: 'outro', duration_percent: 15, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#a1a1aa',
    accent_color: '#f97316',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'solid',
    background_value: '#0a0a0a',
  },
};
