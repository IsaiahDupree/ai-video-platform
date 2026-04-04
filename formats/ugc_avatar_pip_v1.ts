import { VideoFormat } from './types';

/**
 * UGC Avatar PiP v1
 *
 * HeyGen talking head composited over a top-performing source video.
 * Hook text at top. Karaoke captions at bottom. Retention events every 3s.
 *
 * Layout: source video fills 9:16 background → Isaiah PiP in bottom-right corner
 *         OR split-left (Isaiah left, source right) for authority-style content
 *
 * Proven pattern: creator face on existing viral content = 2-4x engagement vs static
 */
export const ugc_avatar_pip_v1: VideoFormat = {
  id: 'ugc_avatar_pip_v1',
  name: 'UGC Avatar PiP — HeyGen over Source Video',
  description: 'Isaiah avatar (HeyGen) composited over top-performing source video (9:16, 20–45s) — retention event every 3s, hook text bar, karaoke captions',
  default_duration_sec: 30,
  aspect_ratio: '9:16',
  resolution: { width: 1080, height: 1920 },
  scene_sequence: [
    { type: 'avatar_pip', duration_percent: 100, required: true },
  ],
  default_style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#cccccc',
    accent_color: '#6366f1',
    font_heading: 'Montserrat',
    font_body: 'Inter',
    background_type: 'video',
    background_value: '',
  },
};
