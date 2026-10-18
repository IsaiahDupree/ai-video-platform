import {makeScene2D, Txt, Rect, Layout, Circle} from '@motion-canvas/2d';
import {createRef, all, waitFor, easeOutCubic, easeOutBack, easeOutElastic} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // Scene configuration
  const number = 5;
  const title = 'Notion AI';
  const description = 'AI-powered workspace that helps you write, brainstorm, and organize your thoughts.';
  
  // Colors (neon theme for listicle)
  const primaryColor = '#00ff88';
  const secondaryColor = '#00ccff';
  const accentColor = '#ff00ff';
  const bgColor = '#0a0a0a';

  // Create refs
  const numberRef = createRef<Txt>();
  const numberCircleRef = createRef<Circle>();
  const titleRef = createRef<Txt>();
  const descRef = createRef<Txt>();
  const glowRef = createRef<Circle>();

  // Background
  view.fill(bgColor);

  // Add elements
  view.add(
    <Layout direction="column" alignItems="center" justifyContent="center" gap={30}>
      {/* Number with glow effect */}
      <Layout>
        {/* Glow circle */}
        <Circle
          ref={glowRef}
          size={180}
          fill={primaryColor}
          opacity={0}
          shadowBlur={40}
          shadowColor={primaryColor}
        />
        {/* Number circle */}
        <Circle
          ref={numberCircleRef}
          size={140}
          stroke={primaryColor}
          lineWidth={4}
          opacity={0}
          scale={0.5}
        >
          <Txt
            ref={numberRef}
            text={number.toString()}
            fontSize={72}
            fontFamily="Inter"
            fontWeight={700}
            fill={primaryColor}
          />
        </Circle>
      </Layout>
      
      {/* Title */}
      <Txt
        ref={titleRef}
        text={title}
        fontSize={48}
        fontFamily="Inter"
        fontWeight={700}
        fill={primaryColor}
        opacity={0}
        y={20}
      />
      
      {/* Description */}
      <Txt
        ref={descRef}
        text={description}
        fontSize={22}
        fontFamily="Inter"
        fontWeight={400}
        fill={secondaryColor}
        opacity={0}
        textAlign="center"
        width={700}
      />
    </Layout>
  );

  // Animation sequence
  // 1. Glow appears
  yield* glowRef().opacity(0.3, 0.3, easeOutCubic);
  
  // 2. Number circle bounces in
  yield* all(
    numberCircleRef().opacity(1, 0.4, easeOutCubic),
    numberCircleRef().scale(1, 0.6, easeOutElastic),
  );
  
  // 3. Title slides up
  yield* all(
    titleRef().opacity(1, 0.4, easeOutCubic),
    titleRef().y(0, 0.5, easeOutCubic),
  );
  
  // 4. Description fades in
  yield* descRef().opacity(1, 0.5, easeOutCubic);
  
  // Pulse the glow
  yield* all(
    glowRef().opacity(0.5, 0.5),
    glowRef().size(200, 0.5),
  );
  yield* all(
    glowRef().opacity(0.3, 0.5),
    glowRef().size(180, 0.5),
  );
  
  // Hold
  yield* waitFor(2);
});
