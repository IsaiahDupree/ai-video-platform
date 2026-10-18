import {makeScene2D, Txt, Rect, Layout} from '@motion-canvas/2d';
import {createRef, all, waitFor, easeOutCubic, easeInOutCubic, easeOutBack} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // Scene configuration
  const title = 'Start Today!';
  const ctaText = 'Follow for more productivity tips';
  const socialHandles = [
    { platform: 'Instagram', handle: '@productivity' },
    { platform: 'TikTok', handle: '@prodtips' },
  ];
  
  // Colors
  const primaryColor = '#ffffff';
  const secondaryColor = '#a1a1aa';
  const accentColor = '#3b82f6';

  // Create refs
  const titleRef = createRef<Txt>();
  const ctaRef = createRef<Txt>();
  const ctaBoxRef = createRef<Rect>();
  const socialRefs = socialHandles.map(() => createRef<Txt>());

  // Background
  view.fill('#0a0a0a');

  // Add elements
  view.add(
    <Layout direction="column" alignItems="center" justifyContent="center" gap={40}>
      {/* Title */}
      <Txt
        ref={titleRef}
        text={title}
        fontSize={64}
        fontFamily="Inter"
        fontWeight={700}
        fill={primaryColor}
        opacity={0}
        scale={0.8}
      />
      
      {/* CTA Box */}
      <Rect
        ref={ctaBoxRef}
        fill={accentColor}
        padding={[20, 40]}
        radius={12}
        opacity={0}
        scale={0.9}
      >
        <Txt
          ref={ctaRef}
          text={ctaText}
          fontSize={24}
          fontFamily="Inter"
          fontWeight={600}
          fill={primaryColor}
        />
      </Rect>
      
      {/* Social handles */}
      <Layout direction="row" gap={40} marginTop={40}>
        {socialHandles.map((social, i) => (
          <Txt
            ref={socialRefs[i]}
            text={`${social.platform}: ${social.handle}`}
            fontSize={18}
            fontFamily="Inter"
            fill={secondaryColor}
            opacity={0}
          />
        ))}
      </Layout>
    </Layout>
  );

  // Animation sequence
  // 1. Title scales in
  yield* all(
    titleRef().opacity(1, 0.5, easeOutCubic),
    titleRef().scale(1, 0.6, easeOutBack),
  );
  
  // 2. CTA box appears
  yield* all(
    ctaBoxRef().opacity(1, 0.4, easeOutCubic),
    ctaBoxRef().scale(1, 0.5, easeOutBack),
  );
  
  // 3. Social handles fade in
  yield* all(
    ...socialRefs.map((ref, i) => 
      ref().opacity(1, 0.3 + i * 0.1, easeOutCubic)
    ),
  );
  
  // Hold
  yield* waitFor(2);
});
