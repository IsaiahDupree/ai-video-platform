import type { LogLevel } from '@remotion/renderer';
export declare const getOutputFilename: ({ imageSequence, compositionName, compositionDefaultOutName, defaultExtension, args, fromUi, indent, logLevel, }: {
    imageSequence: boolean;
    compositionName: string;
    compositionDefaultOutName: string | null;
    defaultExtension: string;
    args: (string | number)[];
    fromUi: string | null;
    indent: boolean;
    logLevel: LogLevel;
}) => string;
