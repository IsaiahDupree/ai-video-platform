import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { CodeContent, StyleConfig } from '../types';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, slideIn } from '../animations';

export interface CodeSceneProps {
  content: CodeContent;
  style: StyleConfig;
}

// Minimal syntax token colorizer
function tokenizeLine(line: string, language: string): Array<{ text: string; color: string }> {
  const KEYWORD_COLOR = '#c792ea';
  const STRING_COLOR = '#a5e844';
  const COMMENT_COLOR = '#546e7a';
  const FUNCTION_COLOR = '#82aaff';
  const NUMBER_COLOR = '#f78c6c';
  const OPERATOR_COLOR = '#89ddff';
  const DEFAULT_COLOR = '#eeffff';

  // Simple regex-based tokenizer
  const tokens: Array<{ text: string; color: string }> = [];
  let remaining = line;

  const matchers: Array<{ re: RegExp; color: string }> = [
    { re: /^(\/\/.*|#.*)/, color: COMMENT_COLOR },
    { re: /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, color: STRING_COLOR },
    { re: /^(const|let|var|function|return|import|export|from|class|extends|new|if|else|for|while|async|await|def|self|print|true|false|null|undefined|void|type|interface)\b/, color: KEYWORD_COLOR },
    { re: /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/, color: FUNCTION_COLOR },
    { re: /^([0-9]+\.?[0-9]*)/, color: NUMBER_COLOR },
    { re: /^(=>|===|!==|==|!=|&&|\|\||[+\-*/<>=!])/, color: OPERATOR_COLOR },
  ];

  let safetyLimit = 0;
  while (remaining.length > 0 && safetyLimit++ < 200) {
    let matched = false;
    for (const { re, color } of matchers) {
      const m = remaining.match(re);
      if (m) {
        tokens.push({ text: m[0], color });
        remaining = remaining.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // consume one char
      tokens.push({ text: remaining[0], color: DEFAULT_COLOR });
      remaining = remaining.slice(1);
    }
  }
  return tokens;
}

export const CodeScene: React.FC<CodeSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const lines = content.code.split('\n');
  const revealMode = content.reveal_mode || 'line_by_line';
  const highlightLines = content.highlight_lines || [];

  const titleOpacity = fadeIn(frame, { durationInFrames: 16, delay: 0 });

  // Line-by-line: each line appears staggered
  const framesPerLine = revealMode === 'line_by_line'
    ? Math.max(4, Math.floor((durationInFrames - 20) / lines.length))
    : 0;

  const fontSize = isVertical
    ? (lines.length > 12 ? 22 : lines.length > 8 ? 26 : 30)
    : (lines.length > 12 ? 18 : lines.length > 8 ? 22 : 26);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0d1117',
        display: 'flex',
        flexDirection: 'column',
        padding: isVertical ? 40 : 60,
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
          opacity: titleOpacity,
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#28ca42' }} />
        {content.title && (
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: isVertical ? 22 : 18,
              color: '#6e7681',
              marginLeft: 12,
            }}
          >
            {content.title}
          </span>
        )}
        {content.language && (
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: isVertical ? 18 : 14,
              color: style.accent_color,
              marginLeft: 'auto',
              backgroundColor: `${style.accent_color}20`,
              padding: '2px 10px',
              borderRadius: 4,
            }}
          >
            {content.language}
          </span>
        )}
      </div>

      {/* Code block */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#161b22',
          borderRadius: 12,
          border: '1px solid #30363d',
          padding: '24px 28px',
          overflow: 'hidden',
          fontFamily: '"Fira Code", "Consolas", "Courier New", monospace',
        }}
      >
        {lines.map((line, lineIdx) => {
          const lineDelay = revealMode === 'line_by_line' ? lineIdx * framesPerLine + 10 : 8;
          const lineOpacity = fadeIn(frame, { durationInFrames: 8, delay: lineDelay });
          const lineX = interpolate(
            frame,
            [lineDelay, lineDelay + 10],
            [isVertical ? -20 : -30, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          const isHighlighted = highlightLines.includes(lineIdx + 1);
          const tokens = tokenizeLine(line, content.language);

          return (
            <div
              key={lineIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                opacity: lineOpacity,
                transform: `translateX(${lineX}px)`,
                backgroundColor: isHighlighted ? 'rgba(99,102,241,0.15)' : 'transparent',
                borderLeft: isHighlighted ? `3px solid ${style.accent_color}` : '3px solid transparent',
                paddingLeft: 8,
                marginBottom: 2,
                minHeight: fontSize + 8,
              }}
            >
              {/* Line number */}
              <span
                style={{
                  fontSize: fontSize - 4,
                  color: '#3b4048',
                  userSelect: 'none',
                  minWidth: isVertical ? 32 : 28,
                  marginRight: 16,
                  textAlign: 'right',
                  fontFamily: 'monospace',
                }}
              >
                {lineIdx + 1}
              </span>

              {/* Tokenized code */}
              <span style={{ fontSize, lineHeight: 1.6 }}>
                {tokens.map((token, ti) => (
                  <span key={ti} style={{ color: token.color }}>{token.text}</span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default CodeScene;
