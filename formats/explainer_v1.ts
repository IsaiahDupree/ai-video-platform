import { VideoFormat } from './types';

export const explainer_v1: VideoFormat = {
  id: 'explainer_v1',
  name: 'Explainer Video',
  description: 'Educational content with intro, topics, and outro',
  default_duration_sec: 60,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'intro', duration_percent: 15, required: true },
    { type: 'topic', duration_percent: 70, required: true, max_instances: 5 },
    { type: 'outro', duration_percent: 15, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#a1a1aa',
    accent_color: '#3b82f6',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
  },
};
