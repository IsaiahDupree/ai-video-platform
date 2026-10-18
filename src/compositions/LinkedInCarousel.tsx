import React from 'react';
import { AbsoluteFill } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Brand tokens — GitHub-dark aesthetic (locked brand palette)
// ---------------------------------------------------------------------------
const BG = 'radial-gradient(120% 120% at 15% 0%, #12203a 0%, #0d1117 45%, #010409 100%)';
const TEXT = '#e6edf3';
const MUTED = '#7d8590';
const ACCENT = '#2f81f7';
const CARD_BORDER = 'rgba(240,246,252,0.10)';
const HANDLE = 'Isaiah Dupree · AI Automation';

// ---------------------------------------------------------------------------
// Slide model + deck (mirrors the approved copy)
// ---------------------------------------------------------------------------
type Slide =
  | { kind: 'cover'; title: string; sub: string }
  | { kind: 'body'; num: string; kicker: string; title: string; body: string }
  | { kind: 'cta'; title: string; body: string; cta: string };

export const DEFAULT_DECK: Slide[] = [
  {
    kind: 'cover',
    title: "You don't have an AI agent problem.\nYou have a kill-switch problem.",
    sub: 'The 4-part control plane every production agent needs →',
  },
  {
    kind: 'body',
    num: '',
    kicker: 'THE GAP',
    title: 'The demo always works.\nProduction is where it bites.',
    body: "I've watched a “helpful” support agent refund the same customer twice and email the wrong account — found from a ticket, not a log.",
  },
  {
    kind: 'body',
    num: '',
    kicker: 'THE FIX',
    title: "It isn't a better model.\nIt's a control plane.",
    body: 'Four things every production agent needs. Most ship with zero of them.',
  },
  {
    kind: 'body',
    num: '01',
    kicker: 'PERMISSIONS',
    title: 'Least privilege',
    body: 'Read-only by default. Writes and anything touching money sit behind an explicit allow-list. “Trust the prompt” is not a permission model.',
  },
  {
    kind: 'body',
    num: '02',
    kicker: 'EVALS',
    title: 'A test suite for behavior',
    body: 'Golden + adversarial cases, run on every prompt and model change. If you can’t score it, you can’t ship it.',
  },
  {
    kind: 'body',
    num: '03',
    kicker: 'TRACES',
    title: 'Full decision replay',
    body: 'Every run logged: input → tool calls → output. When it breaks, you want the replay — not a shrug.',
  },
  {
    kind: 'body',
    num: '04',
    kicker: 'KILL SWITCH',
    title: 'Stop it in one move',
    body: 'One flag that halts every agent, mid-run, everywhere. If you can’t stop it instantly, it’s not in production — it’s loose.',
  },
  {
    kind: 'cta',
    title: 'Shipping something agentic this quarter?',
    body: 'I run a 1-week AI Automation Audit and hand you 2 working automations with this control plane built in.',
    cta: 'DM me “control”',
  },
];

const Footer: React.FC<{ page: number; total: number }> = ({ page, total }) => (
  <div
    style={{
      position: 'absolute',
      left: 72,
      right: 72,
      bottom: 56,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily,
      fontSize: 26,
      color: MUTED,
      fontWeight: 500,
    }}
  >
    <span>{HANDLE}</span>
    <span>
      {page} / {total}
    </span>
  </div>
);

const SwipeHint: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      right: 72,
      bottom: 120,
      fontFamily,
      fontSize: 30,
      fontWeight: 700,
      color: ACCENT,
      letterSpacing: 1,
    }}
  >
    swipe →
  </div>
);

export const LinkedInCarouselSlide: React.FC<{ index?: number; deck?: Slide[] }> = ({
  index = 0,
  deck = DEFAULT_DECK,
}) => {
  const total = deck.length;
  const slide = deck[Math.max(0, Math.min(index, total - 1))];

  return (
    <AbsoluteFill style={{ background: BG, fontFamily, color: TEXT }}>
      {/* top accent rule */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 220, height: 10, background: ACCENT }} />

      {slide.kind === 'cover' && (
        <div style={{ position: 'absolute', left: 72, right: 72, top: 150 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: ACCENT, letterSpacing: 3, marginBottom: 40 }}>
            AI AGENTS IN PRODUCTION
          </div>
          <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.06, whiteSpace: 'pre-line' }}>
            {slide.title}
          </div>
          <div style={{ fontSize: 40, fontWeight: 500, color: MUTED, marginTop: 48, lineHeight: 1.35 }}>
            {slide.sub}
          </div>
        </div>
      )}

      {slide.kind === 'body' && (
        <div style={{ position: 'absolute', left: 72, right: 72, top: 150 }}>
          {slide.num ? (
            <div style={{ fontSize: 150, fontWeight: 800, color: ACCENT, lineHeight: 1, marginBottom: 8 }}>
              {slide.num}
            </div>
          ) : null}
          <div style={{ fontSize: 30, fontWeight: 700, color: ACCENT, letterSpacing: 3, marginBottom: 24 }}>
            {slide.kicker}
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, whiteSpace: 'pre-line', marginBottom: 40 }}>
            {slide.title}
          </div>
          <div style={{ fontSize: 42, fontWeight: 500, color: '#c9d1d9', lineHeight: 1.45 }}>{slide.body}</div>
        </div>
      )}

      {slide.kind === 'cta' && (
        <div style={{ position: 'absolute', left: 72, right: 72, top: 190 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.12, marginBottom: 44 }}>{slide.title}</div>
          <div style={{ fontSize: 42, fontWeight: 500, color: '#c9d1d9', lineHeight: 1.45, marginBottom: 64 }}>
            {slide.body}
          </div>
          <div
            style={{
              display: 'inline-block',
              background: ACCENT,
              color: '#ffffff',
              fontSize: 46,
              fontWeight: 800,
              padding: '28px 56px',
              borderRadius: 18,
              border: `1px solid ${CARD_BORDER}`,
            }}
          >
            {slide.cta}
          </div>
        </div>
      )}

      {slide.kind === 'cover' && <SwipeHint />}
      <Footer page={index + 1} total={total} />
    </AbsoluteFill>
  );
};

export default LinkedInCarouselSlide;
