import React, { useMemo } from 'react';
import { useVideoConfig, interpolate, Easing } from 'remotion';

export const terminalThemes = {
  dark: {
    background: '#000000',
    text: '#00ff00',
    error: '#ff5555',
    warning: '#ffff00',
    success: '#55ff55',
    prompt: '#0088ff',
  },
  light: {
    background: '#f5f5f5',
    text: '#333333',
    error: '#cc0000',
    warning: '#ff8800',
    success: '#00cc00',
    prompt: '#0066ff',
  },
};

export interface TerminalLine {
  type: 'prompt' | 'input' | 'output' | 'error' | 'warning' | 'success';
  text: string;
  prompt?: string; // e.g., "$", "❯", "C:>"
}

interface TerminalOutputProps {
  lines: TerminalLine[];
  theme?: keyof typeof terminalThemes;
  startFrame?: number;
  duration?: number;
  fontSize?: number;
  animationType?: 'fade' | 'typewriter' | 'slide';
  showCursor?: boolean;
  fontFamily?: string;
}

const DEFAULT_PROMPT = '$';

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  lines,
  theme = 'dark',
  startFrame = 0,
  duration = 120,
  fontSize = 13,
  animationType = 'typewriter',
  showCursor = true,
  fontFamily = '"Courier New", monospace',
}) => {
  const { fps } = useVideoConfig();
  const colors = terminalThemes[theme];

  // Calculate animation progress
  const progress = interpolate(
    startFrame,
    [startFrame, startFrame + duration],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // For typewriter effect, calculate which lines and characters to show
  const visibleLines = useMemo(() => {
    if (animationType !== 'typewriter') {
      return lines;
    }

    const totalChars = lines.reduce((sum, line) => sum + line.text.length + 1, 0); // +1 for newline
    const charsToShow = Math.floor(progress * totalChars);

    let charCount = 0;
    const result: (TerminalLine & { truncatedText?: string })[] = [];

    for (const line of lines) {
      const lineLength = line.text.length + 1;

      if (charCount >= charsToShow) {
        break;
      }

      if (charCount + lineLength <= charsToShow) {
        result.push(line);
        charCount += lineLength;
      } else {
        const charsForThisLine = charsToShow - charCount;
        result.push({
          ...line,
          truncatedText: line.text.slice(0, charsForThisLine),
        });
        break;
      }
    }

    return result;
  }, [lines, progress, animationType]);

  const getLineColor = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'success':
        return colors.success;
      case 'prompt':
        return colors.prompt;
      case 'input':
        return colors.text;
      default:
        return colors.text;
    }
  };

  const lineHeight = fontSize * 1.8;
  const padding = 16;
  const width = 900;

  return (
    <div
      style={{
        width,
        minHeight: 300,
        backgroundColor: colors.background,
        borderRadius: 8,
        padding,
        fontFamily,
        fontSize,
        color: colors.text,
        opacity: animationType === 'fade' ? progress : 1,
        transform: animationType === 'slide' ? `translateY(${(1 - progress) * 30}px)` : 'none',
        overflow: 'hidden',
        border: `2px solid ${colors.text}`,
      }}
    >
      <div style={{ letterSpacing: '0.02em', lineHeight: lineHeight / fontSize }}>
        {visibleLines.map((line, idx) => {
          const color = getLineColor(line.type);
          const displayText = line.truncatedText ?? line.text;
          const prompt = line.prompt ?? DEFAULT_PROMPT;

          // Render different styles based on line type
          if (line.type === 'prompt' || line.type === 'input') {
            return (
              <div key={idx} style={{ height: lineHeight, display: 'flex', alignItems: 'center' }}>
                <span style={{ color: colors.prompt, marginRight: 8 }}>
                  {prompt}
                </span>
                <span style={{ color }}>
                  {displayText}
                  {line.truncatedText !== undefined && showCursor && (
                    <span style={{ opacity: 0.7 }}>▌</span>
                  )}
                </span>
              </div>
            );
          }

          return (
            <div key={idx} style={{ height: lineHeight, display: 'flex', alignItems: 'center' }}>
              <span style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {displayText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TerminalOutput;
