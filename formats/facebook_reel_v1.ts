import { VideoFormat } from './types';

// Facebook Reel — social proof + transformation storytelling, 2-3x reach boost
export const facebook_reel_v1: VideoFormat = {
  id: 'facebook_reel_v1',
  name: 'Facebook Reel',
  description: 'Facebook social-proof reel (9:16, 25–35s) — transformation + numbers drives 2-3x organic reach',
  default_duration_sec: 30,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'hook',             duration_percent: 13, required: true },
    { type: 'problem_solution', duration_percent: 40, required: true },
    { type: 'social_proof',     duration_percent: 27, required: false },
    { type: 'cta',              duration_percent: 20, required: true },
  ],
  default_style: {
    theme: 'facebook',
    primary_color: '#ffffff',
    secondary_color: '#cccccc',
    accent_color: '#1877f2',
    font_heading: 'Montserrat',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a14 0%, #0a1428 100%)',
  },
};
