import { StyleConfig, AspectRatio } from '../src/types';

export interface VideoFormat {
  id: string;
  name: string;
  description: string;
  default_duration_sec: number;
  aspect_ratio: AspectRatio;
  resolution: { width: number; height: number };
  scene_sequence: SceneDefinition[];
  default_style: StyleConfig;
}

export interface SceneDefinition {
  type: string;
  duration_percent: number;
  required: boolean;
  max_instances?: number;
}
