import React from 'react';
import { Composition, Still, getInputProps, staticFile } from 'remotion';
import { BriefComposition } from './compositions/BriefComposition';
import { AssetComposition } from './compositions/AssetComposition';
import { BenchmarkTest, benchmarkDefaultProps } from './compositions/BenchmarkTest';
import { FullVideoDemo, fullVideoDemoDefaultProps } from './compositions/FullVideoDemo';
import { CaptionStylesBenchmark, captionStylesBenchmarkDefaultProps } from './compositions/CaptionStylesBenchmark';
import { ThermodynamicsVideo, thermodynamicsDefaultProps } from './compositions/ThermodynamicsVideo';
import { UGCComposition, ugcDefaultProps } from './compositions/UGCComposition';
import { EverReachCompilation, everReachDefaultProps } from './compositions/EverReachCompilation';
import { AircraftWingsVideo, aircraftWingsDefaultProps } from './compositions/AircraftWingsVideo';
import {
  StaticAd,
  ProductShowcaseAd,
  SaleAd,
  TestimonialAd,
  EventAd,
  staticAdDefaultProps,
  AD_SIZES,
} from './compositions/StaticAds';
import {
  EverReachAd,
  PainPointAd,
  ListicleAd,
  ComparisonAd,
  StatAd,
  QuestionAd,
  ObjectionKillerAd,
  everReachAdDefaultProps,
  META_AD_SIZES,
  PHASE_A_ANGLES,
} from './compositions/everreach';
import {
  AdTemplateStill,
  defaultAdTemplateStillProps,
  AD_CANVAS_PRESETS,
} from './ad-templates';
import { StripePricing, stripePricingDefaultProps } from './compositions/StripePricing';
import { StripeProductCard, STRIPE_PRODUCTS } from './compositions/StripeProductCard';
import {
  BeforeAfterSplit,
  beforeAfterSplitDefaultProps,
  BeforeAfterVideo,
  ThreeSteps,
  threeStepsDefaultProps,
  ComparisonCard,
  comparisonCardDefaultProps,
  UIProof,
  uiProofDefaultProps,
  ReceiptProof,
  receiptProofDefaultProps,
  ProblemAwareStaticAd,
  problemAwareStaticAdDefaultProps,
  ListicleStaticAd,
  listicleStaticAdDefaultProps,
  BLANKLOGO_AD_SIZES,
  AD_CONCEPTS,
  META_LAUNCH_BEFORE_AFTER,
  META_LAUNCH_COMPARISON,
  META_LAUNCH_UI_FLOW,
  RETARGETING_ADS,
  VIDEO_AD_COPY,
  VIDEO_PAIRS,
} from './compositions/blanklogo';
import {
  UGCBeforeAfter,
  ugcBeforeAfterDefaultProps,
  UGCTestimonial,
  ugcTestimonialDefaultProps,
  UGCProductDemo,
  ugcProductDemoDefaultProps,
  UGCProblemSolution,
  ugcProblemSolutionDefaultProps,
  UGCStatCounter,
  ugcStatCounterDefaultProps,
  UGCFeatureList,
  ugcFeatureListDefaultProps,
  UGCUrgency,
  ugcUrgencyDefaultProps,
  UGCVideoAdWrapper,
  ugcVideoAdWrapperDefaultProps,
  VIDEO_AD_DURATION,
  VIDEO_AD_FPS,
} from './compositions/ugc';
import {
  BeforeAfterReveal,
  beforeAfterRevealDefaultProps,
} from './compositions/BeforeAfterReveal';
import { ContentBrief } from './types';

export interface BriefCompositionProps {
  brief?: ContentBrief;
}

