import type { ErrorWithStackFrame, LogLevel } from '@remotion/renderer';
export declare const printCodeFrameAndStack: ({ symbolicated, logLevel, }: {
    symbolicated: ErrorWithStackFrame;
    logLevel: LogLevel;
}) => void;
