export type Word = {text: string; start: number; end: number};
export type Caption = {start: number; end: number; words: Word[]};
export type Scene = {
  id: string; start: number; end: number; kind: string; chapter: string;
  title: string; subtitle: string; source: string; image?: string;
  items: string[]; note: string;
};

// Sentence-safe phrases: preserve every original aligned word, and use gaps
// only for reading hold. Never carry a phrase into the next sentence.
export function captionsFromWords(words: Word[]): Caption[] {
  const result: Caption[] = [];
  let pending: Word[] = [];
  const flush = () => {
    if (pending.length) result.push({start: pending[0].start, end: pending[pending.length-1].end, words: pending});
    pending = [];
  };
  for (const word of words) {
    if (pending.length && (pending.map(w => w.text).join(' ').length + word.text.length + 1 > 68 || pending.length >= 11)) flush();
    pending.push(word);
    if (/[.!?][”"']?$/.test(word.text)) flush();
  }
  flush();
  return result.map((c, i) => ({...c, end: Math.min(c.end + 0.22, result[i + 1]?.start ?? c.end + 0.22)}));
}

export function activeScene(scenes: Scene[], time: number): Scene {
  const scene = scenes.find(s => time >= s.start && time < s.end);
  if (!scene) throw new Error(`No scene covers time ${time}`);
  return scene;
}

export function validateTimeline(scenes: Scene[], words: Word[], duration: number): void {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Duration must be finite and positive');
  if (!scenes.length || scenes[0].start !== 0 || Math.abs(scenes.at(-1)!.end - duration) > .001) throw new Error('Scene coverage does not match duration');
  if (!words.length) throw new Error('Narration alignment must contain words');
  const ids = new Set<string>();
  scenes.forEach((s, i) => {
    if (!s.id?.trim()) throw new Error('Every scene requires a nonempty ID');
    if (ids.has(s.id)) throw new Error(`Duplicate scene ${s.id}`);
    ids.add(s.id);
    if (![s.start, s.end].every(Number.isFinite) || s.start < 0 || s.end > duration ||
        s.end <= s.start || (i && Math.abs(s.start - scenes[i-1].end) > .001)) throw new Error(`Gap/overlap at ${s.id}`);
    if (!s.title?.trim() || !s.source?.trim() || (!s.image?.trim() && !s.items?.length)) throw new Error(`Unexplained scene ${s.id}`);
  });
  words.forEach((w, i) => {
    if (!w.text?.trim() || ![w.start, w.end].every(Number.isFinite) || w.start < 0 ||
        w.end <= w.start || w.end > duration || (i && w.start < words[i-1].end)) throw new Error(`Invalid alignment word ${i}`);
  });
}
