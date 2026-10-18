import { VideoFormat } from './types';

// Threads Opinion — hot takes with nuance, 141.5M DAU engagement driver
export const threads_opinion_v1: VideoFormat = {
  id: 'threads_opinion_v1',
  name: 'Threads Opinion',
  description: 'Threads hot-take opinion (4:5, 30–45s) — myth bust + checklist drives discussion on 141.5M DAU platform',
  default_duration_sec: 35,
  aspect_ratio: '4:5',
  resolution: { width: 1080, height: 1350 },
  scene_sequence: [
    { type: 'hook',         duration_percent: 14, required: true },
    { type: 'myth_reality', duration_percent: 51, required: true },
    { type: 'checklist',    duration_percent: 23, required: false },
    { type: 'cta',          duration_percent: 12, required: true },
  ],
  default_style: {
    theme: 'threads',
    primary_color: '#f5f5f5',
    secondary_color: '#a8a8a8',
    accent_color: '#ffffff',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'solid',
    background_value: '#101010',
  },
};
