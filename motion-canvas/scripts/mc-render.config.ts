// =============================================================================
// Motion Canvas Render Configuration
// =============================================================================

export interface McRenderConfig {
  editorUrl: string;
  outputDir: string;
  expectedExtensions: string[];
  serverStartupMs: number;
  renderTimeoutMs: number;
  pollIntervalMs: number;
  headless: boolean;
  captureReveals: boolean;
  revealsOutputPath: string;
}

export const mcRenderConfig: McRenderConfig = {
  editorUrl: 'http://localhost:9000/?render',
  outputDir: './output',
  expectedExtensions: ['.mp4', '.webm', '.mov'],
  serverStartupMs: 15000,
  renderTimeoutMs: 300000, // 5 minutes
  pollIntervalMs: 1000,
  headless: true,
  captureReveals: true,
  revealsOutputPath: '../data/visual_reveals.json',
};

export default mcRenderConfig;
