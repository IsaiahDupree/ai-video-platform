import { VideoFormat } from './types';

export const youtube_explainer_v2: VideoFormat = {
  id: 'youtube_explainer_v2',
  name: 'YouTube Explainer v2',
  description: 'Long-form YouTube with chapters, lower thirds, stats, and end screen (16:9)',
  default_duration_sec: 180,
  aspect_ratio: '16:9',
  resolution: { width: 1920, height: 1080 },
  scene_sequence: [
    { type: 'hook',         duration_percent: 5,  required: true },
    { type: 'intro',        duration_percent: 5,  required: true },
    { type: 'chapter_card', duration_percent: 4,  required: false, max_instances: 6 },
    { type: 'topic',        duration_percent: 55, required: true,  max_instances: 6 },
    { type: 'stat',         duration_percent: 8,  required: false, max_instances: 3 },
    { type: 'code',         duration_percent: 8,  required: false, max_instances: 2 },
    { type: 'compare',      duration_percent: 8,  required: false, max_instances: 2 },
    { type: 'end_screen',   duration_percent: 7,  required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#a1a1aa',
    accent_color: '#ff0000',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)',
  },
};
