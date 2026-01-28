'use client';

import { useState, useEffect } from 'react';
import { AdTemplate } from '../../../../types/adTemplate';
import {
  runQAChecks,
  QAResult,
  QAIssue,
  getQASummary,
  getSeverityIcon,
  getSeverityColor,
  formatIssueMessage,
  DEFAULT_QA_CONFIG,
  QAConfig,
} from '../../../../services/creativeQA';
import styles from './QAPanel.module.css';

interface QAPanelProps {
  template: AdTemplate;
  autoCheck?: boolean;
  config?: QAConfig;
}

export default function QAPanel({ template, autoCheck = true, config }: QAPanelProps) {
  const [result, setResult] = useState<QAResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Run QA checks when template changes (if autoCheck is enabled)
  useEffect(() => {
    if (autoCheck) {
      runChecks();
    }
  }, [template, autoCheck]);

  const runChecks = () => {
    setIsRunning(true);
    try {
      const qaConfig = config || DEFAULT_QA_CONFIG;
      const qaResult = runQAChecks(template, qaConfig);
      setResult(qaResult);

      // Auto-expand if there are errors or warnings
      if (qaResult.issues.some(i => i.severity === 'error' || i.severity === 'warning')) {
        setIsExpanded(true);
      }
    } finally {
      setIsRunning(false);
    }
  };

  if (!result && !autoCheck) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Click "Run QA Checks" to analyze this creative</p>
          <button onClick={runChecks} className={styles.runButton} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run QA Checks'}
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Running QA checks...</div>
      </div>
    );
  }

  const summary = getQASummary(result);
  const hasErrors = summary.errorCount > 0;
  const hasWarnings = summary.warningCount > 0;
  const hasIssues = summary.totalIssues > 0;

  return (
    <div className={styles.container}>
      {/* QA Score Header */}
      <div
        className={`${styles.header} ${hasErrors ? styles.headerError : hasWarnings ? styles.headerWarning : styles.headerSuccess}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.headerLeft}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNumber}>{result.score}</span>
          </div>
          <div className={styles.headerInfo}>
            <h3 className={styles.headerTitle}>
              {hasErrors ? 'Issues Found' : hasWarnings ? 'Warnings' : 'Looks Good!'}
            </h3>
            <p className={styles.headerSubtitle}>
              {summary.passedChecks}/{summary.totalChecks} checks passed
              {hasIssues && ` • ${summary.totalIssues} issue${summary.totalIssues > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshButton} onClick={runChecks} disabled={isRunning}>
            {isRunning ? '⏳' : '🔄'}
          </button>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={styles.content}>
          {/* Summary Stats */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Errors</span>
              <span className={`${styles.statValue} ${styles.statError}`}>
                {summary.errorCount}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Warnings</span>
              <span className={`${styles.statValue} ${styles.statWarning}`}>
                {summary.warningCount}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Info</span>
              <span className={`${styles.statValue} ${styles.statInfo}`}>
                {summary.infoCount}
              </span>
            </div>
          </div>

          {/* Issues List */}
          {result.issues.length > 0 ? (
            <div className={styles.issues}>
              <h4 className={styles.issuesTitle}>Issues</h4>
              {result.issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          ) : (
            <div className={styles.noIssues}>
              <span className={styles.successIcon}>✅</span>
              <p>No issues found! This creative meets all quality standards.</p>
            </div>
          )}

          {/* Checks List */}
          <div className={styles.checks}>
            <h4 className={styles.checksTitle}>Checks Performed</h4>
            <div className={styles.checksList}>
              {result.checks.map((check, index) => (
                <div key={index} className={styles.checkItem}>
                  <span className={styles.checkIcon}>{check.passed ? '✅' : '⚠️'}</span>
                  <span className={styles.checkName}>{check.name}</span>
                  {check.duration !== undefined && (
                    <span className={styles.checkDuration}>{check.duration}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Issue Card Component
 */
function IssueCard({ issue }: { issue: QAIssue }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const severityColor = getSeverityColor(issue.severity);
  const severityIcon = getSeverityIcon(issue.severity);

  return (
    <div
      className={styles.issueCard}
      style={{ borderLeftColor: severityColor }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className={styles.issueHeader}>
        <div className={styles.issueHeaderLeft}>
          <span className={styles.issueIcon}>{severityIcon}</span>
          <div className={styles.issueInfo}>
            <p className={styles.issueMessage}>{issue.message}</p>
            {issue.field && <span className={styles.issueField}>Field: {issue.field}</span>}
          </div>
        </div>
        <span className={styles.issueExpandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className={styles.issueDetails}>
          {issue.details && (
            <div className={styles.issueDetail}>
              <strong>Details:</strong> {issue.details}
            </div>
          )}

          {issue.value !== undefined && issue.threshold !== undefined && (
            <div className={styles.issueDetail}>
              <strong>Current Value:</strong> {issue.value} <br />
              <strong>Required:</strong> {issue.threshold}
            </div>
          )}

          {issue.suggestion && (
            <div className={styles.issueSuggestion}>
              <span className={styles.suggestionIcon}>💡</span>
              <p>{issue.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
