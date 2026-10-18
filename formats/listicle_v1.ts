import { VideoFormat } from './types';

export const listicle_v1: VideoFormat = {
  id: 'listicle_v1',
  name: 'Listicle / Top N',
  description: 'Numbered list format (Top 5, 10 Tips, etc.)',
  default_duration_sec: 45,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'intro', duration_percent: 10, required: true },
    { type: 'list_item', duration_percent: 75, required: true, max_instances: 10 },
    { type: 'outro', duration_percent: 15, required: true },
  ],
  default_style: {
    theme: 'neon',
    primary_color: '#00ff88',
    secondary_color: '#00ccff',
    accent_color: '#ff00ff',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a1a1a 100%)',
  },
};
