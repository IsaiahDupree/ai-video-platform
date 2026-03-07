import { VideoFormat } from './types';

// LinkedIn Myth/Reality with data chart — contrarian + data = 8-12x comments
export const linkedin_myth_v1: VideoFormat = {
  id: 'linkedin_myth_v1',
  name: 'LinkedIn Myth/Reality',
  description: 'LinkedIn contrarian data take (1:1, 45–60s) — myth bust + bar chart drives 8-12x comments',
  default_duration_sec: 50,
  aspect_ratio: '1:1',
  resolution: { width: 1080, height: 1080 },
  scene_sequence: [
    { type: 'hook',         duration_percent: 10, required: true },
    { type: 'myth_reality', duration_percent: 44, required: true },
    { type: 'bar_chart',    duration_percent: 28, required: false },
    { type: 'cta',          duration_percent: 18, required: true },
  ],
  default_style: {
    theme: 'light',
    primary_color: '#1a1a2e',
    secondary_color: '#4a5568',
    accent_color: '#0077b5',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'solid',
    background_value: '#f8f9fa',
  },
};
