import { VideoFormat } from './types';

// TikTok Problem → Solution — #1 UGC converting pattern, 3-5x conversion lift
export const tiktok_problem_solution_v1: VideoFormat = {
  id: 'tiktok_problem_solution_v1',
  name: 'TikTok Problem/Solution',
  description: 'TikTok Hook→Problem→Solution→CTA (9:16, 20–35s) — #1 UGC converting pattern',
  default_duration_sec: 28,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'hook',             duration_percent: 15, required: true },
    { type: 'problem_solution', duration_percent: 57, required: true },
    { type: 'stat',             duration_percent: 17, required: false },
    { type: 'cta',              duration_percent: 11, required: true },
  ],
  default_style: {
    theme: 'tiktok',
    primary_color: '#ffffff',
    secondary_color: '#aaaaaa',
    accent_color: '#fe2c55',
    font_heading: 'Montserrat',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #150a1a 100%)',
  },
};
