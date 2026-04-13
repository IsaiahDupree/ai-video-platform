/**
 * LongformVideo — Main composition for the AI longform video pipeline.
 *
 * Reads an EDL (edit decision list) from input props and maps each entry
 * to the appropriate visual component based on edit mode.
 *
 * Features:
 * - Crossfade transitions between speaker and B-roll segments
 * - Gapless playback (no black frames)
 * - Enhanced audio with music bed ducking
 */

import React from 'react';
import {
  Sequence,
  useVideoConfig,
  useCurrentFrame,
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
} from 'remotion';
import type {
  LongformVideoProps,
  EdlEntry,
} from '../../types/LongformSchema';

import { SpeakerClip } from './SpeakerClip';
import { BrollClip } from './BrollClip';
import { SpeakerOverBroll } from './SpeakerOverBroll';
import { RetentionCaptions } from './RetentionCaptions';
import { MusicBed } from './MusicBed';

// ─── Transition Constants ────────────────────────────────────────────────────

const CROSSFADE_FRAMES = 8; // frames of overlap for crossfade transitions

// ─── Transition Wrapper ──────────────────────────────────────────────────────

const TransitionWrapper: React.FC<{
  entry: EdlEntry;
  nextEntry: EdlEntry | null;
  prevEntry: EdlEntry | null;
  children: React.ReactNode;
}> = ({ entry, nextEntry, prevEntry, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const entryDuration = entry.endFrame - entry.startFrame;

  // Determine if we need transitions
  const needsFadeIn = prevEntry && (
    entry.transitionIn === 'dissolve_fast' ||
    entry.transitionIn === 'dissolve_slow' ||
    entry.transitionIn === 'crossfade' ||
    // Also fade when switching between speaker and B-roll
    (prevEntry.editMode !== entry.editMode)
  );

  const needsFadeOut = nextEntry && (
    entry.transitionOut !== 'cut' ||
    // Fade out when switching to different mode
    (nextEntry.editMode !== entry.editMode)
  );

  const fadeInFrames = needsFadeIn ? CROSSFADE_FRAMES : 0;
  const fadeOutFrames = needsFadeOut ? CROSSFADE_FRAMES : 0;

  // Calculate opacity
  let opacity = 1.0;

  if (fadeInFrames > 0) {
    const fadeIn = interpolate(frame, [0, fadeInFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    opacity = Math.min(opacity, fadeIn);
  }

  if (fadeOutFrames > 0) {
    const fadeOut = interpolate(
      frame,
      [entryDuration - fadeOutFrames, entryDuration],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
    opacity = Math.min(opacity, fadeOut);
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

// ─── Per-Entry Renderer ──────────────────────────────────────────────────────

const EdlEntryRenderer: React.FC<{
  entry: EdlEntry;
  sourceVideo: string;
}> = ({ entry, sourceVideo }) => {
  switch (entry.editMode) {
    case 'speaker_only':
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

    case 'speaker_plus_text':
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

    case 'broll_cover':
      if (!entry.broll) {
        return (
          <SpeakerClip
            src={sourceVideo}
            startTrim={entry.sourceClip.startTrim}
            endTrim={entry.sourceClip.endTrim}
            zoom={entry.zoom}
          />
        );
      }
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

    case 'speaker_over_broll':
      if (!entry.broll || !entry.speakerMask) {
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
      }
      return (
        <SpeakerOverBroll
          broll={entry.broll}
          speakerMask={entry.speakerMask}
          sourceVideo={sourceVideo}
          sourceStartTrim={entry.sourceClip.startTrim}
        >
          <RetentionCaptions
            captions={entry.captions}
            retentionRole={entry.retentionRole}
          />
        </SpeakerOverBroll>
      );

    default:
      return null;
  }
};

// ─── Main Composition ────────────────────────────────────────────────────────

export const LongformVideo: React.FC<LongformVideoProps> = ({
  sourceVideo,
  edl,
  musicBed,
  globalStyle,
}) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        width,
        height,
      }}
    >
      {/* Continuous source audio track (enhanced) — plays underneath everything */}
      <Sequence from={0} name="Source Audio">
        <SourceAudioTrack sourceVideo={sourceVideo} edl={edl} />
      </Sequence>

      {/* EDL entries as sequences with crossfade transitions */}
      {edl.map((entry, index) => {
        const durationInFrames = entry.endFrame - entry.startFrame;
        if (durationInFrames <= 0) return null;

        const prevEntry = index > 0 ? edl[index - 1] : null;
        const nextEntry = index < edl.length - 1 ? edl[index + 1] : null;

        return (
          <Sequence
            key={entry.windowId}
            from={entry.startFrame}
            durationInFrames={durationInFrames}
            name={`${entry.windowId} [${entry.editMode}]`}
          >
            <TransitionWrapper
              entry={entry}
              prevEntry={prevEntry}
              nextEntry={nextEntry}
            >
              <EdlEntryRenderer entry={entry} sourceVideo={sourceVideo} />
            </TransitionWrapper>
          </Sequence>
        );
      })}

      {/* Music bed (persistent across all sequences) */}
      {musicBed && (
        <Sequence from={0} name="Music Bed">
          <MusicBed config={musicBed} edl={edl} />
        </Sequence>
      )}

      {/* Letterbox overlay */}
      {globalStyle.letterbox && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: height * 0.06,
              backgroundColor: '#000',
              zIndex: 20,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: height * 0.06,
              backgroundColor: '#000',
              zIndex: 20,
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
};

// ─── Source Audio Track ──────────────────────────────────────────────────────

/**
 * Plays the enhanced source audio, jumping to match each EDL entry's
 * source trim. This ensures voice audio plays continuously through jump cuts.
 */
const SourceAudioTrack: React.FC<{
  sourceVideo: string;
  edl: EdlEntry[];
}> = ({ sourceVideo, edl }) => {
  const { fps } = useVideoConfig();

  return (
    <>
      {edl.map((entry) => {
        const durationInFrames = entry.endFrame - entry.startFrame;
        if (durationInFrames <= 0) return null;
        const startFromFrame = Math.round(entry.sourceClip.startTrim * fps);

        return (
          <Sequence
            key={`audio-${entry.windowId}`}
            from={entry.startFrame}
            durationInFrames={durationInFrames}
          >
            <Audio
              src={sourceVideo.startsWith('http') || sourceVideo.startsWith('/')
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

// ─── Calculate Metadata (for dynamic duration) ──────────────────────────────

export const calculateLongformMetadata = ({ props }: { props: LongformVideoProps }) => {
  return {
    fps: props.fps,
    durationInFrames: props.totalDurationFrames,
    width: props.resolution.width,
    height: props.resolution.height,
  };
};
