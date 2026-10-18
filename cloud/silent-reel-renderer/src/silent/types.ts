/**
 * Silent explainer reels — the format reverse-engineered from
 * @codewithdeekeej (blueprint) and @krishnachaytanyaa (machine):
 * no voiceover, one persistent scene whose STATE changes, 9–16 s,
 * caption teaches, video hooks. Props are produced by the
 * silent-explainer CLI (spec.json → props) and validated there.
 */

export type Tone = 'neutral' | 'bad' | 'good' | 'accent';

export type NodeKind =
  | 'user' | 'server' | 'db' | 'api' | 'queue' | 'cache' | 'cloud'
  | 'agent' | 'gate' | 'gear' | 'gauge' | 'bank' | 'shop' | 'lock' | 'doc';

export interface SceneNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** normalized 0..1 inside the diagram box */
  x: number;
  y: number;
  sub?: string;
  badge?: string;
  tone?: Tone;
  /** gauge/gear nodes: 0..1 fill or spin speed */
  value?: number;
  /** machine theme: a boxed value readout under the node, e.g. "$60 ON HOLD" */
  readout?: string;
}

export interface SceneEdge {
  from: string;
  to: string;
  label?: string;
  tone?: Tone;
  /** 'flow' animates dashes along the edge, 'static' draws a plain line, 'off' draws it dimmed */
  mode?: 'flow' | 'static' | 'off';
  /** curve bulge, -1..1 (0 = straight) */
  bend?: number;
}

export interface SceneState {
  subtitle: string;
  tone: Tone;
  nodes: SceneNode[];
  edges: SceneEdge[];
  /** big center readout — the "200ms" / "SYNCED" device */
  metric?: { value: string; sub?: string; tone?: Tone; big?: boolean };
  footer: string;
  footerSub?: string;
  /** seconds this state holds on screen */
  seconds: number;
}

export type SilentReelProps = {
  style: 'blueprint' | 'machine';
  title: { lead: string; accent: string };
  /** printed under the title in machine style — the felt question */
  question?: string;
  handle: string;
  states: SceneState[];
  /** final beat: one word + sub, spring-scaled (deekeej's SYNCED) */
  payoff?: { word: string; sub?: string; tone?: Tone };
  /** machine style closing formula line: "ONLINE PAYMENT = AUTHORIZE + CAPTURE + SETTLE" */
  formula?: string;
  music?: { file: string; volume?: number } | null;
  fps?: number;
};

export const silentReelDefaultProps: SilentReelProps = {
  style: 'blueprint',
  title: { lead: 'DB', accent: 'Replication' },
  handle: '@the_isaiah_dupree',
  states: [
    {
      subtitle: 'WITHOUT REPLICATION',
      tone: 'bad',
      seconds: 5,
      nodes: [
        { id: 'client', kind: 'user', label: 'CLIENT', x: 0.12, y: 0.5 },
        { id: 'db', kind: 'db', label: 'DATABASE', x: 0.86, y: 0.5, badge: 'NO BACKUP', tone: 'bad', sub: 'single point of failure' },
      ],
      edges: [{ from: 'client', to: 'db', label: 'QUERY', mode: 'flow', bend: -0.25 }],
      metric: { value: '200ms', sub: 'response time — single DB', tone: 'good' },
      footer: 'All queries to one database — no redundancy',
      footerSub: 'One failure = everything stops.',
    },
    {
      subtitle: 'WITH REPLICATION',
      tone: 'good',
      seconds: 6,
      nodes: [
        { id: 'client', kind: 'user', label: 'CLIENT', x: 0.1, y: 0.5 },
        { id: 'primary', kind: 'db', label: 'PRIMARY', x: 0.45, y: 0.5, badge: 'reads + writes', tone: 'accent' },
        { id: 'ra', kind: 'db', label: 'Replica A', x: 0.88, y: 0.15, sub: 'read only', tone: 'good' },
        { id: 'rb', kind: 'db', label: 'Replica B', x: 0.88, y: 0.5, sub: 'read only', tone: 'good' },
        { id: 'rc', kind: 'db', label: 'Replica C', x: 0.88, y: 0.85, sub: 'read only', tone: 'good' },
      ],
      edges: [
        { from: 'client', to: 'primary', mode: 'flow' },
        { from: 'primary', to: 'ra', mode: 'flow', tone: 'good', bend: -0.2 },
        { from: 'primary', to: 'rb', mode: 'flow', tone: 'good' },
        { from: 'primary', to: 'rc', mode: 'flow', tone: 'good', bend: 0.2 },
        { from: 'client', to: 'ra', mode: 'static', tone: 'neutral', bend: -0.5 },
        { from: 'client', to: 'rc', mode: 'static', tone: 'neutral', bend: 0.5 },
      ],
      footer: 'Primary: reads + writes  |  Replicas: read only',
      footerSub: 'Reads go to replicas to reduce load on primary',
    },
  ],
  payoff: { word: 'SYNCED', sub: 'replicas up to date', tone: 'good' },
  music: { file: 'bg-music-lifestyle-01.mp3', volume: 0.35 },
  fps: 30,
};

export const silentReelDurationInFrames = (props: SilentReelProps): number => {
  const fps = props.fps ?? 30;
  const seconds = props.states.reduce((acc, s) => acc + (s.seconds || 0), 0);
  return Math.max(1, Math.round(seconds * fps));
};
