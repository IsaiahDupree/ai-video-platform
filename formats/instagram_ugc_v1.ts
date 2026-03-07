import { VideoFormat } from './types';

// Instagram UGC-style Reel — raw/authentic format converts 3-5x over polished
export const instagram_ugc_v1: VideoFormat = {
  id: 'instagram_ugc_v1',
  name: 'Instagram UGC Style Reel',
  description: 'Instagram UGC-style reel (9:16, 15–30s) — raw/authentic converts 3-5x over polished ads',
  default_duration_sec: 20,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'ugc_style',        duration_percent: 25, required: true },
    { type: 'problem_solution', duration_percent: 50, required: true },
    { type: 'cta',              duration_percent: 25, required: true },
  ],
  default_style: {
    theme: 'instagram',
    primary_color: '#ffffff',
    secondary_color: '#cccccc',
    accent_color: '#e1306c',
    font_heading: 'Montserrat',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(180deg, #1a0a14 0%, #0a0a0a 100%)',
  },
};
