import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
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

  return (
    <AbsoluteFill
      style={{
        backgroundColor: style.background_value,
      }}
    >
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
