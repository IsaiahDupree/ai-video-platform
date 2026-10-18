/**
 * ShortsVideo — 9:16 vertical composition for autonomous shorts.
 *
 * Reuses the longform EDL renderers (SpeakerClip + captions + B-roll) and
 * adds the shorts-only layers: hook overlay (first ~1.5s) and SFX cue track.
 * Source video is rendered with objectFit: cover so a 16:9 source center-
 * crops cleanly into the 9:16 canvas in v1; face-tracked viewport offsets
 * are a future enhancement.
 *
 * Contract: ShortsVideoProps from types/ShortsSchema.
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
} from 'remotion';
import type { ShortsVideoProps } from '../../types/ShortsSchema';
import type { EdlEntry } from '../../types/LongformSchema';

import { SpeakerClip } from '../longform/SpeakerClip';
import { BrollClip } from '../longform/BrollClip';
import { RetentionCaptions } from '../longform/RetentionCaptions';
import { MusicBed } from '../longform/MusicBed';
import { SfxLayer } from '../../audio/SfxLayer';
import { HookOverlay } from './HookOverlay';

// ─── Per-Entry Renderer ──────────────────────────────────────────────────────

const EdlEntryRenderer: React.FC<{
  entry: EdlEntry;
  sourceVideo: string;
}> = ({ entry, sourceVideo }) => {
  switch (entry.editMode) {
    case 'broll_cover':
      if (entry.broll) {
        return (
          <BrollClip broll={entry.broll}>
            {entry.captions && entry.captions.words.length > 0 && (
              <RetentionCaptions
                captions={entry.captions}
                retentionRole={entry.retentionRole}
              />
            )}
          </BrollClip>
        );
      }
      // Fall through to speaker if B-roll is missing.
      return (
        <SpeakerClip
          src={sourceVideo}
          startTrim={entry.sourceClip.startTrim}
          endTrim={entry.sourceClip.endTrim}
          zoom={entry.zoom}
        >
          <RetentionCaptions
            captions={entry.captions}
            retentionRole={entry.retentionRole}
          />
        </SpeakerClip>
      );
    case 'speaker_only':
    case 'speaker_plus_text':
    case 'speaker_over_broll':
    default:
      return (
        <SpeakerClip
          src={sourceVideo}
          startTrim={entry.sourceClip.startTrim}
          endTrim={entry.sourceClip.endTrim}
          zoom={entry.zoom}
        >
          {entry.captions && entry.captions.words.length > 0 && (
            <RetentionCaptions
              captions={entry.captions}
              retentionRole={entry.retentionRole}
            />
          )}
        </SpeakerClip>
      );
  }
};

// ─── Source Audio (continuous through jump cuts) ─────────────────────────────

const SourceAudioTrack: React.FC<{
  sourceVideo: string;
  edl: EdlEntry[];
}> = ({ sourceVideo, edl }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {edl.map((entry) => {
        const dur = entry.endFrame - entry.startFrame;
        if (dur <= 0) return null;
        const startFromFrame = Math.round(entry.sourceClip.startTrim * fps);
        return (
          <Sequence
            key={`a-${entry.windowId}`}
            from={entry.startFrame}
            durationInFrames={dur}
          >
            <Audio
              src={
                sourceVideo.startsWith('http') || sourceVideo.startsWith('/')
                  ? sourceVideo
                  : staticFile(sourceVideo)
              }
              startFrom={startFromFrame}
              volume={1}
            />
          </Sequence>
        );
      })}
    </>
  );
};

// ─── Main Composition ────────────────────────────────────────────────────────

export const ShortsVideo: React.FC<ShortsVideoProps> = ({
  sourceVideo,
  edl,
  musicBed,
  sfxEvents,
  sfxManifest,
  hookOverlay,
}) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', width, height }}>
      {/* Continuous source audio track underneath every visual sequence */}
      <Sequence from={0} name="Source Audio">
        <SourceAudioTrack sourceVideo={sourceVideo} edl={edl} />
      </Sequence>

      {/* EDL entries */}
      {edl.map((entry) => {
        const dur = entry.endFrame - entry.startFrame;
        if (dur <= 0) return null;
        return (
          <Sequence
            key={entry.windowId}
            from={entry.startFrame}
            durationInFrames={dur}
            name={`${entry.windowId} [${entry.editMode}]`}
          >
            <EdlEntryRenderer entry={entry} sourceVideo={sourceVideo} />
          </Sequence>
        );
      })}

      {/* Music bed under everything */}
      {musicBed && (
        <Sequence from={0} name="Music Bed">
          <MusicBed config={musicBed} edl={edl} />
        </Sequence>
      )}

      {/* SFX cue track */}
      {sfxEvents && sfxManifest && (
        <Sequence from={0} name="SFX">
          <SfxLayer events={sfxEvents} manifest={sfxManifest} />
        </Sequence>
      )}

      {/* Hook overlay during the first window */}
      {hookOverlay && (
        <Sequence from={0} durationInFrames={hookOverlay.durationFrames} name="Hook">
          <HookOverlay config={hookOverlay} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// ─── Dynamic Duration ────────────────────────────────────────────────────────

export const calculateShortsMetadata = ({ props }: { props: ShortsVideoProps }) => ({
  fps: props.fps,
  durationInFrames: props.totalDurationFrames,
  width: props.resolution.width,
  height: props.resolution.height,
});
