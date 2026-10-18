export type Caption = {start: number; end: number; lines: string[]};
export type Scene = {
  id: string; start: number; end: number; title: string; overlay: string;
  media: string; mediaKind: 'illustration' | 'screenshot' | 'screen_recording';
  provenanceLabel: string; mediaSha256: string;
};
export type TutorialProps = {
  contract: 'rangeops_tutorial_render_v1'; duration: number; audio: string;
  audioSha256: string; scriptSha256: string; captureBuild: string;
  scenes: Scene[]; captions: Caption[];
};
const sha = /^[a-f0-9]{64}$/;
const asset = /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(?:png|jpg|jpeg|mp4|mov|mp3|wav|m4a)$/;
const requireValue = (ok: unknown, message: string) => {if (!ok) throw new Error(message);};
export function validateProps(value: unknown): asserts value is TutorialProps {
  requireValue(value && typeof value === 'object', 'Actual tutorial props are required.');
  const props = value as TutorialProps;
  requireValue(props.contract === 'rangeops_tutorial_render_v1', 'Invalid tutorial contract.');
  requireValue(Number.isFinite(props.duration) && props.duration > 20 && props.duration <= 180, 'Duration must be audio-aligned and 20–180 seconds.');
  requireValue(asset.test(props.audio ?? '') && /\.(mp3|wav|m4a)$/.test(props.audio), 'A staged narration file is required.');
  requireValue(sha.test(props.audioSha256 ?? '') && sha.test(props.scriptSha256 ?? ''), 'Exact narration hashes are required.');
  requireValue(typeof props.captureBuild === 'string' && props.captureBuild.length > 0, 'Capture build provenance is required.');
  requireValue(Array.isArray(props.scenes) && props.scenes.length === 8, 'The eight actual storyboard scenes are required.');
  let end = 0;
  for (const scene of props.scenes) {
    requireValue(Number.isFinite(scene.start) && Math.abs(scene.start-end) < 0.04 && scene.end > scene.start, 'Scenes must cover the exact timeline without gaps or overlaps.');
    requireValue(scene.end <= props.duration + 0.001, 'Scene exceeds actual duration.');
    requireValue(typeof scene.title === 'string' && scene.title.length > 0 && scene.title.length <= 65, 'Scene title is missing or too long.');
    requireValue(typeof scene.overlay === 'string' && scene.overlay.length > 0 && scene.overlay.length <= 90, 'Scene overlay is missing or too long.');
    requireValue(asset.test(scene.media ?? '') && sha.test(scene.mediaSha256 ?? ''), 'Real staged media and its hash are required.');
    requireValue(['illustration', 'screenshot', 'screen_recording'].includes(scene.mediaKind), 'Media type must distinguish art from actual app UI.');
    requireValue(scene.provenanceLabel === (scene.mediaKind === 'illustration' ? 'Concept illustration' : 'Actual app screen'), 'Media must be honestly labeled.');
    end = scene.end;
  }
  requireValue(Math.abs(end-props.duration) < 0.04, 'Last scene does not reach the audio duration.');
  requireValue(props.scenes.some(s => s.mediaKind !== 'illustration'), 'Actual current-build app captures are mandatory.');
  requireValue(Array.isArray(props.captions) && props.captions.length > 0, 'Audio-aligned captions are required.');
  let captionEnd = 0;
  for (const caption of props.captions) {
    requireValue(caption.start >= captionEnd - 0.001 && caption.end > caption.start && caption.end <= props.duration, 'Invalid caption timing.');
    requireValue(Array.isArray(caption.lines) && caption.lines.length >= 1 && caption.lines.length <= 2 && caption.lines.every(line => line.length > 0 && line.length <= 42), 'Captions allow at most two 42-character lines.');
    captionEnd = caption.end;
  }
}
