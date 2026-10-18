import {Txt, Rect} from '@motion-canvas/2d';
import {SignalValue, createSignal} from '@motion-canvas/core';
import {reveal, RevealKind} from '../sfx/reveal-recorder';

// =============================================================================
// Reveal-Aware UI Components for Motion Canvas
// =============================================================================

type RevealOptions = {
  kind?: RevealKind;
  key?: string;
  revealOnCall?: boolean;
};

function doReveal(kind: RevealKind, key?: string, revealOnCall = true) {
  if (!revealOnCall) return;
  reveal(kind, key);
}

// =============================================================================
// Keyword Component (big punchy text)
// =============================================================================

export function Keyword(args: {
  text: SignalValue<string>;
  fontSize?: SignalValue<number>;
  opacity?: SignalValue<number>;
  fill?: SignalValue<string>;
  reveal?: RevealOptions;
}) {
  const textValue = typeof args.text === 'function' ? args.text() : args.text;
  const key = args.reveal?.key ?? textValue;
  doReveal(args.reveal?.kind ?? 'keyword', key, args.reveal?.revealOnCall ?? true);

  return (
    <Txt
      text={args.text}
      fontSize={args.fontSize ?? 96}
      opacity={args.opacity ?? 1}
      fill={args.fill ?? '#ffffff'}
      fontWeight={700}
    />
  );
}

// =============================================================================
// Bullet Component (list item text)
// =============================================================================

export function Bullet(args: {
  text: SignalValue<string>;
  fontSize?: SignalValue<number>;
  opacity?: SignalValue<number>;
  fill?: SignalValue<string>;
  reveal?: RevealOptions;
}) {
  const textValue = typeof args.text === 'function' ? args.text() : args.text;
  const key = args.reveal?.key ?? textValue;
  doReveal(args.reveal?.kind ?? 'bullet', key, args.reveal?.revealOnCall ?? true);

  return (
    <Txt
      text={args.text}
      fontSize={args.fontSize ?? 48}
      opacity={args.opacity ?? 1}
      fill={args.fill ?? '#ffffff'}
    />
  );
}

// =============================================================================
// CodeLine Component (monospace code)
// =============================================================================

export function CodeLine(args: {
  text: SignalValue<string>;
  fontSize?: SignalValue<number>;
  opacity?: SignalValue<number>;
  fill?: SignalValue<string>;
  reveal?: RevealOptions;
}) {
  const textValue = typeof args.text === 'function' ? args.text() : args.text;
  const key = args.reveal?.key ?? textValue;
  doReveal(args.reveal?.kind ?? 'code', key, args.reveal?.revealOnCall ?? true);

  return (
    <Txt
      text={args.text}
      fontSize={args.fontSize ?? 36}
      opacity={args.opacity ?? 1}
      fill={args.fill ?? '#00ff88'}
      fontFamily="'Fira Code', 'Monaco', monospace"
    />
  );
}

// =============================================================================
// Error Banner Component
// =============================================================================

export function ErrorBanner(args: {
  text: SignalValue<string>;
  fontSize?: SignalValue<number>;
  opacity?: SignalValue<number>;
}) {
  const textValue = typeof args.text === 'function' ? args.text() : args.text;
  reveal('error', textValue);

  return (
    <Rect
      radius={16}
      padding={24}
      fill="#ff4444"
      opacity={args.opacity ?? 1}
    >
      <Txt
        text={args.text}
        fontSize={args.fontSize ?? 48}
        fill="#ffffff"
        fontWeight={600}
      />
    </Rect>
  );
}

// =============================================================================
// Success Banner Component
// =============================================================================

export function SuccessBanner(args: {
  text: SignalValue<string>;
  fontSize?: SignalValue<number>;
  opacity?: SignalValue<number>;
}) {
  const textValue = typeof args.text === 'function' ? args.text() : args.text;
  reveal('success', textValue);

  return (
    <Rect
      radius={16}
      padding={24}
      fill="#44ff88"
      opacity={args.opacity ?? 1}
    >
      <Txt
        text={args.text}
        fontSize={args.fontSize ?? 48}
        fill="#000000"
        fontWeight={600}
      />
    </Rect>
  );
}

// =============================================================================
// CTA Component (call to action)
// =============================================================================

export function CTA(args: {
  text: SignalValue<string>;
  fontSize?: SignalValue<number>;
  opacity?: SignalValue<number>;
  fill?: SignalValue<string>;
}) {
  const textValue = typeof args.text === 'function' ? args.text() : args.text;
  reveal('cta', textValue);

  return (
    <Rect
      radius={24}
      padding={[16, 32]}
      fill={args.fill ?? '#6366f1'}
      opacity={args.opacity ?? 1}
    >
      <Txt
        text={args.text}
        fontSize={args.fontSize ?? 56}
        fill="#ffffff"
        fontWeight={700}
      />
    </Rect>
  );
}

// =============================================================================
// Signal-based reveal helper (reveal when opacity goes from 0 to >0)
// =============================================================================

export function useRevealSignal(kind: RevealKind, key?: string) {
  const shown = createSignal(0);
  let didReveal = false;

  const setShown = (v: number) => {
    shown(v);
    if (!didReveal && v > 0) {
      reveal(kind, key);
      didReveal = true;
    }
  };

  return { shown, setShown };
}
