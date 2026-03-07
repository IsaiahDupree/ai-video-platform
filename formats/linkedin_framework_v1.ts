import { VideoFormat } from './types';

// LinkedIn Framework/Checklist — authority-building, drives 5-7x saves vs generic posts
export const linkedin_framework_v1: VideoFormat = {
  id: 'linkedin_framework_v1',
  name: 'LinkedIn Framework/Checklist',
  description: 'LinkedIn step-by-step framework (1:1, 45–65s) — authority content drives 5-7x saves',
  default_duration_sec: 55,
  aspect_ratio: '1:1',
  resolution: { width: 1080, height: 1080 },
  scene_sequence: [
    { type: 'hook',         duration_percent: 9,  required: true },
    { type: 'checklist',    duration_percent: 63, required: true },
    { type: 'social_proof', duration_percent: 15, required: false },
    { type: 'cta',          duration_percent: 13, required: true },
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
