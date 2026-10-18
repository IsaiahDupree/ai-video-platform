import React, { useMemo } from 'react';
import { useVideoConfig, interpolate, Easing } from 'remotion';
import { TextType } from '../types/styles';

// Syntax highlighting color schemes
export const syntaxThemes = {
  dark: {
    background: '#1e1e1e',
    text: '#d4d4d4',
    keyword: '#569cd6',
    string: '#ce9178',
    comment: '#6a9955',
    number: '#b5cea8',
    function: '#dcdcaa',
  },
  light: {
    background: '#ffffff',
    text: '#333333',
    keyword: '#0000ff',
    string: '#a31515',
    comment: '#008000',
    number: '#098658',
    function: '#795e26',
  },
  neon: {
    background: '#0a0e27',
    text: '#00ff00',
    keyword: '#00ffff',
    string: '#ffff00',
    comment: '#888888',
    number: '#ff00ff',
    function: '#00ff00',
  },
};

interface CodeBlockProps {
  code: string;
  language?: string;
  theme?: keyof typeof syntaxThemes;
  startFrame?: number;
  duration?: number;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  fontSize?: number;
  animationType?: 'fade' | 'typewriter' | 'slide';
}

interface HighlightedToken {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'text';
  value: string;
}

// Simple tokenizer for basic syntax highlighting
function tokenizeCode(code: string, language: string = 'typescript'): HighlightedToken[] {
  const keywords: Record<string, string[]> = {
    typescript: [
      'const', 'let', 'var', 'function', 'class', 'interface', 'type',
      'if', 'else', 'for', 'while', 'return', 'async', 'await', 'import', 'export',
      'default', 'public', 'private', 'protected', 'static', 'readonly', 'enum',
      'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw',
    ],
    javascript: [
      'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while',
      'return', 'async', 'await', 'import', 'export', 'default', 'new', 'this',
      'super', 'extends', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false',
    ],
    python: [
      'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import',
      'from', 'as', 'try', 'except', 'finally', 'with', 'pass', 'break', 'continue',
      'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'async', 'await',
    ],
  };

  const tokens: HighlightedToken[] = [];
  let i = 0;

  while (i < code.length) {
    // Comments
    if (code[i] === '/' && code[i + 1] === '/') {
      const match = code.slice(i).match(/^\/\/.*?$/m);
      if (match) {
        tokens.push({ type: 'comment', value: match[0] });
        i += match[0].length;
        continue;
      }
    }

    // Strings
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', value: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Numbers
    if (/\d/.test(code[i])) {
      const match = code.slice(i).match(/^\d+(\.\d+)?/);
      if (match) {
        tokens.push({ type: 'number', value: match[0] });
        i += match[0].length;
        continue;
      }
    }

    // Keywords and identifiers
    const match = code.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (match) {
      const word = match[0];
      const allKeywords = Object.values(keywords).flat();
      if (allKeywords.includes(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (code[i + word.length] === '(') {
        tokens.push({ type: 'function', value: word });
      } else {
        tokens.push({ type: 'text', value: word });
      }
      i += word.length;
      continue;
    }

    // Everything else
    tokens.push({ type: 'text', value: code[i] });
    i++;
  }

  return tokens;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  theme = 'dark',
  startFrame = 0,
  duration = 120,
  showLineNumbers = true,
  highlightLines = [],
  fontSize = 14,
  animationType = 'fade',
}) => {
  const { fps } = useVideoConfig();
  const colors = syntaxThemes[theme];
  const tokens = useMemo(() => tokenizeCode(code, language), [code, language]);

  const lines = code.split('\n');
  const lineHeight = fontSize * 1.6;
  const padding = 16;
  const lineNumberWidth = showLineNumbers ? 40 : 0;
  const totalWidth = 800;
  const contentWidth = totalWidth - padding * 2 - lineNumberWidth;

  // Animation progress
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

  const getTokenColor = (tokenType: HighlightedToken['type']): string => {
    switch (tokenType) {
      case 'keyword':
        return colors.keyword;
      case 'string':
        return colors.string;
      case 'comment':
        return colors.comment;
      case 'number':
        return colors.number;
      case 'function':
        return colors.function;
      default:
        return colors.text;
    }
  };

  const renderLineContent = (lineNum: number) => {
    const lineCode = lines[lineNum];
    const isHighlighted = highlightLines.includes(lineNum + 1);

    if (animationType === 'typewriter') {
      const maxChars = Math.floor(progress * lineCode.length);
      return lineCode.slice(0, maxChars);
    }

    return lineCode;
  };

  return (
    <div
      style={{
        width: totalWidth,
        backgroundColor: colors.background,
        borderRadius: 8,
        padding,
        fontFamily: '"Courier New", monospace',
        fontSize,
        color: colors.text,
        opacity: animationType === 'fade' ? progress : 1,
        transform: animationType === 'slide' ? `translateY(${(1 - progress) * 20}px)` : 'none',
        overflow: 'hidden',
      }}
    >
      {lines.map((line, idx) => {
        const isHighlighted = highlightLines.includes(idx + 1);
        const lineNum = idx + 1;

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              height: lineHeight,
              backgroundColor: isHighlighted ? 'rgba(255, 255, 0, 0.1)' : 'transparent',
              paddingLeft: 8,
            }}
          >
            {showLineNumbers && (
              <span
                style={{
                  width: lineNumberWidth,
                  color: colors.comment,
                  textAlign: 'right',
                  paddingRight: 12,
                  userSelect: 'none',
                  minWidth: lineNumberWidth,
                }}
              >
                {lineNum}
              </span>
            )}
            <span style={{ whiteSpace: 'pre', flex: 1 }}>
              {renderLineContent(idx)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CodeBlock;
