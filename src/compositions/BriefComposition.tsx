/**
 * BriefComposition - Main video composition from content brief
 * VID-002: Remotion Project Setup
 * VID-003: Topic Scene Component integration
 * VID-004: Theme System integration
 * VID-006: Audio Component Integration
 */

import React from 'react';
import { AbsoluteFill, Audio, Sequence, useVideoConfig, staticFile } from 'remotion';
import type { ContentBrief } from '../types/brief';
import { TopicScene } from '../scenes/TopicScene';
import { getTheme } from '../styles/theme';

export interface BriefCompositionProps {
  brief?: ContentBrief;
}

// Default brief to prevent errors
const defaultBrief: ContentBrief = {
  version: '1.0',
  title: 'Default Video',
  settings: { width: 1920, height: 1080, fps: 30 },
  style: { theme: 'dark' },
  sections: [],
};

export const BriefComposition: React.FC<BriefCompositionProps> = ({ brief = defaultBrief }) => {
  const { fps } = useVideoConfig();

  // Get theme from brief style
  const theme = getTheme(brief.style);

  /**
   * Generate audio file path for a section
   * Expects audio files in format: public/assets/audio/{brief-title}-{section-id}.mp3
   */
  const getAudioPath = (sectionId: string): string | null => {
    const briefTitle = brief.title.toLowerCase().replace(/\s+/g, '-');
    const audioPath = `assets/audio/${briefTitle}-${sectionId}.mp3`;
    return audioPath;
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.bodyFont,
      }}
    >
      {brief.sections.map((section, index) => {
        // Calculate start frame based on previous sections
        const startFrame = brief.sections
          .slice(0, index)
          .reduce((acc, s) => acc + s.durationInFrames, 0);

        // Get audio path for this section
        const audioPath = section.voiceover ? getAudioPath(section.id) : null;

        return (
          <Sequence
            key={section.id}
            from={startFrame}
            durationInFrames={section.durationInFrames}
          >
            {/* Audio for this section (if voiceover exists) */}
            {audioPath && (
              <Audio
                src={staticFile(audioPath)}
                volume={brief.audio?.musicVolume !== undefined ? 1 - brief.audio.musicVolume : 1}
              />
            )}

            {section.type === 'topic' ? (
              <TopicScene
                section={section}
                theme={theme}
                animationDuration={brief.style.animations?.duration}
              />
            ) : (
              <AbsoluteFill
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: `${theme.spacing.xl}px`,
                }}
              >
                {/* Heading */}
                {section.heading && (
                  <h1
                    style={{
                      fontSize: theme.typography.headingSize,
                      fontFamily: theme.typography.headingFont,
                      color: theme.colors.text,
                      marginBottom: `${theme.spacing.lg}px`,
                      textAlign: 'center',
                      fontWeight: theme.typography.headingWeight,
                    }}
                  >
                    {section.heading}
                  </h1>
                )}

                {/* Body text */}
                {section.body && (
                  <p
                    style={{
                      fontSize: theme.typography.bodySize,
                      fontFamily: theme.typography.bodyFont,
                      color: theme.colors.text,
                      textAlign: 'center',
                      lineHeight: theme.typography.lineHeight,
                      fontWeight: theme.typography.bodyWeight,
                      maxWidth: '800px',
                    }}
                  >
                    {section.body}
                  </p>
                )}
              </AbsoluteFill>
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
