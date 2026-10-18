import { VideoFormat } from './types';

export const devvlog_v1: VideoFormat = {
  id: 'devvlog_v1',
  name: 'GitHub Dev Vlog',
  description: 'Coding speed builds, project walkthroughs, and dev updates',
  resolution: { width: 1080, height: 1920 },
  default_duration_sec: 75,
  aspect_ratio: '9:16',
  scene_sequence: [
    { type: 'intro', duration_percent: 7, required: true },
    { type: 'topic', duration_percent: 16, required: true },
    { type: 'code', duration_percent: 24, required: true, max_instances: 3 },
    { type: 'code', duration_percent: 24, required: false },
    { type: 'topic', duration_percent: 20, required: true },
    { type: 'outro', duration_percent: 9, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#a1a1aa',
    accent_color: '#22c55e',
    font_heading: 'JetBrains Mono',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
  },
};
