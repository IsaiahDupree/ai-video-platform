import { VideoFormat } from './types';

// YouTube Tutorial — chapter-based deep dive, optimized for 70%+ watch time
export const youtube_tutorial_v1: VideoFormat = {
  id: 'youtube_tutorial_v1',
  name: 'YouTube Tutorial',
  description: 'YouTube chapter-based tutorial (16:9, 3–5min) — lower thirds, code reveals, end screen',
  default_duration_sec: 240,
  aspect_ratio: '16:9',
  resolution: { width: 1920, height: 1080 },
  scene_sequence: [
    { type: 'hook',          duration_percent: 3,  required: true },
    { type: 'lower_third',   duration_percent: 2,  required: false },
    { type: 'chapter_card',  duration_percent: 2,  required: false, max_instances: 4 },
    { type: 'topic',         duration_percent: 40, required: true,  max_instances: 4 },
    { type: 'code',          duration_percent: 20, required: false, max_instances: 4 },
    { type: 'stat',          duration_percent: 8,  required: false, max_instances: 2 },
    { type: 'compare',       duration_percent: 10, required: false },
    { type: 'end_screen',    duration_percent: 8,  required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#a1a1aa',
    accent_color: '#ff0000',
    font_heading: 'Montserrat',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0d0d0d 0%, #111827 100%)',
  },
};
