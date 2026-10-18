// Turns a converged ScriptDraft + EditPlan into a real Remotion ContentBrief JSON that
// scripts/render.ts / the video-studio-mcp remotion_render tool can render directly.
// This is the layer the PRD asks for: "a REAL LLM call feeding INTO Remotion's brief
// format" — remotion_generate_brief itself is not used here (per this session's earlier
// finding that it's pure JS templating with no retention/duration logic inside it).
import type { EditPlan, ScriptDraft, StyleSkill } from './types.ts';
import { youtube_explainer_v2 } from '../../formats/youtube_explainer_v2.ts';
import type { ContentBrief, Section, SectionType } from '../../src/types/ContentBrief';

export function assembleContentBrief(opts: {
  script: ScriptDraft;
  editPlan: EditPlan;
  styleSkill: StyleSkill;
  // Path RELATIVE to Remotion/public/ (no leading slash) for the concatenated narration
  // wav — must resolve via Remotion's staticFile(), not an absolute file:// path:
  // @remotion/renderer's server-side asset downloader only accepts http(s) URLs, so the
  // file://<absolute path> trick BriefComposition.tsx falls back to for absolute paths
  // works in the Studio preview (browser-native file access) but NOT in renderMedia.
  voiceoverPublicRelPath: string;
  id: string;
}): ContentBrief {
  const { script, editPlan, styleSkill, voiceoverPublicRelPath, id } = opts;

  const sections: Section[] = editPlan.events.map((ev, i) => ({
    id: `${ev.section_id}_${i}_${ev.scene_type}`,
    type: ev.scene_type as SectionType,
    duration_sec: ev.duration_sec,
    start_time_sec: ev.start_time_sec,
    content: ev.content as any,
  }));

  const brief: ContentBrief = {
    id,
    format: styleSkill.format as ContentBrief['format'],
    version: '1.0',
    created_at: new Date().toISOString(),
    settings: {
      resolution: youtube_explainer_v2.resolution,
      fps: 30,
      duration_sec: editPlan.total_duration_sec,
      aspect_ratio: youtube_explainer_v2.aspect_ratio as ContentBrief['settings']['aspect_ratio'],
    },
    style: { ...youtube_explainer_v2.default_style },
    sections,
    audio: {
      voiceover: voiceoverPublicRelPath,
      volume_voice: 1.0,
      volume_music: 0, // Phase 1: no music bed asset — never fabricate one
    },
  };

  return brief;
}
