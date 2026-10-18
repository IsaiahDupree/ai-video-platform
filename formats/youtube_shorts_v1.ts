import { VideoFormat } from './types';

export const youtube_shorts_v1: VideoFormat = {
  id: 'youtube_shorts_v1',
  name: 'YouTube Shorts',
  description: 'Vertical short-form YouTube (9:16, 15–60s) with hook, kinetic captions, and CTA',
  default_duration_sec: 45,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'hook',            duration_percent: 8,  required: true },
    { type: 'kinetic_caption', duration_percent: 72, required: true },
    { type: 'stat',            duration_percent: 10, required: false },
    { type: 'cta',             duration_percent: 10, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#e5e7eb',
    accent_color: '#ff0000',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(180deg, #0a0a0a 0%, #111827 60%, #0a0a0a 100%)',
  },
};