// Default brief for development preview
const defaultBrief: ContentBrief = {
  id: 'default_preview',
  format: 'explainer_v1',
  version: '1.0',
  created_at: new Date().toISOString(),
  settings: {
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    duration_sec: 10,
    aspect_ratio: '9:16',
  },
  style: {
    theme: 'dark',
    primary_color: '#ffffff',
    secondary_color: '#a1a1aa',
    accent_color: '#3b82f6',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
  },
  sections: [
    {
      id: 'intro_default',
      type: 'intro',
      duration_sec: 5,
      start_time_sec: 0,
      content: {
        type: 'intro',
        title: 'Video Studio',
        subtitle: 'Preview Mode',
        hook_text: 'Load a brief to see your content',
      },
    },
    {
      id: 'outro_default',
      type: 'outro',
      duration_sec: 5,
      start_time_sec: 5,
      content: {
        type: 'outro',
        title: 'Ready to Create',
        call_to_action: 'Load your brief JSON',
      },
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  // Get brief from input props (for rendering) or use default
  const inputProps = getInputProps() as { brief?: ContentBrief };
  const brief = inputProps.brief || defaultBrief;

  const { fps, duration_sec, resolution } = brief.settings;
  const durationInFrames = Math.round(duration_sec * fps);

  return (
    <>
      {/* Main brief-driven composition */}
      <Composition
        id="BriefComposition"
        component={BriefComposition}
        durationInFrames={durationInFrames}
        fps={fps}
        width={resolution.width}
        height={resolution.height}
        defaultProps={{ brief }}
      />

      {/* Preset compositions for common formats */}
      <Composition
        id="Explainer-9x16"
        component={BriefComposition}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ brief: defaultBrief }}
      />

      <Composition
        id="Explainer-16x9"
        component={BriefComposition}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ brief: { ...defaultBrief, settings: { ...defaultBrief.settings, resolution: { width: 1920, height: 1080 }, aspect_ratio: '16:9' as const } } }}
      />

      <Composition
        id="Shorts-9x16"
        component={BriefComposition}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ brief: { ...defaultBrief, format: 'shorts_v1' } }}
      />

      {/* Asset-enhanced composition */}
      <Composition
        id="AssetComposition"
        component={AssetComposition}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ brief: defaultBrief }}
      />

      {/* Benchmark test composition */}
      <Composition
        id="BenchmarkTest"
        component={BenchmarkTest}
        durationInFrames={210}
        fps={30}
        width={1280}
        height={720}
        defaultProps={benchmarkDefaultProps}
      />

      {/* Full video demo - all capabilities */}
      <Composition
        id="FullVideoDemo"
        component={FullVideoDemo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={fullVideoDemoDefaultProps}
      />

      {/* Caption styles benchmark */}
      <Composition
        id="CaptionStylesBenchmark"
        component={CaptionStylesBenchmark}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={captionStylesBenchmarkDefaultProps}
      />

      {/* Thermodynamics explainer video */}
      <Composition
        id="ThermodynamicsVideo"
        component={ThermodynamicsVideo}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={thermodynamicsDefaultProps}
      />

      {/* UGC Video Composition - for approved content recreation */}
      <Composition
        id="UGCComposition"
        component={UGCComposition}
        durationInFrames={870}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ugcDefaultProps}
      />

      {/* EverReach Compilation - word-aware listicle with TikTok captions */}
      <Composition
        id="EverReachCompilation"
        component={EverReachCompilation}
        durationInFrames={1840}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={everReachDefaultProps}
      />

      {/* Aircraft Wings - Differential Flow Explainer (Beginner to Postgrad) */}
      <Composition
        id="AircraftWingsVideo"
        component={AircraftWingsVideo}
        durationInFrames={3591}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={aircraftWingsDefaultProps}
      />

      {/* ============================================================= */}
      {/* STATIC ADS - Use 'npx remotion still <id> output.png'         */}
      {/* ============================================================= */}

      {/* Instagram Post (1080x1080) */}
      <Still
        id="StaticAd-Instagram-Post"
        component={StaticAd}
        width={AD_SIZES.instagram_post.width}
        height={AD_SIZES.instagram_post.height}
        defaultProps={staticAdDefaultProps}
      />

      {/* Instagram Story (1080x1920) */}
      <Still
        id="StaticAd-Instagram-Story"
        component={StaticAd}
        width={AD_SIZES.instagram_story.width}
        height={AD_SIZES.instagram_story.height}
        defaultProps={staticAdDefaultProps}
      />

      {/* Facebook Post (1200x630) */}
      <Still
        id="StaticAd-Facebook-Post"
        component={StaticAd}
        width={AD_SIZES.facebook_post.width}
        height={AD_SIZES.facebook_post.height}
        defaultProps={staticAdDefaultProps}
      />

      {/* Twitter/X Post (1200x675) */}
      <Still
        id="StaticAd-Twitter-Post"
        component={StaticAd}
        width={AD_SIZES.twitter_post.width}
        height={AD_SIZES.twitter_post.height}
        defaultProps={staticAdDefaultProps}
      />

      {/* LinkedIn Post (1200x627) */}
      <Still
        id="StaticAd-LinkedIn-Post"
        component={StaticAd}
        width={AD_SIZES.linkedin_post.width}
        height={AD_SIZES.linkedin_post.height}
        defaultProps={staticAdDefaultProps}
      />

      {/* Medium Rectangle Display Ad (300x250) */}
      <Still
        id="StaticAd-Medium-Rectangle"
        component={StaticAd}
        width={AD_SIZES.medium_rectangle.width}
        height={AD_SIZES.medium_rectangle.height}
        defaultProps={{...staticAdDefaultProps, headlineSize: 24, subheadlineSize: 12}}
      />

      {/* Leaderboard Display Ad (728x90) */}
      <Still
        id="StaticAd-Leaderboard"
        component={StaticAd}
        width={AD_SIZES.leaderboard.width}
        height={AD_SIZES.leaderboard.height}
        defaultProps={{...staticAdDefaultProps, headlineSize: 20, subheadlineSize: 12, layout: 'left'}}
      />

      {/* Sale Ad - Instagram Post */}
      <Still
        id="SaleAd-Instagram-Post"
        component={SaleAd}
        width={AD_SIZES.instagram_post.width}
        height={AD_SIZES.instagram_post.height}
        defaultProps={{
          ...staticAdDefaultProps,
          salePercentage: '50%',
          headline: 'Summer Sale',
          ctaText: 'Shop Now',
        }}
      />

      {/* Product Showcase - Instagram Post */}
      <Still
        id="ProductAd-Instagram-Post"
        component={ProductShowcaseAd}
        width={AD_SIZES.instagram_post.width}
        height={AD_SIZES.instagram_post.height}
        defaultProps={{
          ...staticAdDefaultProps,
          productName: 'Product Name',
          price: '$99.99',
          discount: '$149.99',
          ctaText: 'Buy Now',
        }}
      />

      {/* Testimonial Ad - Instagram Post */}
      <Still
        id="TestimonialAd-Instagram-Post"
        component={TestimonialAd}
        width={AD_SIZES.instagram_post.width}
        height={AD_SIZES.instagram_post.height}
        defaultProps={{
          ...staticAdDefaultProps,
          quote: 'This product changed my life! Highly recommend.',
          authorName: 'Jane Doe',
          authorTitle: 'Verified Customer',
          rating: 5,
        }}
      />

      {/* Event Ad - Instagram Story */}
      <Still
        id="EventAd-Instagram-Story"
        component={EventAd}
        width={AD_SIZES.instagram_story.width}
        height={AD_SIZES.instagram_story.height}
        defaultProps={{
          ...staticAdDefaultProps,
          headline: 'Product Launch',
          eventDate: 'January 15, 2026',
          eventTime: '7:00 PM EST',
          eventLocation: 'Virtual Event',
          ctaText: 'Register Now',
        }}
      />

      {/* ============================================================= */}
      {/* AD TEMPLATE DSL - AI-Powered Template System                  */}
      {/* Use 'npx remotion still <id> output.png --props=<json>'      */}
      {/* ============================================================= */}

      {/* AdTemplate - Instagram Square (1080x1080) */}
      <Still
        id="AdTemplate-Square"
        component={AdTemplateStill}
        width={AD_CANVAS_PRESETS.instagram_square.width}
        height={AD_CANVAS_PRESETS.instagram_square.height}
        defaultProps={defaultAdTemplateStillProps}
      />

      {/* AdTemplate - Instagram Story (1080x1920) */}
      <Still
        id="AdTemplate-Story"
        component={AdTemplateStill}
        width={AD_CANVAS_PRESETS.instagram_story.width}
        height={AD_CANVAS_PRESETS.instagram_story.height}
        defaultProps={defaultAdTemplateStillProps}
      />

      {/* AdTemplate - Facebook Post (1200x630) */}
      <Still
        id="AdTemplate-Landscape"
        component={AdTemplateStill}
        width={AD_CANVAS_PRESETS.facebook_post.width}
        height={AD_CANVAS_PRESETS.facebook_post.height}
        defaultProps={defaultAdTemplateStillProps}
      />

      {/* ============================================================= */}
      {/* EVERREACH ADS - Meta Platform Static Ads                      */}
      {/* Use 'npx remotion still <id> output.png'                      */}
      {/* ============================================================= */}

      {/* EverReach - Instagram Post (1080x1080) */}
      <Still
        id="EverReach-Instagram-Post"
        component={EverReachAd}
        width={META_AD_SIZES.instagram_post.width}
        height={META_AD_SIZES.instagram_post.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach - Instagram Story (1080x1920) */}
      <Still
        id="EverReach-Instagram-Story"
        component={EverReachAd}
        width={META_AD_SIZES.instagram_story.width}
        height={META_AD_SIZES.instagram_story.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach - Facebook Post (1200x630) */}
      <Still
        id="EverReach-Facebook-Post"
        component={EverReachAd}
        width={META_AD_SIZES.facebook_post.width}
        height={META_AD_SIZES.facebook_post.height}
        defaultProps={{...everReachAdDefaultProps, headlineSize: 42}}
      />

      {/* EverReach - Facebook Story (1080x1920) */}
      <Still
        id="EverReach-Facebook-Story"
        component={EverReachAd}
        width={META_AD_SIZES.facebook_story.width}
        height={META_AD_SIZES.facebook_story.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach Pain Point Ad - Instagram Post */}
      <Still
        id="EverReach-PainPoint-Instagram"
        component={PainPointAd}
        width={META_AD_SIZES.instagram_post.width}
        height={META_AD_SIZES.instagram_post.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach Listicle Ad - Instagram Post */}
      <Still
        id="EverReach-Listicle-Instagram"
        component={ListicleAd}
        width={META_AD_SIZES.instagram_post.width}
        height={META_AD_SIZES.instagram_post.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach Comparison Ad - Instagram Post */}
      <Still
        id="EverReach-Comparison-Instagram"
        component={ComparisonAd}
        width={META_AD_SIZES.instagram_post.width}
        height={META_AD_SIZES.instagram_post.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach Stat Ad - Instagram Post */}
      <Still
        id="EverReach-Stat-Instagram"
        component={StatAd}
        width={META_AD_SIZES.instagram_post.width}
        height={META_AD_SIZES.instagram_post.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach Question Ad - Instagram Post */}
      <Still
        id="EverReach-Question-Instagram"
        component={QuestionAd}
        width={META_AD_SIZES.instagram_post.width}
        height={META_AD_SIZES.instagram_post.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach Objection Killer Ad - Instagram Post */}
      <Still
        id="EverReach-Objections-Instagram"
        component={ObjectionKillerAd}
        width={META_AD_SIZES.instagram_post.width}
        height={META_AD_SIZES.instagram_post.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach Pain Point Ad - Instagram Story */}
      <Still
        id="EverReach-PainPoint-Story"
        component={PainPointAd}
        width={META_AD_SIZES.instagram_story.width}
        height={META_AD_SIZES.instagram_story.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* EverReach Listicle Ad - Instagram Story */}
      <Still
        id="EverReach-Listicle-Story"
        component={ListicleAd}
        width={META_AD_SIZES.instagram_story.width}
        height={META_AD_SIZES.instagram_story.height}
        defaultProps={everReachAdDefaultProps}
      />

      {/* ============================================================= */}
      {/* STRIPE PRICING VIDEO - BlankLogo Products & Prices            */}
      {/* ============================================================= */}

      {/* Stripe Pricing - 16:9 Landscape */}
      <Composition
        id="StripePricing"
        component={StripePricing}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={stripePricingDefaultProps}
      />

      {/* Stripe Pricing - 9:16 Vertical (Stories/Reels) */}
      <Composition
        id="StripePricing-Vertical"
        component={StripePricing}
        durationInFrames={480}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={stripePricingDefaultProps}
      />

      {/* Stripe Pricing - 1:1 Square (Instagram/Social) */}
      <Composition
        id="StripePricing-Square"
        component={StripePricing}
        durationInFrames={480}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={stripePricingDefaultProps}
      />

      {/* ============================================================= */}
      {/* STRIPE PRICING STILLS - Static Images                         */}
      {/* ============================================================= */}

      {/* Stripe Pricing Still - 16:9 Landscape */}
      <Still
        id="StripePricing-Still"
        component={StripePricing}
        width={1920}
        height={1080}
        defaultProps={stripePricingDefaultProps}
      />

      {/* Stripe Pricing Still - 9:16 Vertical */}
      <Still
        id="StripePricing-Still-Vertical"
        component={StripePricing}
        width={1080}
        height={1920}
        defaultProps={stripePricingDefaultProps}
      />

      {/* Stripe Pricing Still - 1:1 Square */}
      <Still
        id="StripePricing-Still-Square"
        component={StripePricing}
        width={1080}
        height={1080}
        defaultProps={stripePricingDefaultProps}
      />

      {/* ============================================================= */}
      {/* STRIPE PRODUCT CARDS - Individual product images (1200x630)   */}
      {/* ============================================================= */}

      {/* Subscription Plans */}
      <Still
        id="StripeProduct-Starter"
        component={StripeProductCard}
        width={1080}
        height={1080}
        defaultProps={STRIPE_PRODUCTS.price_starter}
      />

      <Still
        id="StripeProduct-Pro"
        component={StripeProductCard}
        width={1080}
        height={1080}
        defaultProps={STRIPE_PRODUCTS.price_pro}
      />

      <Still
        id="StripeProduct-Business"
        component={StripeProductCard}
        width={1080}
        height={1080}
        defaultProps={STRIPE_PRODUCTS.price_business}
      />

      {/* Credit Packs */}
      <Still
        id="StripeProduct-Pack10"
        component={StripeProductCard}
        width={1080}
        height={1080}
        defaultProps={STRIPE_PRODUCTS.price_pack_10}
      />

      <Still
        id="StripeProduct-Pack25"
        component={StripeProductCard}
        width={1080}
        height={1080}
        defaultProps={STRIPE_PRODUCTS.price_pack_25}
      />

      <Still
        id="StripeProduct-Pack50"
        component={StripeProductCard}
        width={1080}
        height={1080}
        defaultProps={STRIPE_PRODUCTS.price_pack_50}
      />

      <Still
        id="StripeProduct-Pack100"
        component={StripeProductCard}
        width={1080}
        height={1080}
        defaultProps={STRIPE_PRODUCTS.price_pack_100}
      />

      {/* ============================================================= */}
      {/* BLANKLOGO STATIC ADS - Watermark Removal Tool Marketing       */}
      {/* Templates: BeforeAfter, ThreeSteps, Comparison, UIProof, Receipt */}
      {/* ============================================================= */}

      {/* Before/After Split - Instagram Post */}
      <Composition
        id="BlankLogo-BeforeAfter-Post"
        component={BeforeAfterSplit}
        durationInFrames={120}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={beforeAfterSplitDefaultProps}
      />

      {/* Before/After Split - Instagram Story */}
      <Composition
        id="BlankLogo-BeforeAfter-Story"
        component={BeforeAfterSplit}
        durationInFrames={120}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={beforeAfterSplitDefaultProps}
      />

      {/* Before/After Split - Facebook Post */}
      <Composition
        id="BlankLogo-BeforeAfter-Facebook"
        component={BeforeAfterSplit}
        durationInFrames={120}
        fps={30}
        width={BLANKLOGO_AD_SIZES.facebook_post.width}
        height={BLANKLOGO_AD_SIZES.facebook_post.height}
        defaultProps={{...beforeAfterSplitDefaultProps, headlineSize: 36}}
      />

      {/* Three Steps - Instagram Post */}
      <Composition
        id="BlankLogo-ThreeSteps-Post"
        component={ThreeSteps}
        durationInFrames={120}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={threeStepsDefaultProps}
      />

      {/* Three Steps - Instagram Story (vertical layout) */}
      <Composition
        id="BlankLogo-ThreeSteps-Story"
        component={ThreeSteps}
        durationInFrames={120}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{...threeStepsDefaultProps, layout: 'vertical'}}
      />

      {/* Comparison Card - Instagram Post */}
      <Composition
        id="BlankLogo-Comparison-Post"
        component={ComparisonCard}
        durationInFrames={120}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={comparisonCardDefaultProps}
      />

      {/* Comparison Card - Instagram Story (stacked layout) */}
      <Composition
        id="BlankLogo-Comparison-Story"
        component={ComparisonCard}
        durationInFrames={120}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{...comparisonCardDefaultProps, layout: 'stacked'}}
      />

      {/* UI Proof - Instagram Post */}
      <Composition
        id="BlankLogo-UIProof-Post"
        component={UIProof}
        durationInFrames={120}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={uiProofDefaultProps}
      />

      {/* UI Proof - Instagram Story */}
      <Composition
        id="BlankLogo-UIProof-Story"
        component={UIProof}
        durationInFrames={120}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={uiProofDefaultProps}
      />

      {/* Receipt Proof - Instagram Post */}
      <Composition
        id="BlankLogo-Receipt-Post"
        component={ReceiptProof}
        durationInFrames={150}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={receiptProofDefaultProps}
      />

      {/* Receipt Proof - Instagram Story */}
      <Composition
        id="BlankLogo-Receipt-Story"
        component={ReceiptProof}
        durationInFrames={150}
        fps={30}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={receiptProofDefaultProps}
      />

      {/* ============================================================= */}
      {/* BLANKLOGO STILLS - Static Images for Meta Ads                 */}
      {/* ============================================================= */}

      {/* Before/After Still - Instagram Post */}
      <Still
        id="BlankLogo-BeforeAfter-Still"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={beforeAfterSplitDefaultProps}
      />

      {/* Three Steps Still - Instagram Post */}
      <Still
        id="BlankLogo-ThreeSteps-Still"
        component={ThreeSteps}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={threeStepsDefaultProps}
      />

      {/* Comparison Still - Instagram Post */}
      <Still
        id="BlankLogo-Comparison-Still"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={comparisonCardDefaultProps}
      />

      {/* UI Proof Still - Instagram Post */}
      <Still
        id="BlankLogo-UIProof-Still"
        component={UIProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={uiProofDefaultProps}
      />

      {/* Receipt Proof Still - Instagram Post */}
      <Still
        id="BlankLogo-Receipt-Still"
        component={ReceiptProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={receiptProofDefaultProps}
      />

      {/* ============================================================= */}
      {/* BLANKLOGO PROBLEM-AWARE STATIC AD - 4:5 Feed Format           */}
      {/* "Downloaded video → watermark ruined → clean export"          */}
      {/* ============================================================= */}

      {/* Problem-Aware Static Ad - 4:5 Feed (1080x1350) - PRIMARY - Video 1 */}
      <Still
        id="BlankLogo-ProblemAware-Feed"
        component={ProblemAwareStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...problemAwareStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video1-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video1-after-frame.png'),
        }}
      />

      {/* Problem-Aware Static Ad - 1:1 Square (1080x1080) - Video 1 */}
      <Still
        id="BlankLogo-ProblemAware-Square"
        component={ProblemAwareStaticAd}
        width={1080}
        height={1080}
        defaultProps={{
          ...problemAwareStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video1-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video1-after-frame.png'),
        }}
      />

      {/* Problem-Aware Static Ad - Video 2 variant */}
      <Still
        id="BlankLogo-ProblemAware-V2"
        component={ProblemAwareStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...problemAwareStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video2-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video2-after-frame.png'),
        }}
      />

      {/* Problem-Aware Static Ad - Video 3 variant */}
      <Still
        id="BlankLogo-ProblemAware-V3"
        component={ProblemAwareStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...problemAwareStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video3-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video3-after-frame.png'),
        }}
      />

      {/* Problem-Aware Static Ad - Alternate Copy: "Skip the blurry fixes" - Video 1 */}
      <Still
        id="BlankLogo-ProblemAware-Alt1"
        component={ProblemAwareStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...problemAwareStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video1-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video1-after-frame.png'),
          mostToolsLine: 'blur • re-encode • spammy workflow',
          blankLogoLine: 'Skip the blurry fixes. Clean export, quality kept.',
        }}
      />

      {/* Problem-Aware Static Ad - Alternate Copy: "Not another sketchy tool" - Video 2 */}
      <Still
        id="BlankLogo-ProblemAware-Alt2"
        component={ProblemAwareStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...problemAwareStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video2-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video2-after-frame.png'),
          mostToolsLine: 'blur • re-encode • spammy workflow',
          blankLogoLine: 'Not another sketchy tool. Clean workflow, predictable output.',
        }}
      />

      {/* Problem-Aware Static Ad - UGC/Deliverable angle - Video 3 */}
      <Still
        id="BlankLogo-ProblemAware-UGC"
        component={ProblemAwareStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...problemAwareStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video3-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video3-after-frame.png'),
          mostToolsLine: 'blur • re-encode • spammy workflow',
          blankLogoLine: 'Deliverable-ready. For UGC, brands, and reposting.',
        }}
      />

      {/* ============================================================= */}
      {/* BLANKLOGO LISTICLE STATIC AD - "5 Reasons" Format             */}
      {/* Problem-aware with competitive positioning                    */}
      {/* ============================================================= */}

      {/* Listicle Static Ad - 4:5 Feed (1080x1350) - Video 1 */}
      <Still
        id="BlankLogo-Listicle-Feed"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video1-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video1-after-frame.png'),
        }}
      />

      {/* Listicle Static Ad - Video 2 */}
      <Still
        id="BlankLogo-Listicle-V2"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video2-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video2-after-frame.png'),
        }}
      />

      {/* Listicle Static Ad - Video 3 */}
      <Still
        id="BlankLogo-Listicle-V3"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video3-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video3-after-frame.png'),
        }}
      />

      {/* Listicle - UGC/Deliverable Angle */}
      <Still
        id="BlankLogo-Listicle-UGC"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          headline: 'Need a clean deliverable?',
          subheadline: 'For brands, clients, and UGC.',
          bullets: [
            'Client-ready exports',
            'Keep original framing',
            'Fast turnaround',
            'Crop or AI inpaint',
            'Credit-based pricing',
          ],
          beforeImageSrc: staticFile('blanklogo/video1-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video1-after-frame.png'),
        }}
      />

      {/* Listicle - Quality/Framing Angle */}
      <Still
        id="BlankLogo-Listicle-Quality"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          headline: 'Tired of wrecked framing?',
          subheadline: 'No blur. No smudge. Clean output.',
          bullets: [
            'No blur or smudge',
            'Preserve your framing',
            'Fast Crop option',
            'Predictable output',
            'Built for AI clips',
          ],
          beforeImageSrc: staticFile('blanklogo/video2-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video2-after-frame.png'),
        }}
      />

      {/* Listicle - No Before/After (text-focused) */}
      <Still
        id="BlankLogo-Listicle-TextOnly"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          showBeforeAfter: false,
        }}
      />

      {/* Listicle Static Ad - Video 4 (landscape) */}
      <Still
        id="BlankLogo-Listicle-V4"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video4-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video4-after-frame.png'),
        }}
      />

      {/* Listicle Static Ad - Video 5 */}
      <Still
        id="BlankLogo-Listicle-V5"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video5-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video5-after-frame.png'),
        }}
      />

      {/* Listicle Static Ad - Video 6 */}
      <Still
        id="BlankLogo-Listicle-V6"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video6-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video6-after-frame.png'),
        }}
      />

      {/* Listicle Static Ad - Video 7 */}
      <Still
        id="BlankLogo-Listicle-V7"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video7-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video7-after-frame.png'),
        }}
      />

      {/* Listicle Static Ad - Video 8 */}
      <Still
        id="BlankLogo-Listicle-V8"
        component={ListicleStaticAd}
        width={1080}
        height={1350}
        defaultProps={{
          ...listicleStaticAdDefaultProps,
          beforeImageSrc: staticFile('blanklogo/video8-before-frame.png'),
          afterImageSrc: staticFile('blanklogo/video8-after-frame.png'),
        }}
      />

      {/* ============================================================= */}
      {/* BLANKLOGO AD CONCEPTS - Problem-Aware Variations              */}
      {/* ============================================================= */}

      {/* Problem-Aware: "Watermark ruins the post" */}
      <Still
        id="BlankLogo-PA01-Post"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          headline: AD_CONCEPTS.problem_aware[0].headline,
          subheadline: AD_CONCEPTS.problem_aware[0].subheadline,
          ctaText: AD_CONCEPTS.problem_aware[0].cta,
        }}
      />

      {/* Problem-Aware: "3-step flow" */}
      <Still
        id="BlankLogo-PA05-Post"
        component={ThreeSteps}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...threeStepsDefaultProps,
          headline: AD_CONCEPTS.problem_aware[4].headline,
          subheadline: AD_CONCEPTS.problem_aware[4].subheadline,
          ctaText: AD_CONCEPTS.problem_aware[4].cta,
        }}
      />

      {/* Problem-Aware: "Ad-Free" */}
      <Still
        id="BlankLogo-PA07-Post"
        component={ReceiptProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...receiptProofDefaultProps,
          headline: AD_CONCEPTS.problem_aware[6].headline,
          subheadline: AD_CONCEPTS.problem_aware[6].subheadline,
          ctaText: AD_CONCEPTS.problem_aware[6].cta,
        }}
      />

      {/* ============================================================= */}
      {/* BLANKLOGO AD CONCEPTS - Solution-Aware Variations             */}
      {/* ============================================================= */}

      {/* Solution-Aware: "Finally one that works" */}
      <Still
        id="BlankLogo-SA01-Post"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: AD_CONCEPTS.solution_aware[0].headline,
          subheadline: AD_CONCEPTS.solution_aware[0].subheadline,
          ctaText: AD_CONCEPTS.solution_aware[0].cta,
        }}
      />

      {/* Solution-Aware: "No Silent Failures" */}
      <Still
        id="BlankLogo-SA05-Post"
        component={UIProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...uiProofDefaultProps,
          headline: AD_CONCEPTS.solution_aware[4].headline,
          subheadline: AD_CONCEPTS.solution_aware[4].subheadline,
          ctaText: AD_CONCEPTS.solution_aware[4].cta,
        }}
      />

      {/* Solution-Aware: "Premium Watermark Removal" */}
      <Still
        id="BlankLogo-SA06-Post"
        component={ReceiptProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...receiptProofDefaultProps,
          headline: AD_CONCEPTS.solution_aware[5].headline,
          subheadline: AD_CONCEPTS.solution_aware[5].subheadline,
          ctaText: AD_CONCEPTS.solution_aware[5].cta,
        }}
      />

      {/* Solution-Aware: "Built to Avoid the Usual Problems" */}
      <Still
        id="BlankLogo-SA10-Post"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: AD_CONCEPTS.solution_aware[9].headline,
          subheadline: AD_CONCEPTS.solution_aware[9].subheadline,
          ctaText: AD_CONCEPTS.solution_aware[9].cta,
        }}
      />

      {/* ============================================================= */}
      {/* META 12-AD LAUNCH SET - Template A: Before/After (4 ads)      */}
      {/* ============================================================= */}

      {/* A1_PA: Watermark ruins it / Fix it fast */}
      <Still
        id="Meta-A1-BeforeAfter-Post"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          headline: META_LAUNCH_BEFORE_AFTER[0].headline,
          subheadline: META_LAUNCH_BEFORE_AFTER[0].primaryText,
          ctaText: META_LAUNCH_BEFORE_AFTER[0].cta,
        }}
      />
      <Still
        id="Meta-A1-BeforeAfter-Story"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          headline: META_LAUNCH_BEFORE_AFTER[0].headline,
          subheadline: META_LAUNCH_BEFORE_AFTER[0].primaryText,
          ctaText: META_LAUNCH_BEFORE_AFTER[0].cta,
        }}
      />

      {/* A2_PA: Posting today? / Lose the watermark */}
      <Still
        id="Meta-A2-BeforeAfter-Post"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          headline: META_LAUNCH_BEFORE_AFTER[1].headline,
          subheadline: META_LAUNCH_BEFORE_AFTER[1].primaryText,
          ctaText: META_LAUNCH_BEFORE_AFTER[1].cta,
        }}
      />
      <Still
        id="Meta-A2-BeforeAfter-Story"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          headline: META_LAUNCH_BEFORE_AFTER[1].headline,
          subheadline: META_LAUNCH_BEFORE_AFTER[1].primaryText,
          ctaText: META_LAUNCH_BEFORE_AFTER[1].cta,
        }}
      />

      {/* A3_SA: Tried other sites? / Stop getting blurry */}
      <Still
        id="Meta-A3-BeforeAfter-Post"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          headline: META_LAUNCH_BEFORE_AFTER[2].headline,
          subheadline: META_LAUNCH_BEFORE_AFTER[2].primaryText,
          ctaText: META_LAUNCH_BEFORE_AFTER[2].cta,
        }}
      />
      <Still
        id="Meta-A3-BeforeAfter-Story"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          headline: META_LAUNCH_BEFORE_AFTER[2].headline,
          subheadline: META_LAUNCH_BEFORE_AFTER[2].primaryText,
          ctaText: META_LAUNCH_BEFORE_AFTER[2].cta,
        }}
      />

      {/* A4_SA: No HD bait-and-switch / Quality preserved */}
      <Still
        id="Meta-A4-BeforeAfter-Post"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          headline: META_LAUNCH_BEFORE_AFTER[3].headline,
          subheadline: META_LAUNCH_BEFORE_AFTER[3].primaryText,
          ctaText: META_LAUNCH_BEFORE_AFTER[3].cta,
        }}
      />
      <Still
        id="Meta-A4-BeforeAfter-Story"
        component={BeforeAfterSplit}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          headline: META_LAUNCH_BEFORE_AFTER[3].headline,
          subheadline: META_LAUNCH_BEFORE_AFTER[3].primaryText,
          ctaText: META_LAUNCH_BEFORE_AFTER[3].cta,
        }}
      />

      {/* ============================================================= */}
      {/* META 12-AD LAUNCH SET - Template B: Comparison (4 ads)        */}
      {/* ============================================================= */}

      {/* B1_SA: Typical sites vs BlankLogo - Premium Utility */}
      <Still
        id="Meta-B1-Comparison-Post"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: META_LAUNCH_COMPARISON[0].headline,
          subheadline: META_LAUNCH_COMPARISON[0].primaryText,
          ctaText: META_LAUNCH_COMPARISON[0].cta,
          leftItems: META_LAUNCH_COMPARISON[0].leftBullets,
          rightItems: META_LAUNCH_COMPARISON[0].rightBullets,
        }}
      />
      <Still
        id="Meta-B1-Comparison-Story"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: META_LAUNCH_COMPARISON[0].headline,
          subheadline: META_LAUNCH_COMPARISON[0].primaryText,
          ctaText: META_LAUNCH_COMPARISON[0].cta,
          leftItems: META_LAUNCH_COMPARISON[0].leftBullets,
          rightItems: META_LAUNCH_COMPARISON[0].rightBullets,
          layout: 'stacked',
        }}
      />

      {/* B2_SA: Ad-Free Removal */}
      <Still
        id="Meta-B2-Comparison-Post"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: META_LAUNCH_COMPARISON[1].headline,
          subheadline: META_LAUNCH_COMPARISON[1].primaryText,
          ctaText: META_LAUNCH_COMPARISON[1].cta,
          leftItems: META_LAUNCH_COMPARISON[1].leftBullets,
          rightItems: META_LAUNCH_COMPARISON[1].rightBullets,
        }}
      />
      <Still
        id="Meta-B2-Comparison-Story"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: META_LAUNCH_COMPARISON[1].headline,
          subheadline: META_LAUNCH_COMPARISON[1].primaryText,
          ctaText: META_LAUNCH_COMPARISON[1].cta,
          leftItems: META_LAUNCH_COMPARISON[1].leftBullets,
          rightItems: META_LAUNCH_COMPARISON[1].rightBullets,
          layout: 'stacked',
        }}
      />

      {/* B3_PA: Fast Fix */}
      <Still
        id="Meta-B3-Comparison-Post"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: META_LAUNCH_COMPARISON[2].headline,
          subheadline: META_LAUNCH_COMPARISON[2].primaryText,
          ctaText: META_LAUNCH_COMPARISON[2].cta,
          leftItems: META_LAUNCH_COMPARISON[2].leftBullets,
          rightItems: META_LAUNCH_COMPARISON[2].rightBullets,
        }}
      />
      <Still
        id="Meta-B3-Comparison-Story"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: META_LAUNCH_COMPARISON[2].headline,
          subheadline: META_LAUNCH_COMPARISON[2].primaryText,
          ctaText: META_LAUNCH_COMPARISON[2].cta,
          leftItems: META_LAUNCH_COMPARISON[2].leftBullets,
          rightItems: META_LAUNCH_COMPARISON[2].rightBullets,
          layout: 'stacked',
        }}
      />

      {/* B4_SA: Reliable Workflow */}
      <Still
        id="Meta-B4-Comparison-Post"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: META_LAUNCH_COMPARISON[3].headline,
          subheadline: META_LAUNCH_COMPARISON[3].primaryText,
          ctaText: META_LAUNCH_COMPARISON[3].cta,
          leftItems: META_LAUNCH_COMPARISON[3].leftBullets,
          rightItems: META_LAUNCH_COMPARISON[3].rightBullets,
        }}
      />
      <Still
        id="Meta-B4-Comparison-Story"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: META_LAUNCH_COMPARISON[3].headline,
          subheadline: META_LAUNCH_COMPARISON[3].primaryText,
          ctaText: META_LAUNCH_COMPARISON[3].cta,
          leftItems: META_LAUNCH_COMPARISON[3].leftBullets,
          rightItems: META_LAUNCH_COMPARISON[3].rightBullets,
          layout: 'stacked',
        }}
      />

      {/* ============================================================= */}
      {/* META 12-AD LAUNCH SET - Template C: UI/Flow (4 ads)           */}
      {/* ============================================================= */}

      {/* C1_PA: Upload → Remove → Download (ThreeSteps) */}
      <Still
        id="Meta-C1-ThreeSteps-Post"
        component={ThreeSteps}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...threeStepsDefaultProps,
          headline: META_LAUNCH_UI_FLOW[0].headline,
          subheadline: META_LAUNCH_UI_FLOW[0].primaryText,
          ctaText: META_LAUNCH_UI_FLOW[0].cta,
        }}
      />
      <Still
        id="Meta-C1-ThreeSteps-Story"
        component={ThreeSteps}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...threeStepsDefaultProps,
          headline: META_LAUNCH_UI_FLOW[0].headline,
          subheadline: META_LAUNCH_UI_FLOW[0].primaryText,
          ctaText: META_LAUNCH_UI_FLOW[0].cta,
          layout: 'vertical',
        }}
      />

      {/* C2_PA: Processing… Done. (UIProof) */}
      <Still
        id="Meta-C2-UIProof-Post"
        component={UIProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...uiProofDefaultProps,
          headline: META_LAUNCH_UI_FLOW[1].headline,
          subheadline: META_LAUNCH_UI_FLOW[1].primaryText,
          ctaText: META_LAUNCH_UI_FLOW[1].cta,
        }}
      />
      <Still
        id="Meta-C2-UIProof-Story"
        component={UIProof}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...uiProofDefaultProps,
          headline: META_LAUNCH_UI_FLOW[1].headline,
          subheadline: META_LAUNCH_UI_FLOW[1].primaryText,
          ctaText: META_LAUNCH_UI_FLOW[1].cta,
        }}
      />

      {/* C3_SA: Skip the ad spam (UIProof) */}
      <Still
        id="Meta-C3-UIProof-Post"
        component={UIProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...uiProofDefaultProps,
          headline: META_LAUNCH_UI_FLOW[2].headline,
          subheadline: META_LAUNCH_UI_FLOW[2].primaryText,
          ctaText: META_LAUNCH_UI_FLOW[2].cta,
        }}
      />
      <Still
        id="Meta-C3-UIProof-Story"
        component={UIProof}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...uiProofDefaultProps,
          headline: META_LAUNCH_UI_FLOW[2].headline,
          subheadline: META_LAUNCH_UI_FLOW[2].primaryText,
          ctaText: META_LAUNCH_UI_FLOW[2].cta,
        }}
      />

      {/* C4_RT: 10 free credits (ReceiptProof) */}
      <Still
        id="Meta-C4-Receipt-Post"
        component={ReceiptProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...receiptProofDefaultProps,
          headline: META_LAUNCH_UI_FLOW[3].headline,
          subheadline: META_LAUNCH_UI_FLOW[3].primaryText,
          ctaText: META_LAUNCH_UI_FLOW[3].cta,
        }}
      />
      <Still
        id="Meta-C4-Receipt-Story"
        component={ReceiptProof}
        width={BLANKLOGO_AD_SIZES.instagram_story.width}
        height={BLANKLOGO_AD_SIZES.instagram_story.height}
        defaultProps={{
          ...receiptProofDefaultProps,
          headline: META_LAUNCH_UI_FLOW[3].headline,
          subheadline: META_LAUNCH_UI_FLOW[3].primaryText,
          ctaText: META_LAUNCH_UI_FLOW[3].cta,
        }}
      />

      {/* ============================================================= */}
      {/* RETARGETING ADS (for site visitors who didn't convert)        */}
      {/* ============================================================= */}

      {/* RT_01: Job fails? Credit refunded. */}
      <Still
        id="Meta-RT1-Receipt-Post"
        component={ReceiptProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...receiptProofDefaultProps,
          headline: RETARGETING_ADS[0].headline,
          subheadline: RETARGETING_ADS[0].primaryText,
          ctaText: RETARGETING_ADS[0].cta,
        }}
      />

      {/* RT_02: 10 free credits */}
      <Still
        id="Meta-RT2-UIProof-Post"
        component={UIProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...uiProofDefaultProps,
          headline: RETARGETING_ADS[1].headline,
          subheadline: RETARGETING_ADS[1].primaryText,
          ctaText: RETARGETING_ADS[1].cta,
        }}
      />

      {/* RT_03: Pick the right mode */}
      <Still
        id="Meta-RT3-Comparison-Post"
        component={ComparisonCard}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...comparisonCardDefaultProps,
          headline: RETARGETING_ADS[2].headline,
          subheadline: RETARGETING_ADS[2].primaryText,
          ctaText: RETARGETING_ADS[2].cta,
          leftTitle: 'Edge watermark?',
          rightTitle: 'Overlap?',
          leftItems: ['Use Crop', 'Fast processing'],
          rightItems: ['Use Inpaint', 'AI fill'],
        }}
      />

      {/* RT_04: Supported Platforms */}
      <Still
        id="Meta-RT4-UIProof-Post"
        component={UIProof}
        width={BLANKLOGO_AD_SIZES.instagram_post.width}
        height={BLANKLOGO_AD_SIZES.instagram_post.height}
        defaultProps={{
          ...uiProofDefaultProps,
          headline: RETARGETING_ADS[3].headline,
          subheadline: RETARGETING_ADS[3].primaryText,
          ctaText: RETARGETING_ADS[3].cta,
        }}
      />

      {/* ========================================== */}
      {/* BlankLogo Before/After Video Ads          */}
      {/* ========================================== */}

      {/* Video Ad - 16:9 (Horizontal/Landscape) */}
      <Composition
        id="BlankLogo-BeforeAfter-Video-16x9"
        component={BeforeAfterVideo}
        durationInFrames={300}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          beforeVideoSrc: staticFile('blanklogo/before.mp4'),
          afterVideoSrc: staticFile('blanklogo/after.mp4'),
          beforeStartFrame: 120,
          afterStartFrame: 120,
          beforeDuration: 90,
          afterDuration: 90,
          headline: 'Remove Watermarks Fast',
          subheadline: 'Upload → Clean Export → Download',
          badge: 'Ad-Free',
          cta: 'Try Free',
                    aspectRatio: '16:9' as const,
        }}
      />

      {/* Video Ad - 9:16 (Reels/Stories) */}
      <Composition
        id="BlankLogo-BeforeAfter-Video-9x16"
        component={BeforeAfterVideo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          beforeVideoSrc: staticFile('blanklogo/before.mp4'),
          afterVideoSrc: staticFile('blanklogo/after.mp4'),
          beforeStartFrame: 120,
          afterStartFrame: 120,
          beforeDuration: 90,
          afterDuration: 90,
          headline: 'Remove Watermarks Fast',
          subheadline: 'Upload → Clean Export → Download',
          badge: 'Ad-Free',
          cta: 'Try Free',
                    aspectRatio: '9:16' as const,
        }}
      />

      {/* Video Ad - 4:5 (Feed) */}
      <Composition
        id="BlankLogo-BeforeAfter-Video-4x5"
        component={BeforeAfterVideo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1350}
        defaultProps={{
          beforeVideoSrc: staticFile('blanklogo/before.mp4'),
          afterVideoSrc: staticFile('blanklogo/after.mp4'),
          beforeStartFrame: 120,
          afterStartFrame: 120,
          beforeDuration: 90,
          afterDuration: 90,
          headline: 'Remove Watermarks Fast',
          subheadline: 'Upload → Clean Export → Download',
          badge: 'Ad-Free',
          cta: 'Try Free',
                    aspectRatio: '4:5' as const,
        }}
      />

      {/* Video Ad - 1:1 (Square) */}
      <Composition
        id="BlankLogo-BeforeAfter-Video-1x1"
        component={BeforeAfterVideo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          beforeVideoSrc: staticFile('blanklogo/before.mp4'),
          afterVideoSrc: staticFile('blanklogo/after.mp4'),
          beforeStartFrame: 120,
          afterStartFrame: 120,
          beforeDuration: 90,
          afterDuration: 90,
          headline: 'Remove Watermarks Fast',
          subheadline: 'Upload → Clean Export → Download',
          badge: 'Ad-Free',
          cta: 'Try Free',
                    aspectRatio: '1:1' as const,
        }}
      />

      {/* ========================================== */}
      {/* 12-Ad Premium Video Matrix (16:9)         */}
      {/* ========================================== */}

      {/* Problem-Aware Videos - 16:9 */}
      {VIDEO_AD_COPY.problemAware.map((ad) => (
        <Composition
          key={ad.id}
          id={`BlankLogo-Video-${ad.id}`}
          component={BeforeAfterVideo}
          durationInFrames={300}
          fps={30}
          width={1280}
          height={720}
          defaultProps={{
            beforeVideoSrc: staticFile('blanklogo/before.mp4'),
            afterVideoSrc: staticFile('blanklogo/after.mp4'),
            beforeStartFrame: 120,
            afterStartFrame: 120,
            beforeDuration: 90,
            afterDuration: 90,
            headline: ad.headline,
            subheadline: ad.subheadline,
            badge: ad.badge,
            cta: ad.cta,
            underButtonText: ad.underButtonText,
            trustLine: ad.trustLine,
            footerText: ad.footerText,
            beforeSubLabel: ad.beforeSubLabel,
            afterSubLabel: ad.afterSubLabel,
            aspectRatio: '16:9' as const,
          }}
        />
      ))}

      {/* Solution-Aware Videos - 16:9 */}
      {VIDEO_AD_COPY.solutionAware.map((ad) => (
        <Composition
          key={ad.id}
          id={`BlankLogo-Video-${ad.id}`}
          component={BeforeAfterVideo}
          durationInFrames={300}
          fps={30}
          width={1280}
          height={720}
          defaultProps={{
            beforeVideoSrc: staticFile('blanklogo/before.mp4'),
            afterVideoSrc: staticFile('blanklogo/after.mp4'),
            beforeStartFrame: 120,
            afterStartFrame: 120,
            beforeDuration: 90,
            afterDuration: 90,
            headline: ad.headline,
            subheadline: ad.subheadline,
            badge: ad.badge,
            cta: ad.cta,
            underButtonText: ad.underButtonText,
            trustLine: ad.trustLine,
            footerText: ad.footerText,
            beforeSubLabel: ad.beforeSubLabel,
            afterSubLabel: ad.afterSubLabel,
            aspectRatio: '16:9' as const,
          }}
        />
      ))}

      {/* ========================================== */}
      {/* 12-Ad Premium Video Matrix (9:16 Reels)   */}
      {/* ========================================== */}

      {/* Problem-Aware Videos - 9:16 */}
      {VIDEO_AD_COPY.problemAware.map((ad) => (
        <Composition
          key={`${ad.id}-9x16`}
          id={`BlankLogo-Video-${ad.id}-9x16`}
          component={BeforeAfterVideo}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            beforeVideoSrc: staticFile('blanklogo/before.mp4'),
            afterVideoSrc: staticFile('blanklogo/after.mp4'),
            beforeStartFrame: 120,
            afterStartFrame: 120,
            beforeDuration: 90,
            afterDuration: 90,
            headline: ad.headline,
            subheadline: ad.subheadline,
            badge: ad.badge,
            cta: ad.cta,
            underButtonText: ad.underButtonText,
            trustLine: ad.trustLine,
            footerText: ad.footerText,
            beforeSubLabel: ad.beforeSubLabel,
            afterSubLabel: ad.afterSubLabel,
            aspectRatio: '9:16' as const,
          }}
        />
      ))}

      {/* Solution-Aware Videos - 9:16 */}
      {VIDEO_AD_COPY.solutionAware.map((ad) => (
        <Composition
          key={`${ad.id}-9x16`}
          id={`BlankLogo-Video-${ad.id}-9x16`}
          component={BeforeAfterVideo}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            beforeVideoSrc: staticFile('blanklogo/before.mp4'),
            afterVideoSrc: staticFile('blanklogo/after.mp4'),
            beforeStartFrame: 120,
            afterStartFrame: 120,
            beforeDuration: 90,
            afterDuration: 90,
            headline: ad.headline,
            subheadline: ad.subheadline,
            badge: ad.badge,
            cta: ad.cta,
            underButtonText: ad.underButtonText,
            trustLine: ad.trustLine,
            footerText: ad.footerText,
            beforeSubLabel: ad.beforeSubLabel,
            afterSubLabel: ad.afterSubLabel,
            aspectRatio: '9:16' as const,
          }}
        />
      ))}

      {/* ========================================== */}
      {/* 12-Ad Premium Video Matrix (4:5 Feed)     */}
      {/* ========================================== */}

      {/* Problem-Aware Videos - 4:5 */}
      {VIDEO_AD_COPY.problemAware.map((ad) => (
        <Composition
          key={`${ad.id}-4x5`}
          id={`BlankLogo-Video-${ad.id}-4x5`}
          component={BeforeAfterVideo}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1350}
          defaultProps={{
            beforeVideoSrc: staticFile('blanklogo/before.mp4'),
            afterVideoSrc: staticFile('blanklogo/after.mp4'),
            beforeStartFrame: 120,
            afterStartFrame: 120,
            beforeDuration: 90,
            afterDuration: 90,
            headline: ad.headline,
            subheadline: ad.subheadline,
            badge: ad.badge,
            cta: ad.cta,
            underButtonText: ad.underButtonText,
            trustLine: ad.trustLine,
            footerText: ad.footerText,
            beforeSubLabel: ad.beforeSubLabel,
            afterSubLabel: ad.afterSubLabel,
            aspectRatio: '4:5' as const,
          }}
        />
      ))}

      {/* Solution-Aware Videos - 4:5 */}
      {VIDEO_AD_COPY.solutionAware.map((ad) => (
        <Composition
          key={`${ad.id}-4x5`}
          id={`BlankLogo-Video-${ad.id}-4x5`}
          component={BeforeAfterVideo}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1350}
          defaultProps={{
            beforeVideoSrc: staticFile('blanklogo/before.mp4'),
            afterVideoSrc: staticFile('blanklogo/after.mp4'),
            beforeStartFrame: 120,
            afterStartFrame: 120,
            beforeDuration: 90,
            afterDuration: 90,
            headline: ad.headline,
            subheadline: ad.subheadline,
            badge: ad.badge,
            cta: ad.cta,
            underButtonText: ad.underButtonText,
            trustLine: ad.trustLine,
            footerText: ad.footerText,
            beforeSubLabel: ad.beforeSubLabel,
            afterSubLabel: ad.afterSubLabel,
            aspectRatio: '4:5' as const,
          }}
        />
      ))}

      {/* ========================================== */}
      {/* Video Pairs - PA-01 for each video (9:16) */}
      {/* ========================================== */}

      {VIDEO_PAIRS.map((video) => (
        <Composition
          key={`${video.id}-PA01-9x16`}
          id={`BlankLogo-${video.id}-PA01-9x16`}
          component={BeforeAfterVideo}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            beforeVideoSrc: staticFile(video.beforeSrc),
            afterVideoSrc: staticFile(video.afterSrc),
            beforeStartFrame: 60,
            afterStartFrame: 60,
            beforeDuration: 90,
            afterDuration: 90,
            headline: VIDEO_AD_COPY.problemAware[0].headline,
            subheadline: VIDEO_AD_COPY.problemAware[0].subheadline,
            badge: VIDEO_AD_COPY.problemAware[0].badge,
            cta: VIDEO_AD_COPY.problemAware[0].cta,
            underButtonText: VIDEO_AD_COPY.problemAware[0].underButtonText,
            trustLine: VIDEO_AD_COPY.problemAware[0].trustLine,
            footerText: VIDEO_AD_COPY.problemAware[0].footerText,
            beforeSubLabel: VIDEO_AD_COPY.problemAware[0].beforeSubLabel,
            afterSubLabel: VIDEO_AD_COPY.problemAware[0].afterSubLabel,
            aspectRatio: '9:16' as const,
          }}
        />
      ))}

      {/* Video Pairs - PA-01 for each video (4:5) */}
      {VIDEO_PAIRS.map((video) => (
        <Composition
          key={`${video.id}-PA01-4x5`}
          id={`BlankLogo-${video.id}-PA01-4x5`}
          component={BeforeAfterVideo}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1350}
          defaultProps={{
            beforeVideoSrc: staticFile(video.beforeSrc),
            afterVideoSrc: staticFile(video.afterSrc),
            beforeStartFrame: 60,
            afterStartFrame: 60,
            beforeDuration: 90,
            afterDuration: 90,
            headline: VIDEO_AD_COPY.problemAware[0].headline,
            subheadline: VIDEO_AD_COPY.problemAware[0].subheadline,
            badge: VIDEO_AD_COPY.problemAware[0].badge,
            cta: VIDEO_AD_COPY.problemAware[0].cta,
            underButtonText: VIDEO_AD_COPY.problemAware[0].underButtonText,
            trustLine: VIDEO_AD_COPY.problemAware[0].trustLine,
            footerText: VIDEO_AD_COPY.problemAware[0].footerText,
            beforeSubLabel: VIDEO_AD_COPY.problemAware[0].beforeSubLabel,
            afterSubLabel: VIDEO_AD_COPY.problemAware[0].afterSubLabel,
            aspectRatio: '4:5' as const,
          }}
        />
      ))}

      {/* Video Pairs - PA-01 for each video (16:9) */}
      {VIDEO_PAIRS.map((video) => (
        <Composition
          key={`${video.id}-PA01-16x9`}
          id={`BlankLogo-${video.id}-PA01-16x9`}
          component={BeforeAfterVideo}
          durationInFrames={300}
          fps={30}
          width={1280}
          height={720}
          defaultProps={{
            beforeVideoSrc: staticFile(video.beforeSrc),
            afterVideoSrc: staticFile(video.afterSrc),
            beforeStartFrame: 60,
            afterStartFrame: 60,
            beforeDuration: 90,
            afterDuration: 90,
            headline: VIDEO_AD_COPY.problemAware[0].headline,
            subheadline: VIDEO_AD_COPY.problemAware[0].subheadline,
            badge: VIDEO_AD_COPY.problemAware[0].badge,
            cta: VIDEO_AD_COPY.problemAware[0].cta,
            underButtonText: VIDEO_AD_COPY.problemAware[0].underButtonText,
            trustLine: VIDEO_AD_COPY.problemAware[0].trustLine,
            footerText: VIDEO_AD_COPY.problemAware[0].footerText,
            beforeSubLabel: VIDEO_AD_COPY.problemAware[0].beforeSubLabel,
            afterSubLabel: VIDEO_AD_COPY.problemAware[0].afterSubLabel,
            aspectRatio: '16:9' as const,
          }}
        />
      ))}

      {/* ========================================== */}
      {/* Static Ads with Real Video Frames         */}
      {/* ========================================== */}

      {/* Static Before/After - Watermark Ruins It (Post) */}
      <Still
        id="BlankLogo-Static-WatermarkRuins-Post"
        component={BeforeAfterSplit}
        width={1080}
        height={1080}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          beforeImage: staticFile('blanklogo/before-frame.png'),
          afterImage: staticFile('blanklogo/after-frame.png'),
          headline: 'Remove Watermarks Fast',
          subheadline: 'Watermark ruins it. Fix it fast.',
          ctaText: 'Try Free',
          badge: 'Ad-Free',
        }}
      />

      {/* Static Before/After - Watermark Ruins It (Story) */}
      <Still
        id="BlankLogo-Static-WatermarkRuins-Story"
        component={BeforeAfterSplit}
        width={1080}
        height={1920}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          beforeImage: staticFile('blanklogo/before-frame.png'),
          afterImage: staticFile('blanklogo/after-frame.png'),
          headline: 'Remove Watermarks Fast',
          subheadline: 'Watermark ruins it. Fix it fast.',
          ctaText: 'Try Free',
          badge: 'Ad-Free',
        }}
      />

      {/* Static Before/After - Posting Today (Post) */}
      <Still
        id="BlankLogo-Static-PostingToday-Post"
        component={BeforeAfterSplit}
        width={1080}
        height={1080}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          beforeImage: staticFile('blanklogo/before-frame.png'),
          afterImage: staticFile('blanklogo/after-frame.png'),
          headline: 'Ready to Post',
          subheadline: 'Posting today? Lose the watermark.',
          ctaText: 'Upload Video',
          badge: 'HQ Output',
        }}
      />

      {/* Static Before/After - Posting Today (Story) */}
      <Still
        id="BlankLogo-Static-PostingToday-Story"
        component={BeforeAfterSplit}
        width={1080}
        height={1920}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          beforeImage: staticFile('blanklogo/before-frame.png'),
          afterImage: staticFile('blanklogo/after-frame.png'),
          headline: 'Ready to Post',
          subheadline: 'Posting today? Lose the watermark.',
          ctaText: 'Upload Video',
          badge: 'HQ Output',
        }}
      />

      {/* Static Before/After - Quality Preserved (Post) */}
      <Still
        id="BlankLogo-Static-QualityPreserved-Post"
        component={BeforeAfterSplit}
        width={1080}
        height={1080}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          beforeImage: staticFile('blanklogo/before-frame.png'),
          afterImage: staticFile('blanklogo/after-frame.png'),
          headline: 'Quality Preserved',
          subheadline: "No 'HD' bait-and-switch.",
          ctaText: 'Try Free',
          badge: 'No Re-Encode',
        }}
      />

      {/* Static Before/After - Quality Preserved (Story) */}
      <Still
        id="BlankLogo-Static-QualityPreserved-Story"
        component={BeforeAfterSplit}
        width={1080}
        height={1920}
        defaultProps={{
          ...beforeAfterSplitDefaultProps,
          beforeImage: staticFile('blanklogo/before-frame.png'),
          afterImage: staticFile('blanklogo/after-frame.png'),
          headline: 'Quality Preserved',
          subheadline: "No 'HD' bait-and-switch.",
          ctaText: 'Try Free',
          badge: 'No Re-Encode',
        }}
      />

      {/* ============================================================= */}
      {/* BEFORE/AFTER REVEAL - Whip-pan transition video                */}
      {/* TEMPLATE-BA-001/002/003                                        */}
      {/* ============================================================= */}

      {/* Before/After Reveal - Story (9:16, 8 seconds) */}
      <Composition
        id="BeforeAfterReveal"
        component={BeforeAfterReveal}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={beforeAfterRevealDefaultProps}
      />

      {/* Before/After Reveal - Square (1:1) */}
      <Composition
        id="BeforeAfterReveal-Square"
        component={BeforeAfterReveal}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={beforeAfterRevealDefaultProps}
      />

      {/* Before/After Reveal - Landscape (16:9) */}
      <Composition
        id="BeforeAfterReveal-Landscape"
        component={BeforeAfterReveal}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={beforeAfterRevealDefaultProps}
      />

      {/* ============================================================= */}
      {/* UGC PIPELINE COMPOSITIONS - Brand-agnostic ad templates        */}
      {/* Used by: scripts/generate-ugc-ads.ts                          */}
      {/* ============================================================= */}

      {/* UGC Before/After - Square (Instagram Post) */}
      <Composition
        id="UGC-BeforeAfter-Post"
        component={UGCBeforeAfter}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={ugcBeforeAfterDefaultProps}
      />
      <Still
        id="UGC-BeforeAfter-Post-Still"
        component={UGCBeforeAfter}
        width={1080}
        height={1080}
        defaultProps={ugcBeforeAfterDefaultProps}
      />

      {/* UGC Before/After - Story (Instagram/FB Story, Reels) */}
      <Composition
        id="UGC-BeforeAfter-Story"
        component={UGCBeforeAfter}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ugcBeforeAfterDefaultProps}
      />
      <Still
        id="UGC-BeforeAfter-Story-Still"
        component={UGCBeforeAfter}
        width={1080}
        height={1920}
        defaultProps={ugcBeforeAfterDefaultProps}
      />

      {/* UGC Before/After - Portrait (Instagram Feed 4:5) */}
      <Still
        id="UGC-BeforeAfter-Portrait-Still"
        component={UGCBeforeAfter}
        width={1080}
        height={1350}
        defaultProps={ugcBeforeAfterDefaultProps}
      />

      {/* UGC Before/After - Landscape (Facebook Feed) */}
      <Still
        id="UGC-BeforeAfter-Landscape-Still"
        component={UGCBeforeAfter}
        width={1200}
        height={628}
        defaultProps={{...ugcBeforeAfterDefaultProps, headlineSize: 36, subheadlineSize: 18}}
      />

      {/* UGC Testimonial - Square */}
      <Composition
        id="UGC-Testimonial-Post"
        component={UGCTestimonial}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={ugcTestimonialDefaultProps}
      />
      <Still
        id="UGC-Testimonial-Post-Still"
        component={UGCTestimonial}
        width={1080}
        height={1080}
        defaultProps={ugcTestimonialDefaultProps}
      />

      {/* UGC Testimonial - Story */}
      <Composition
        id="UGC-Testimonial-Story"
        component={UGCTestimonial}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ugcTestimonialDefaultProps}
      />
      <Still
        id="UGC-Testimonial-Story-Still"
        component={UGCTestimonial}
        width={1080}
        height={1920}
        defaultProps={ugcTestimonialDefaultProps}
      />

      {/* UGC Product Demo - Square */}
      <Composition
        id="UGC-ProductDemo-Post"
        component={UGCProductDemo}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={ugcProductDemoDefaultProps}
      />
      <Still
        id="UGC-ProductDemo-Post-Still"
        component={UGCProductDemo}
        width={1080}
        height={1080}
        defaultProps={ugcProductDemoDefaultProps}
      />

      {/* UGC Product Demo - Story */}
      <Composition
        id="UGC-ProductDemo-Story"
        component={UGCProductDemo}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ugcProductDemoDefaultProps}
      />
      <Still
        id="UGC-ProductDemo-Story-Still"
        component={UGCProductDemo}
        width={1080}
        height={1920}
        defaultProps={ugcProductDemoDefaultProps}
      />

      {/* UGC Problem/Solution - Square */}
      <Composition
        id="UGC-ProblemSolution-Post"
        component={UGCProblemSolution}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={ugcProblemSolutionDefaultProps}
      />
      <Still
        id="UGC-ProblemSolution-Post-Still"
        component={UGCProblemSolution}
        width={1080}
        height={1080}
        defaultProps={ugcProblemSolutionDefaultProps}
      />

      {/* UGC Problem/Solution - Story */}
      <Composition
        id="UGC-ProblemSolution-Story"
        component={UGCProblemSolution}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ugcProblemSolutionDefaultProps}
      />
      <Still
        id="UGC-ProblemSolution-Story-Still"
        component={UGCProblemSolution}
        width={1080}
        height={1920}
        defaultProps={ugcProblemSolutionDefaultProps}
      />

      {/* UGC Problem/Solution - Portrait */}
      <Composition
        id="UGC-ProblemSolution-Portrait"
        component={UGCProblemSolution}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1350}
        defaultProps={ugcProblemSolutionDefaultProps}
      />
      <Still
        id="UGC-ProblemSolution-Portrait-Still"
        component={UGCProblemSolution}
        width={1080}
        height={1350}
        defaultProps={ugcProblemSolutionDefaultProps}
      />

      {/* UGC Problem/Solution - Landscape */}
      <Composition
        id="UGC-ProblemSolution-Landscape"
        component={UGCProblemSolution}
        durationInFrames={120}
        fps={30}
        width={1200}
        height={628}
        defaultProps={ugcProblemSolutionDefaultProps}
      />
      <Still
        id="UGC-ProblemSolution-Landscape-Still"
        component={UGCProblemSolution}
        width={1200}
        height={628}
        defaultProps={ugcProblemSolutionDefaultProps}
      />

      {/* UGC Stat Counter - Square */}
      <Composition
        id="UGC-StatCounter-Post"
        component={UGCStatCounter}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={ugcStatCounterDefaultProps}
      />
      <Still
        id="UGC-StatCounter-Post-Still"
        component={UGCStatCounter}
        width={1080}
        height={1080}
        defaultProps={ugcStatCounterDefaultProps}
      />

      {/* UGC Stat Counter - Story */}
      <Composition
        id="UGC-StatCounter-Story"
        component={UGCStatCounter}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ugcStatCounterDefaultProps}
      />
      <Still
        id="UGC-StatCounter-Story-Still"
        component={UGCStatCounter}
        width={1080}
        height={1920}
        defaultProps={ugcStatCounterDefaultProps}
      />

      {/* UGC Feature List - Square */}
      <Composition
        id="UGC-FeatureList-Post"
        component={UGCFeatureList}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={ugcFeatureListDefaultProps}
      />
      <Still
        id="UGC-FeatureList-Post-Still"
        component={UGCFeatureList}
        width={1080}
        height={1080}
        defaultProps={ugcFeatureListDefaultProps}
      />

      {/* UGC Feature List - Story */}
      <Composition
        id="UGC-FeatureList-Story"
        component={UGCFeatureList}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ugcFeatureListDefaultProps}
      />
      <Still
        id="UGC-FeatureList-Story-Still"
        component={UGCFeatureList}
        width={1080}
        height={1920}
        defaultProps={ugcFeatureListDefaultProps}
      />

      {/* UGC Urgency - Square */}
      <Composition
        id="UGC-Urgency-Post"
        component={UGCUrgency}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={ugcUrgencyDefaultProps}
      />
      <Still
        id="UGC-Urgency-Post-Still"
        component={UGCUrgency}
        width={1080}
        height={1080}
        defaultProps={ugcUrgencyDefaultProps}
      />

      {/* UGC Urgency - Story */}
      <Composition
        id="UGC-Urgency-Story"
        component={UGCUrgency}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ugcUrgencyDefaultProps}
      />
      <Still
        id="UGC-Urgency-Story-Still"
        component={UGCUrgency}
        width={1080}
        height={1920}
        defaultProps={ugcUrgencyDefaultProps}
      />

      {/* ============================================================= */}
      {/* UGC VIDEO AD COMPOSITIONS - Animated video ads with wrapper    */}
      {/* Includes intro, main template content, outro, and audio        */}
      {/* ============================================================= */}

      {/* Video Ad - Square (Instagram Feed) */}
      <Composition
        id="UGC-VideoAd-Post"
        component={UGCVideoAdWrapper}
        durationInFrames={VIDEO_AD_DURATION}
        fps={VIDEO_AD_FPS}
        width={1080}
        height={1080}
        defaultProps={ugcVideoAdWrapperDefaultProps}
      />

      {/* Video Ad - Story (Instagram/FB Story, Reels, TikTok) */}
      <Composition
        id="UGC-VideoAd-Story"
        component={UGCVideoAdWrapper}
        durationInFrames={VIDEO_AD_DURATION}
        fps={VIDEO_AD_FPS}
        width={1080}
        height={1920}
        defaultProps={ugcVideoAdWrapperDefaultProps}
      />

      {/* Video Ad - Portrait (Instagram Feed 4:5) */}
      <Composition
        id="UGC-VideoAd-Portrait"
        component={UGCVideoAdWrapper}
        durationInFrames={VIDEO_AD_DURATION}
        fps={VIDEO_AD_FPS}
        width={1080}
        height={1350}
        defaultProps={ugcVideoAdWrapperDefaultProps}
      />

      {/* Video Ad - Landscape (Facebook Feed, YouTube) */}
      <Composition
        id="UGC-VideoAd-Landscape"
        component={UGCVideoAdWrapper}
        durationInFrames={VIDEO_AD_DURATION}
        fps={VIDEO_AD_FPS}
        width={1200}
        height={628}
        defaultProps={ugcVideoAdWrapperDefaultProps}
      />
    </>
  );
};

