import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Video,
  staticFile,
  useVideoConfig,
} from 'remotion';
import { ContentBrief, Section, StyleConfig } from '../types';
import { getSceneComponent } from '../scenes';
import { ProgressBar } from '../components/ProgressBar';
import { secondsToFrames } from '../utils/timing';
import { mergeWithTheme } from '../styles/themes';

export interface BriefCompositionProps {
  brief?: ContentBrief;
}

export const BriefComposition: React.FC<BriefCompositionProps> = ({ brief: inputBrief }) => {
  // Use a default brief if none provided
  const brief = inputBrief!;
  const { fps } = useVideoConfig();

  // Merge brief style with theme defaults
  const style: StyleConfig = mergeWithTheme(brief.style.theme, brief.style);

  // Calculate frame timings for each section
  const sectionTimings = brief.sections.map((section) => ({
    section,
    startFrame: secondsToFrames(section.start_time_sec, fps),
    durationInFrames: secondsToFrames(section.duration_sec, fps),
  }));

  // Resolve background video source
  const bgVideoSrc = brief.video_source?.local
    ? staticFile(brief.video_source.local)
    : brief.video_source?.url || null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgVideoSrc ? '#000000' : style.background_value,
      }}
    >
      {/* Background video layer */}
      {bgVideoSrc && (
        <AbsoluteFill style={{ zIndex: 0 }}>
          <Video
            src={bgVideoSrc}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            volume={0}
            loop
          />
          {/* Dark overlay for text readability */}
          <AbsoluteFill
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.65) 100%)',
            }}
          />
        </AbsoluteFill>
      )}
      {sectionTimings.map(({ section, startFrame, durationInFrames }, index) => {
        const SceneComponent = getSceneComponent(section.type);

        if (!SceneComponent) {
          console.warn(`No scene component found for type: ${section.type}`);
          return null;
        }

        return (
          <Sequence
            key={section.id}
            from={startFrame}
            durationInFrames={durationInFrames}
            name={`${section.type}-${section.id}`}
          >
            <SceneComponent
              content={section.content}
              style={style}
              index={index}
              {...(section.type === 'kinetic_caption' && (section.content as any).word_timings
                ? { wordTimings: (section.content as any).word_timings }
                : {})}
            />
          </Sequence>
        );
      })}

      {/* Optional progress bar */}
      <ProgressBar
        progressColor={style.accent_color}
        position="bottom"
        height={4}
      />

      {/* EverReach app icon watermark — top-right corner */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '32px 28px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: 0.75,
            backgroundColor: 'rgba(0,0,0,0.35)',
            borderRadius: 20,
            padding: '8px 14px 8px 10px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Img
            src={staticFile('everreach/branding/appstore-icon-1024-flat.png')}
            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
          />
          <span
            style={{
              fontFamily: 'Poppins, Inter, sans-serif',
              fontSize: 22,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.01em',
            }}
          >
            EverReach
          </span>
        </div>
      </AbsoluteFill>

      {/* Voiceover audio — supports both 'voiceover' and legacy 'voice_path' field names.
          Absolute paths (from Modal TTS) are served via file:// prefix. */}
      {(brief.audio?.voiceover || (brief.audio as any)?.voice_path) && (() => {
        const rawPath: string = brief.audio!.voiceover || (brief.audio as any).voice_path;
        const src = rawPath.startsWith('/') ? `file://${rawPath}` : staticFile(rawPath);
        return (
          <Audio
            src={src}
            volume={brief.audio!.volume_voice ?? 1.0}
          />
        );
      })()}

      {/* Background music — ducked under voiceover */}
      {(brief.audio as any)?.music_path && (() => {
        const mp: string = (brief.audio as any).music_path;
        const src = mp.startsWith('/') ? `file://${mp}` : staticFile(mp);
        return (
          <Audio
            src={src}
            volume={brief.audio!.volume_music ?? 0.25}
          />
        );
      })()}
    </AbsoluteFill>
  );
};

export default BriefComposition;
