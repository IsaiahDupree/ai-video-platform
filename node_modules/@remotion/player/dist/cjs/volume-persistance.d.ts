import { type LogLevel } from 'remotion';
export declare const persistVolume: (volume: number, logLevel: LogLevel, volumePersistenceKey: string | null) => void;
export declare const getPreferredVolume: (volumePersistenceKey: string | null) => number;
