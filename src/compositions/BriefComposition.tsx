/**
 * BriefComposition - Main video composition from content brief
 * VID-002: Remotion Project Setup
 * VID-003: Topic Scene Component integration
 */

import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import type { ContentBrief } from '../types/brief';
import { TopicScene } from '../scenes/TopicScene';

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

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brief.style.colors?.background || '#000000',
        fontFamily: brief.style.typography?.bodyFont || 'Arial, sans-serif',
      }}
    >
      {brief.sections.map((section, index) => {
        // Calculate start frame based on previous sections
        const startFrame = brief.sections
          .slice(0, index)
          .reduce((acc, s) => acc + s.durationInFrames, 0);

        return (
          <Sequence
            key={section.id}
            from={startFrame}
            durationInFrames={section.durationInFrames}
          >
            {section.type === 'topic' ? (
              <TopicScene
                section={section}
                colors={brief.style.colors}
                typography={brief.style.typography}
                animationDuration={brief.style.animations?.duration}
              />
            ) : (
              <AbsoluteFill
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '80px',
                }}
              >
                {/* Heading */}
                {section.heading && (
                  <h1
                    style={{
                      fontSize: brief.style.typography?.headingSize || 48,
                      fontFamily: brief.style.typography?.headingFont || 'Arial, sans-serif',
                      color: brief.style.colors?.text || '#ffffff',
                      marginBottom: '40px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {section.heading}
                  </h1>
                )}

                {/* Body text */}
                {section.body && (
                  <p
                    style={{
                      fontSize: brief.style.typography?.bodySize || 24,
                      color: brief.style.colors?.text || '#ffffff',
                      textAlign: 'center',
                      lineHeight: 1.6,
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
