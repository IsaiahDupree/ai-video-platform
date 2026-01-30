import React from 'react';
import {
  AbsolutePosition,
  Composition,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { CodeBlock } from '../components/CodeBlock';
import { TerminalOutput, TerminalLine } from '../components/TerminalOutput';
import { GitCommit, GitFile } from '../components/GitCommit';
import type { ContentBrief } from '../types/ContentBrief';

export interface DevVlogSection {
  type: 'hook' | 'context' | 'code' | 'terminal' | 'commit' | 'result' | 'cta';
  duration: number;
  content: {
    code?: string;
    language?: string;
    terminalLines?: TerminalLine[];
    commitData?: {
      hash: string;
      title: string;
      message?: string;
      author: string;
      email?: string;
      date?: Date | string;
      files?: GitFile[];
    };
    text?: string;
    title?: string;
  };
  startFrame: number;
}

interface DevVlogSceneProps {
  sections: DevVlogSection[];
  brief?: Partial<ContentBrief>;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

/**
 * Developer Vlog Scene Component
 *
 * Renders interactive code walkthroughs, terminal output, and git commits
 * for technical content creation.
 *
 * Structure:
 * - Hook (3-5s): Eye-catching statement
 * - Context (10-15s): Problem statement
 * - Code (30-60s): Code walkthrough with highlighting
 * - Terminal (10-20s): Command execution output
 * - Commit (5-10s): Git commit visualization
 * - Result (10-15s): Demo/result display
 * - CTA (5s): Call to action
 */
export const DevVlogScene: React.FC<DevVlogSceneProps> = ({
  sections,
  brief,
  backgroundColor = '#0a0e27',
  textColor = '#ffffff',
  accentColor = '#00ff00',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        color: textColor,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {sections.map((section, idx) => {
        const sectionEnd = section.startFrame + section.duration;
        const isActive = frame >= section.startFrame && frame < sectionEnd;
        const sectionProgress = interpolate(
          frame,
          [section.startFrame, sectionEnd],
          [0, 1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }
        );

        // Fade in/out
        const opacity = interpolate(
          sectionProgress,
          [0, 0.1, 0.9, 1],
          [0, 1, 1, 0]
        );

        return (
          <Sequence
            key={idx}
            from={section.startFrame}
            durationInFrames={section.duration}
          >
            <div
              style={{
                opacity,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                padding: 40,
                gap: 20,
              }}
            >
              {section.type === 'hook' && (
                <div style={{ textAlign: 'center' }}>
                  <h1
                    style={{
                      fontSize: 48,
                      fontWeight: 'bold',
                      color: accentColor,
                      marginBottom: 20,
                      textShadow: `0 0 10px ${accentColor}`,
                    }}
                  >
                    {section.content.title || 'New Feature Built'}
                  </h1>
                  <p
                    style={{
                      fontSize: 24,
                      color: textColor,
                      maxWidth: 800,
                    }}
                  >
                    {section.content.text}
                  </p>
                </div>
              )}

              {section.type === 'context' && (
                <div style={{ maxWidth: 800, textAlign: 'left' }}>
                  <h2
                    style={{
                      fontSize: 32,
                      color: accentColor,
                      marginBottom: 20,
                    }}
                  >
                    {section.content.title || 'The Problem'}
                  </h2>
                  <p
                    style={{
                      fontSize: 18,
                      color: textColor,
                      lineHeight: 1.6,
                    }}
                  >
                    {section.content.text}
                  </p>
                </div>
              )}

              {section.type === 'code' && section.content.code && (
                <div>
                  {section.content.title && (
                    <h2
                      style={{
                        fontSize: 28,
                        color: accentColor,
                        marginBottom: 20,
                      }}
                    >
                      {section.content.title}
                    </h2>
                  )}
                  <CodeBlock
                    code={section.content.code}
                    language={section.content.language || 'typescript'}
                    theme="neon"
                    fontSize={13}
                    showLineNumbers={true}
                    animationType="typewriter"
                    startFrame={0}
                    duration={section.duration}
                  />
                </div>
              )}

              {section.type === 'terminal' && section.content.terminalLines && (
                <div>
                  {section.content.title && (
                    <h2
                      style={{
                        fontSize: 28,
                        color: accentColor,
                        marginBottom: 20,
                      }}
                    >
                      {section.content.title}
                    </h2>
                  )}
                  <TerminalOutput
                    lines={section.content.terminalLines}
                    theme="dark"
                    fontSize={13}
                    animationType="typewriter"
                    startFrame={0}
                    duration={section.duration}
                  />
                </div>
              )}

              {section.type === 'commit' && section.content.commitData && (
                <div style={{ width: '100%', maxWidth: 800 }}>
                  {section.content.title && (
                    <h2
                      style={{
                        fontSize: 28,
                        color: accentColor,
                        marginBottom: 20,
                      }}
                    >
                      {section.content.title}
                    </h2>
                  )}
                  <GitCommit
                    hash={section.content.commitData.hash}
                    title={section.content.commitData.title}
                    message={section.content.commitData.message}
                    author={section.content.commitData.author}
                    email={section.content.commitData.email}
                    date={section.content.commitData.date}
                    files={section.content.commitData.files}
                    theme="github"
                    animationType="expand"
                    startFrame={0}
                    duration={section.duration}
                  />
                </div>
              )}

              {section.type === 'result' && (
                <div style={{ textAlign: 'center' }}>
                  <h2
                    style={{
                      fontSize: 32,
                      color: accentColor,
                      marginBottom: 20,
                    }}
                  >
                    {section.content.title || 'The Result'}
                  </h2>
                  <p
                    style={{
                      fontSize: 20,
                      color: textColor,
                      maxWidth: 800,
                      lineHeight: 1.6,
                    }}
                  >
                    {section.content.text}
                  </p>
                </div>
              )}

              {section.type === 'cta' && (
                <div style={{ textAlign: 'center' }}>
                  <h2
                    style={{
                      fontSize: 32,
                      color: accentColor,
                      marginBottom: 20,
                    }}
                  >
                    {section.content.title || 'Get Started'}
                  </h2>
                  <p
                    style={{
                      fontSize: 20,
                      color: textColor,
                      maxWidth: 800,
                    }}
                  >
                    {section.content.text}
                  </p>
                </div>
              )}
            </div>
          </Sequence>
        );
      })}
    </div>
  );
};

export default DevVlogScene;
