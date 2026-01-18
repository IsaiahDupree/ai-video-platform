import {makeScene2D, Txt, Rect, Layout, Circle} from '@motion-canvas/2d';
import {createRef, all, waitFor, easeOutCubic, easeOutBack, chain} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // Scene configuration
  const heading = 'Time Blocking';
  const bodyText = 'Dedicate specific time slots to specific tasks. No multitasking allowed.';
  const bulletPoints = [
    'Block 2-4 hour chunks for deep work',
    'Include buffer time between blocks',
    'Protect your most productive hours',
  ];
  const icon = '⏰';
  
  // Colors
  const primaryColor = '#ffffff';
  const secondaryColor = '#a1a1aa';
  const accentColor = '#3b82f6';

  // Create refs
  const iconRef = createRef<Txt>();
  const headingRef = createRef<Txt>();
  const bodyRef = createRef<Txt>();
  const bulletRefs = bulletPoints.map(() => createRef<Layout>());
  const containerRef = createRef<Layout>();

  // Background
  view.fill('#0a0a0a');

  // Add elements
  view.add(
    <Layout
      ref={containerRef}
      direction="column"
      alignItems="start"
      justifyContent="center"
      padding={80}
      gap={30}
      x={-200}
      width={800}
    >
      {/* Icon */}
      <Txt
        ref={iconRef}
        text={icon}
        fontSize={64}
        opacity={0}
        scale={0.5}
      />
      
      {/* Heading */}
      <Txt
        ref={headingRef}
        text={heading}
        fontSize={56}
        fontFamily="Inter"
        fontWeight={700}
        fill={primaryColor}
        opacity={0}
        x={-50}
      />
      
      {/* Body text */}
      <Txt
        ref={bodyRef}
        text={bodyText}
        fontSize={24}
        fontFamily="Inter"
        fontWeight={400}
        fill={secondaryColor}
        opacity={0}
        width={700}
      />
      
      {/* Bullet points */}
      <Layout direction="column" gap={16} marginTop={20}>
        {bulletPoints.map((point, i) => (
          <Layout
            ref={bulletRefs[i]}
            direction="row"
            alignItems="center"
            gap={16}
            opacity={0}
            x={-30}
          >
            <Circle size={8} fill={accentColor} />
            <Txt
              text={point}
              fontSize={20}
              fontFamily="Inter"
              fill={primaryColor}
            />
          </Layout>
        ))}
      </Layout>
    </Layout>
  );

  // Animation sequence
  // 1. Icon bounces in
  yield* all(
    iconRef().opacity(1, 0.4, easeOutCubic),
    iconRef().scale(1, 0.5, easeOutBack),
  );
  
  // 2. Heading slides in
  yield* all(
    headingRef().opacity(1, 0.5, easeOutCubic),
    headingRef().x(0, 0.5, easeOutCubic),
  );
  
  // 3. Body text fades in
  yield* bodyRef().opacity(1, 0.4, easeOutCubic);
  
  // 4. Bullet points stagger in
  for (const bulletRef of bulletRefs) {
    yield* all(
      bulletRef().opacity(1, 0.3, easeOutCubic),
      bulletRef().x(0, 0.3, easeOutCubic),
    );
  }
  
  // Hold
  yield* waitFor(3);
});
