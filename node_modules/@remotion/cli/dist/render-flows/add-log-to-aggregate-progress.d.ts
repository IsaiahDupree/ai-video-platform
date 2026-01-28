import type { AggregateRenderProgress } from '@remotion/studio-shared';
import type { LogLevel } from 'remotion';
export declare const addLogToAggregateProgress: ({ logs, logLogLevel, logLevel, previewString, tag, }: {
    logs: AggregateRenderProgress["logs"];
    logLogLevel: LogLevel;
    logLevel: LogLevel;
    previewString: string;
    tag: string | null;
}) => void;
