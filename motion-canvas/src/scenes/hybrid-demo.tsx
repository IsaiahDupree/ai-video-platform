import {makeScene2D, Txt, Rect} from '@motion-canvas/2d';
import {createRef, waitFor, all} from '@motion-canvas/core';
import {resetReveals, reveal, flushRevealsToLog} from '../sfx/reveal-recorder';

export default makeScene2D(function* (view) {
  // Reset reveals at start
  resetReveals();

  // Background
  view.fill('#1a1a2e');

  // Create refs for animated elements
  const title = createRef<Txt>();
  const bullet1 = createRef<Txt>();
  const bullet2 = createRef<Txt>();
  const bullet3 = createRef<Txt>();
  const cta = createRef<Rect>();

  // Add elements (initially hidden)
  view.add(
    <>
      <Txt
        ref={title}
        text="SFX Pipeline Demo"
        fontSize={72}
        fontWeight={700}
        fill="#ffffff"
        opacity={0}
        y={-200}
      />
      <Txt
        ref={bullet1}
        text="• AI-addressable sound library"
        fontSize={40}
        fill="#88ccff"
        opacity={0}
        y={-50}
        x={-100}
      />
      <Txt
        ref={bullet2}
        text="• Two-pass render pipeline"
        fontSize={40}
        fill="#88ccff"
        opacity={0}
        y={20}
        x={-100}
      />
      <Txt
        ref={bullet3}
        text="• Automatic SFX placement"
        fontSize={40}
        fill="#88ccff"
        opacity={0}
        y={90}
        x={-100}
      />
      <Rect
        ref={cta}
        radius={20}
        padding={[16, 40]}
        fill="#6366f1"
        opacity={0}
        y={220}
      >
        <Txt
          text="Get Started →"
          fontSize={48}
          fill="#ffffff"
          fontWeight={600}
        />
      </Rect>
    </>
  );

  // Animation sequence with reveal captures
  
  // 1. Title reveal
  yield* waitFor(0.5);
  reveal('keyword', 'SFX Pipeline Demo');
  yield* title().opacity(1, 0.4);

  // 2. Bullet 1
  yield* waitFor(0.8);
  reveal('bullet', 'AI-addressable sound library');
  yield* bullet1().opacity(1, 0.3);

  // 3. Bullet 2
  yield* waitFor(0.6);
  reveal('bullet', 'Two-pass render pipeline');
  yield* bullet2().opacity(1, 0.3);

  // 4. Bullet 3
  yield* waitFor(0.6);
  reveal('bullet', 'Automatic SFX placement');
  yield* bullet3().opacity(1, 0.3);

  // 5. CTA
  yield* waitFor(1.0);
  reveal('cta', 'Get Started');
  yield* cta().opacity(1, 0.5);

  // Hold final frame
  yield* waitFor(2.0);

  // Log reveals for debugging
  flushRevealsToLog();
});
