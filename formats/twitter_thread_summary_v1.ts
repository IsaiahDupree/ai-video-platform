import { VideoFormat } from './types';

// Twitter Thread Summary — drives replies (weighted 75x on algo) + profile visits
export const twitter_thread_summary_v1: VideoFormat = {
  id: 'twitter_thread_summary_v1',
  name: 'Twitter Thread Summary',
  description: 'Twitter thread-summary video (16:9, 45–75s) — sequential reveal drives replies (75x algo weight)',
  default_duration_sec: 60,
  aspect_ratio: '16:9',
  resolution: { width: 1280, height: 720 },
  scene_sequence: [
    { type: 'hook',          duration_percent: 10, required: true },
    { type: 'thread_reveal', duration_percent: 67, required: true },
    { type: 'stat',          duration_percent: 12, required: false },
    { type: 'cta',           duration_percent: 11, required: true },
  ],
  default_style: {
    theme: 'twitter',
    primary_color: '#ffffff',
    secondary_color: '#71767b',
    accent_color: '#1d9bf0',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'solid',
    background_value: '#000000',
  },
};
