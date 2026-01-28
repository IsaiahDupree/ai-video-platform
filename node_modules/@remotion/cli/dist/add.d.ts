import { type LogLevel } from '@remotion/renderer';
export declare const addCommand: ({ remotionRoot, packageManager, packageNames, logLevel, args, }: {
    remotionRoot: string;
    packageManager: string | undefined;
    packageNames: string[];
    logLevel: LogLevel;
    args: string[];
}) => Promise<void>;
