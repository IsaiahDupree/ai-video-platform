/**
 * MusicBed — Background music with speech-aware sidechain ducking.
 */

import React, { useMemo } from 'react';
import { Audio, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import type { MusicBedConfig, EdlEntry } from '../../types/LongformSchema';
import { sidechain, type SpeechSegment } from '../../lib/sidechain';

export interface MusicBedProps {
  config: MusicBedConfig;
  edl: EdlEntry[];
}

export const MusicBed: React.FC<MusicBedProps> = ({ config, edl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Derive speech segments from EDL entries (any entry with speaker audio)
  const speechSegments: SpeechSegment[] = useMemo(() => {
    return edl
      .filter((e) =>
        e.editMode === 'speaker_only' ||
        e.editMode === 'speaker_plus_text' ||
        e.editMode === 'speaker_over_broll'
      )
      .map((e) => ({
        startFrame: e.startFrame,
        endFrame: e.endFrame,
      }));
  }, [edl]);

  const volume = config.duckDuringSpeech
    ? sidechain(frame, speechSegments, {
        fullLevel: config.volume,
        duckLevel: config.duckVolume,
      })
    : config.volume;

  const src = config.trackUrl.startsWith('http') || config.trackUrl.startsWith('/')
    ? config.trackUrl
    : staticFile(config.trackUrl);

  return (
    <Audio
      src={src}
      volume={volume}
      startFrom={0}
      loop
    />
  );
};
