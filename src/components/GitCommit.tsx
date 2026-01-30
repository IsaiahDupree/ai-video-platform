import React from 'react';
import { useVideoConfig, interpolate, Easing } from 'remotion';

export const gitThemes = {
  github: {
    background: '#0d1117',
    border: '#30363d',
    text: '#c9d1d9',
    title: '#58a6ff',
    hash: '#79c0ff',
    author: '#79c0ff',
    date: '#8b949e',
    added: '#3fb950',
    removed: '#f85149',
    modified: '#d29922',
  },
  light: {
    background: '#ffffff',
    border: '#d0d7de',
    text: '#24292f',
    title: '#0969da',
    hash: '#0969da',
    author: '#0969da',
    date: '#57606a',
    added: '#28a745',
    removed: '#d73a49',
    modified: '#6f42c1',
  },
};

export interface GitFile {
  filename: string;
  changes: number;
  status: 'added' | 'removed' | 'modified';
}

interface GitCommitProps {
  hash?: string;
  title: string;
  message?: string;
  author: string;
  email?: string;
  date?: Date | string;
  files?: GitFile[];
  theme?: keyof typeof gitThemes;
  showAnimation?: boolean;
  startFrame?: number;
  duration?: number;
  animationType?: 'fade' | 'slide' | 'expand';
}

const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') return date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const GitCommit: React.FC<GitCommitProps> = ({
  hash = 'a1b2c3d',
  title,
  message = '',
  author,
  email,
  date = new Date(),
  files = [],
  theme = 'github',
  showAnimation = true,
  startFrame = 0,
  duration = 120,
  animationType = 'fade',
}) => {
  const { fps } = useVideoConfig();
  const colors = gitThemes[theme];

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

  const animationStyle = {
    opacity: animationType === 'fade' ? progress : 1,
    transform:
      animationType === 'slide'
        ? `translateY(${(1 - progress) * 20}px)`
        : animationType === 'expand'
          ? `scale(${0.8 + progress * 0.2})`
          : 'none',
  };

  const totalAdditions = files.filter(f => f.status === 'added').reduce((sum, f) => sum + f.changes, 0);
  const totalRemovals = files.filter(f => f.status === 'removed').reduce((sum, f) => sum + f.changes, 0);
  const totalModifications = files.filter(f => f.status === 'modified').reduce((sum, f) => sum + f.changes, 0);

  const getStatusColor = (status: GitFile['status']): string => {
    switch (status) {
      case 'added':
        return colors.added;
      case 'removed':
        return colors.removed;
      case 'modified':
        return colors.modified;
    }
  };

  const getStatusLabel = (status: GitFile['status']): string => {
    switch (status) {
      case 'added':
        return 'A';
      case 'removed':
        return 'D';
      case 'modified':
        return 'M';
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
        padding: 20,
        maxWidth: 800,
        fontFamily: '"Segoe UI", -apple-system, sans-serif',
        color: colors.text,
        ...animationStyle,
      }}
    >
      {/* Commit Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: colors.hash, fontWeight: 'bold', fontFamily: 'monospace' }}>
            {hash.slice(0, 7)}
          </span>
          <span style={{ marginLeft: 12, fontSize: 14 }}>{title}</span>
        </div>
        <div style={{ fontSize: 12, color: colors.date }}>
          {author}
          {email && <span> &lt;{email}&gt;</span>} committed{' '}
          {formatDate(date)}
        </div>
      </div>

      {/* Commit Message */}
      {message && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
      )}

      {/* Files Changed */}
      {files.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 12,
              color: colors.date,
              marginBottom: 8,
              paddingBottom: 8,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            {files.length} file{files.length !== 1 ? 's' : ''} changed
            {totalAdditions > 0 && (
              <span style={{ color: colors.added, marginLeft: 8 }}>
                +{totalAdditions}
              </span>
            )}
            {totalRemovals > 0 && (
              <span style={{ color: colors.removed, marginLeft: 8 }}>
                -{totalRemovals}
              </span>
            )}
          </div>

          <div style={{ marginTop: 8 }}>
            {files.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 0',
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              >
                <span
                  style={{
                    color: getStatusColor(file.status),
                    fontWeight: 'bold',
                    marginRight: 8,
                    minWidth: 20,
                    display: 'inline-block',
                    textAlign: 'center',
                  }}
                >
                  {getStatusLabel(file.status)}
                </span>
                <span style={{ flex: 1 }}>{file.filename}</span>
                <span style={{ color: colors.date, marginLeft: 8 }}>
                  {file.changes} change{file.changes !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 16,
          fontSize: 11,
          color: colors.date,
        }}
      >
        <span>
          <span style={{ color: colors.added }}>███</span> {totalAdditions}
        </span>
        <span>
          <span style={{ color: colors.removed }}>███</span> {totalRemovals}
        </span>
        {totalModifications > 0 && (
          <span>
            <span style={{ color: colors.modified }}>███</span> {totalModifications}
          </span>
        )}
      </div>
    </div>
  );
};

export default GitCommit;
