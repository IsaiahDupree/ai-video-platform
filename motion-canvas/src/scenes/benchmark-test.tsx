import {makeScene2D, Txt, Rect, Circle} from '@motion-canvas/2d';
import {
  createRef,
  waitFor,
  all,
  sequence,
  chain,
  loop,
  createSignal,
  easeOutBack,
  easeInOutCubic,
  linear,
} from '@motion-canvas/core';
import {resetReveals, reveal, flushRevealsToLog} from '../sfx/reveal-recorder';

// =============================================================================
// Motion Canvas Controllability Benchmark Test
// =============================================================================
// Tests: Animation, Effects, Programmatic Control
// Note: Audio is limited to single project track (pre-mixed)

export default makeScene2D(function* (view) {
  resetReveals();
  
  // Configuration (data-driven)
  const config = {
    title: 'Motion Canvas Controllability Test',
    bullets: [
      'Generator-based animations',
      'Single audio track only',
      'Canvas-native rendering',
      'Time event sync',
    ],
    style: {
      backgroundColor: '#0f0f23',
      textColor: '#ffffff',
      accentColor: '#6366f1',
    },
  };

  view.fill(config.style.backgroundColor);

  // Create refs
  const title = createRef<Txt>();
  const bullet1 = createRef<Txt>();
  const bullet2 = createRef<Txt>();
  const bullet3 = createRef<Txt>();
  const bullet4 = createRef<Txt>();
  const cta = createRef<Rect>();
  const progressBar = createRef<Rect>();

  // Add elements
  view.add(
    <>
      {/* Title */}
      <Txt
        ref={title}
        text={config.title}
        fontSize={72}
        fontWeight={700}
        fill={config.style.textColor}
        opacity={0}
        scale={0.5}
        y={-150}
      />

      {/* Bullets */}
      <Txt
        ref={bullet1}
        text={`● ${config.bullets[0]}`}
        fontSize={36}
        fill={config.style.textColor}
        opacity={0}
        x={-400}
        y={-20}
      />
      <Txt
        ref={bullet2}
        text={`● ${config.bullets[1]}`}
        fontSize={36}
        fill={config.style.textColor}
        opacity={0}
        x={-400}
        y={40}
      />
      <Txt
        ref={bullet3}
        text={`● ${config.bullets[2]}`}
        fontSize={36}
        fill={config.style.textColor}
        opacity={0}
        x={-400}
        y={100}
      />
      <Txt
        ref={bullet4}
        text={`● ${config.bullets[3]}`}
        fontSize={36}
        fill={config.style.textColor}
        opacity={0}
        x={-400}
        y={160}
      />

      {/* CTA Button */}
      <Rect
        ref={cta}
        radius={12}
        padding={[16, 40]}
        fill={config.style.accentColor}
        opacity={0}
        scale={0.8}
        y={280}
      >
        <Txt
          text="Get Started →"
          fontSize={32}
          fontWeight={600}
          fill="#ffffff"
        />
      </Rect>

      {/* Progress bar */}
      <Rect
        ref={progressBar}
        width={0}
        height={4}
        fill={config.style.accentColor}
        y={350}
        x={-640}
      />
    </>
  );

  // Animation sequence
  const totalDuration = 7; // seconds

  // Title animation with spring-like effect
  reveal('keyword', config.title);
  yield* all(
    title().opacity(1, 0.4, easeInOutCubic),
    title().scale(1, 0.6, easeOutBack),
  );

  yield* waitFor(0.5);

  // Staggered bullet reveals
  const bulletRefs = [bullet1, bullet2, bullet3, bullet4];
  for (let i = 0; i < bulletRefs.length; i++) {
    reveal('bullet', config.bullets[i]);
    yield* all(
      bulletRefs[i]().opacity(1, 0.3, easeInOutCubic),
      bulletRefs[i]().x(-100, 0.4, easeOutBack),
    );
    yield* waitFor(0.3);
  }

  yield* waitFor(0.5);

  // CTA animation
  reveal('cta', 'Get Started');
  yield* all(
    cta().opacity(1, 0.4, easeInOutCubic),
    cta().scale(1, 0.5, easeOutBack),
  );

  // Progress bar animation (runs throughout)
  yield* progressBar().width(1280, totalDuration - 2, linear);

  yield* waitFor(1);

  flushRevealsToLog();
});
