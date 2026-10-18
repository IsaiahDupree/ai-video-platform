import {makeScene2D, Txt, Rect, Layout} from '@motion-canvas/2d';
import {createRef, all, waitFor, easeOutCubic, easeInOutCubic} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // Scene configuration
  const title = '3 Productivity Hacks';
  const subtitle = 'That Actually Work';
  const hookText = 'Stop wasting time on methods that don\'t deliver';
  
  // Colors
  const primaryColor = '#ffffff';
  const secondaryColor = '#a1a1aa';
  const accentColor = '#3b82f6';
  const bgGradient = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)';

  // Create refs
  const titleRef = createRef<Txt>();
  const subtitleRef = createRef<Txt>();
  const hookRef = createRef<Txt>();
  const accentLineRef = createRef<Rect>();

  // Background
  view.fill('#0a0a0a');

  // Add elements
  view.add(
    <Layout direction="column" alignItems="center" justifyContent="center" gap={40}>
      {/* Accent line */}
      <Rect
        ref={accentLineRef}
        width={0}
        height={4}
        fill={accentColor}
        radius={2}
      />
      
      {/* Title */}
      <Txt
        ref={titleRef}
        text={title}
        fontSize={72}
        fontFamily="Inter"
        fontWeight={700}
        fill={primaryColor}
        opacity={0}
        y={-20}
      />
      
      {/* Subtitle */}
      <Txt
        ref={subtitleRef}
        text={subtitle}
        fontSize={36}
        fontFamily="Inter"
        fontWeight={400}
        fill={secondaryColor}
        opacity={0}
        y={-20}
      />
      
      {/* Hook text */}
      <Txt
        ref={hookRef}
        text={hookText}
        fontSize={24}
        fontFamily="Inter"
        fontWeight={300}
        fill={secondaryColor}
        opacity={0}
        marginTop={60}
      />
    </Layout>
  );

  // Animation sequence
  // 1. Accent line grows
  yield* accentLineRef().width(200, 0.5, easeOutCubic);
  
  // 2. Title fades in and slides up
  yield* all(
    titleRef().opacity(1, 0.6, easeOutCubic),
    titleRef().y(0, 0.6, easeOutCubic),
  );
  
  // 3. Subtitle fades in
  yield* all(
    subtitleRef().opacity(1, 0.5, easeOutCubic),
    subtitleRef().y(0, 0.5, easeOutCubic),
  );
  
  // 4. Hook text fades in
  yield* hookRef().opacity(1, 0.8, easeInOutCubic);
  
  // Hold
  yield* waitFor(2);
});
