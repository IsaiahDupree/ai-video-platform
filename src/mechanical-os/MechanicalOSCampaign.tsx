import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type MechanicalOSVariant = 'hero' | 'proof' | 'explainer';

export interface MechanicalOSCampaignProps {
  variant: MechanicalOSVariant;
}

interface CaptionCue {
  from: number;
  to: number;
  text: string;
  accent?: string;
}

const COLORS = {
  bg: '#071015',
  panel: '#0C1A20',
  panelSoft: '#10262E',
  line: '#25424C',
  cyan: '#68E5E0',
  cyanSoft: '#B5FFFA',
  lime: '#B7F34A',
  amber: '#FFBF5B',
  red: '#FF6B78',
  white: '#F4F8F7',
  muted: '#91A7AD',
};

const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';

const enter = (frame: number, fps: number, delay = 0) =>
  spring({frame: frame - delay, fps, config: {damping: 18, stiffness: 125}});

const Scene: React.FC<{
  children: React.ReactNode;
  accent?: string;
  compact?: boolean;
}> = ({children, accent = COLORS.cyan, compact = false}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width} = useVideoConfig();
  const progress = enter(frame, fps);
  const fadeOut = interpolate(
    frame,
    [Math.max(0, durationInFrames - 14), durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const horizontal = width > 1200;

  return (
    <AbsoluteFill
      style={{
        padding: horizontal ? '92px 118px' : compact ? '150px 66px 120px' : '170px 74px 135px',
        opacity: progress * fadeOut,
        transform: `translateY(${(1 - progress) * 32}px)`,
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: horizontal ? 118 : 74,
          top: horizontal ? 86 : 140,
          width: horizontal ? 128 : 96,
          height: 7,
          borderRadius: 10,
          background: accent,
          boxShadow: `0 0 28px ${accent}70`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const Label: React.FC<{children: React.ReactNode; color?: string}> = ({
  children,
  color = COLORS.cyan,
}) => (
  <div
    style={{
      color,
      fontFamily: FONT,
      fontWeight: 800,
      fontSize: 28,
      letterSpacing: 3.2,
      textTransform: 'uppercase',
      marginBottom: 24,
    }}
  >
    {children}
  </div>
);

const Headline: React.FC<{
  children: React.ReactNode;
  size?: number;
  maxWidth?: number | string;
}> = ({children, size = 98, maxWidth = 940}) => (
  <div
    style={{
      color: COLORS.white,
      fontFamily: FONT,
      fontSize: size,
      fontWeight: 800,
      letterSpacing: -4.8,
      lineHeight: 0.98,
      maxWidth,
    }}
  >
    {children}
  </div>
);

const Subhead: React.FC<{children: React.ReactNode; maxWidth?: number | string}> = ({
  children,
  maxWidth = 880,
}) => (
  <div
    style={{
      color: COLORS.muted,
      fontFamily: FONT,
      fontSize: 38,
      lineHeight: 1.3,
      fontWeight: 500,
      maxWidth,
      marginTop: 34,
    }}
  >
    {children}
  </div>
);

const Pill: React.FC<{children: React.ReactNode; color?: string}> = ({
  children,
  color = COLORS.cyan,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      border: `2px solid ${color}80`,
      background: `${color}16`,
      color,
      borderRadius: 999,
      padding: '13px 22px',
      fontFamily: FONT,
      fontSize: 23,
      fontWeight: 800,
      letterSpacing: 1,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const Flow: React.FC<{items: string[]; vertical?: boolean}> = ({items, vertical = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'stretch',
        gap: vertical ? 18 : 16,
        marginTop: 44,
      }}
    >
      {items.map((item, index) => {
        const p = enter(frame, fps, index * 8);
        return (
          <React.Fragment key={item}>
            <div
              style={{
                flex: 1,
                border: `2px solid ${index === items.length - 1 ? COLORS.lime : COLORS.line}`,
                background: index === items.length - 1 ? `${COLORS.lime}12` : COLORS.panel,
                borderRadius: 18,
                padding: vertical ? '22px 26px' : '28px 24px',
                color: index === items.length - 1 ? COLORS.lime : COLORS.white,
                fontFamily: FONT,
                fontSize: vertical ? 31 : 25,
                fontWeight: 750,
                textAlign: vertical ? 'left' : 'center',
                opacity: p,
                transform: `translate${vertical ? 'X' : 'Y'}(${(1 - p) * 28}px)`,
              }}
            >
              <span style={{color: COLORS.muted, marginRight: 14}}>{String(index + 1).padStart(2, '0')}</span>
              {item}
            </div>
            {index < items.length - 1 ? (
              <div
                style={{
                  alignSelf: 'center',
                  width: vertical ? 3 : 26,
                  height: vertical ? 22 : 3,
                  background: COLORS.cyan,
                  opacity: p * 0.65,
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Metric: React.FC<{value: string; label: string; color?: string}> = ({
  value,
  label,
  color = COLORS.cyan,
}) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      background: COLORS.panel,
      border: `2px solid ${COLORS.line}`,
      borderRadius: 20,
      padding: '28px 24px',
    }}
  >
    <div style={{fontFamily: FONT, color, fontSize: 50, fontWeight: 850, letterSpacing: -2}}>{value}</div>
    <div style={{fontFamily: FONT, color: COLORS.muted, fontSize: 23, lineHeight: 1.2, marginTop: 10}}>{label}</div>
  </div>
);

const AnsysPanel: React.FC<{landscape?: boolean}> = ({landscape = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = enter(frame, fps, 6);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: landscape ? 'row' : 'column',
        gap: 22,
        marginTop: 34,
        opacity: p,
        transform: `scale(${0.96 + p * 0.04})`,
      }}
    >
      <div
        style={{
          position: 'relative',
          flex: landscape ? 1.4 : undefined,
          height: landscape ? 500 : 580,
          overflow: 'hidden',
          borderRadius: 22,
          border: `2px solid ${COLORS.line}`,
          background: '#E8ECEF',
        }}
      >
        <Img
          src={staticFile('ansys-rim-compression-contour.png')}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
        <div style={{position: 'absolute', top: 18, left: 18}}>
          <Pill color={COLORS.lime}>Real ANSYS artifact</Pill>
        </div>
      </div>
      <div
        style={{
          flex: 0.85,
          display: 'grid',
          gridTemplateColumns: landscape ? '1fr' : '1fr 1fr',
          gap: 16,
        }}
      >
        <Metric value="189,519" label="mesh nodes" />
        <Metric value="102,449" label="SOLID187 elements" />
        <Metric value="0.381 MPa" label="study max stress" color={COLORS.amber} />
        <Metric value="0.0146 mm" label="study max displacement" color={COLORS.amber} />
      </div>
    </div>
  );
};

const Gate: React.FC<{landscape?: boolean}> = ({landscape = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = enter(frame, fps, 5);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: landscape ? '1fr 1fr' : '1fr',
        gap: 22,
        marginTop: 44,
      }}
    >
      <div
        style={{
          padding: '30px 32px',
          borderRadius: 20,
          border: `2px solid ${COLORS.amber}`,
          background: `${COLORS.amber}12`,
          opacity: p,
          transform: `translateX(${(1 - p) * -32}px)`,
        }}
      >
        <div style={{fontFamily: FONT, fontSize: 24, color: COLORS.amber, fontWeight: 800, textTransform: 'uppercase'}}>
          Permitted claim
        </div>
        <div style={{fontFamily: FONT, fontSize: landscape ? 42 : 44, color: COLORS.white, fontWeight: 800, marginTop: 14}}>
          Simulation screened
        </div>
      </div>
      <div
        style={{
          padding: '30px 32px',
          borderRadius: 20,
          border: `2px solid ${COLORS.red}`,
          background: `${COLORS.red}12`,
          opacity: p,
          transform: `translateX(${(1 - p) * 32}px)`,
        }}
      >
        <div style={{fontFamily: FONT, fontSize: 24, color: COLORS.red, fontWeight: 800, textTransform: 'uppercase'}}>
          Blocked claim
        </div>
        <div style={{fontFamily: FONT, fontSize: landscape ? 42 : 44, color: COLORS.white, fontWeight: 800, marginTop: 14}}>
          Physically qualified
        </div>
      </div>
    </div>
  );
};

const BrandChrome: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 38,
          right: 38,
          top: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: FONT,
          zIndex: 20,
        }}
      >
        <div style={{fontSize: 23, fontWeight: 850, color: COLORS.white, letterSpacing: 1.6}}>
          MECHANICAL <span style={{color: COLORS.cyan}}>OS</span>
        </div>
        <div style={{fontSize: 18, fontWeight: 700, color: COLORS.muted}}>ENGINEERING CONTROL PLANE</div>
      </div>
      <div style={{position: 'absolute', left: 0, bottom: 0, height: 8, width: `${progress * 100}%`, background: COLORS.cyan, zIndex: 30}} />
    </>
  );
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = frame * 0.18;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        backgroundImage: `linear-gradient(${COLORS.line}35 1px, transparent 1px), linear-gradient(90deg, ${COLORS.line}35 1px, transparent 1px), radial-gradient(circle at 78% 18%, ${COLORS.cyan}18, transparent 32%)`,
        backgroundSize: '64px 64px, 64px 64px, 100% 100%',
        backgroundPosition: `${shift}px ${shift}px, ${shift}px ${shift}px, 0 0`,
      }}
    />
  );
};

const CTA: React.FC<{landscape?: boolean}> = ({landscape = false}) => (
  <>
    <Label color={COLORS.lime}>Build the bounded workflow</Label>
    <Headline size={landscape ? 88 : 102} maxWidth={landscape ? 1250 : 900}>
      DM <span style={{color: COLORS.lime}}>CONTROL</span>
    </Headline>
    <Subhead maxWidth={landscape ? 1100 : 820}>
      I&apos;ll map the first deterministic engineering workflow with you.
    </Subhead>
    <div style={{marginTop: 52, display: 'flex', gap: 16, flexWrap: 'wrap'}}>
      <Pill>Agents choose operations</Pill>
      <Pill color={COLORS.lime}>Tools produce evidence</Pill>
    </div>
  </>
);

const HeroVertical: React.FC = () => (
  <>
    <Sequence from={0} durationInFrames={90}>
      <Scene accent={COLORS.red}>
        <Label color={COLORS.red}>The wrong metaphor</Label>
        <Headline>“AI generating CAD.”</Headline>
        <Subhead>It sounds impressive. It is not an engineering authority model.</Subhead>
      </Scene>
    </Sequence>
    <Sequence from={90} durationInFrames={120}>
      <Scene>
        <Label>The better model</Label>
        <Headline>A mechanical engineering compiler.</Headline>
        <Subhead>Agents operate around deterministic geometry, CAD, simulation, and evidence tools.</Subhead>
      </Scene>
    </Sequence>
    <Sequence from={210} durationInFrames={150}>
      <Scene>
        <Label>Compilation pipeline</Label>
        <Flow items={['Natural-language intent', 'Mechanical IR', 'Deterministic operations', 'Versioned artifacts']} />
      </Scene>
    </Sequence>
    <Sequence from={360} durationInFrames={150}>
      <Scene>
        <Label color={COLORS.lime}>Observed system state</Label>
        <Headline size={84}>230 modules become an engineering registry.</Headline>
        <div style={{display: 'flex', gap: 16, marginTop: 44}}>
          <Metric value="10" label="contract modules" />
          <Metric value="599" label="evidence records" />
        </div>
        <div style={{display: 'flex', gap: 16, marginTop: 16}}>
          <Metric value="7" label="simulation studies" />
          <Metric value="6" label="screening passes" color={COLORS.lime} />
        </div>
      </Scene>
    </Sequence>
    <Sequence from={510} durationInFrames={180}>
      <Scene compact>
        <Label>ANSYS screening receipt</Label>
        <AnsysPanel />
      </Scene>
    </Sequence>
    <Sequence from={690} durationInFrames={120}>
      <Scene accent={COLORS.amber}>
        <Label color={COLORS.amber}>Evidence gate</Label>
        <Headline size={82}>The model cannot promote its own claim.</Headline>
        <Gate />
      </Scene>
    </Sequence>
    <Sequence from={810} durationInFrames={210}>
      <Scene accent={COLORS.lime}>
        <CTA />
      </Scene>
    </Sequence>
  </>
);

const ProofVertical: React.FC = () => (
  <>
    <Sequence from={0} durationInFrames={75}>
      <Scene accent={COLORS.red}>
        <Label color={COLORS.red}>No plausible claims</Label>
        <Headline size={88}>The LLM did not declare this “strong enough.”</Headline>
      </Scene>
    </Sequence>
    <Sequence from={75} durationInFrames={105}>
      <Scene>
        <Label>What actually happened</Label>
        <Flow items={['Geometry generated', 'CAD verified', 'ANSYS executed']} />
      </Scene>
    </Sequence>
    <Sequence from={180} durationInFrames={135}>
      <Scene compact>
        <Label>Study output — not qualification</Label>
        <AnsysPanel />
      </Scene>
    </Sequence>
    <Sequence from={315} durationInFrames={75}>
      <Scene accent={COLORS.amber}>
        <Label color={COLORS.amber}>Claim status</Label>
        <Headline size={96}>SCREENING ONLY</Headline>
        <Subhead>Physical qualification remains blocked until evidence exists.</Subhead>
      </Scene>
    </Sequence>
    <Sequence from={390} durationInFrames={60}>
      <Scene accent={COLORS.lime}>
        <CTA />
      </Scene>
    </Sequence>
  </>
);

const ExplainerLandscape: React.FC = () => (
  <>
    <Sequence from={0} durationInFrames={120}>
      <Scene accent={COLORS.red}>
        <Label color={COLORS.red}>Agentic engineering rule</Label>
        <Headline size={86} maxWidth={1300}>AI chooses the operation. Deterministic software produces the result.</Headline>
      </Scene>
    </Sequence>
    <Sequence from={120} durationInFrames={150}>
      <Scene>
        <Label>Durable orchestration</Label>
        <Headline size={68} maxWidth={1300}>Requirements become structured intent—not paragraphs passed between agents.</Headline>
        <Flow vertical={false} items={['Requirement', 'Mechanical IR', 'Geometry', 'CAD check', 'Simulation', 'Evidence']} />
      </Scene>
    </Sequence>
    <Sequence from={270} durationInFrames={180}>
      <Scene>
        <Label color={COLORS.lime}>Registry + provenance</Label>
        <Headline size={72} maxWidth={1200}>Every output stays connected to the operation that produced it.</Headline>
        <div style={{display: 'flex', gap: 18, marginTop: 44}}>
          <Metric value="230" label="catalog entries" />
          <Metric value="10" label="contract modules" />
          <Metric value="599" label="evidence records" />
          <Metric value="7 / 6" label="studies / passes" color={COLORS.lime} />
        </div>
      </Scene>
    </Sequence>
    <Sequence from={450} durationInFrames={180}>
      <Scene compact>
        <Label>Deterministic ANSYS execution</Label>
        <AnsysPanel landscape />
      </Scene>
    </Sequence>
    <Sequence from={630} durationInFrames={150}>
      <Scene accent={COLORS.amber}>
        <Label color={COLORS.amber}>Authority boundary</Label>
        <Headline size={72}>The evidence service decides what can be claimed.</Headline>
        <Gate landscape />
      </Scene>
    </Sequence>
    <Sequence from={780} durationInFrames={330}>
      <Scene accent={COLORS.lime}>
        <CTA landscape />
      </Scene>
    </Sequence>
  </>
);

const CAPTIONS: Record<MechanicalOSVariant, CaptionCue[]> = {
  hero: [
    {from: 0, to: 118, text: 'I stopped calling this AI-generated CAD.', accent: COLORS.red},
    {from: 118, to: 225, text: 'That gives the model way too much authority.'},
    {from: 225, to: 315, text: 'Mechanical OS works more like a compiler.', accent: COLORS.cyan},
    {from: 315, to: 415, text: 'An agent chooses a bounded engineering operation.'},
    {from: 415, to: 575, text: 'Deterministic tools generate geometry, check CAD, run ANSYS, and record evidence.'},
    {from: 575, to: 725, text: '230 catalog entries · 10 contract modules · 599 evidence records', accent: COLORS.lime},
    {from: 725, to: 890, text: '189,519 nodes: screening evidence — not physical qualification.', accent: COLORS.amber},
    {from: 890, to: 1010, text: 'DM CONTROL if you want the architecture.', accent: COLORS.lime},
  ],
  proof: [
    {from: 0, to: 88, text: 'The model never got to say “strong enough.”', accent: COLORS.red},
    {from: 88, to: 205, text: 'Geometry generated. CAD checked it. ANSYS ran.'},
    {from: 205, to: 305, text: 'The evidence gate stopped at simulation screened.', accent: COLORS.amber},
    {from: 305, to: 382, text: 'AI can propose the next operation.'},
    {from: 382, to: 450, text: 'It cannot promote its own claim.', accent: COLORS.lime},
  ],
  explainer: [
    {from: 0, to: 160, text: 'A mechanical engineering compiler — not a chatbot that exports CAD.', accent: COLORS.red},
    {from: 160, to: 300, text: 'Requirements become structured intent.'},
    {from: 300, to: 455, text: 'Agents select modules and bounded operations.', accent: COLORS.cyan},
    {from: 455, to: 635, text: 'Deterministic services generate geometry, verify CAD, run simulation, and attach provenance.'},
    {from: 635, to: 770, text: '230 catalog entries · 10 contracts · 599 evidence records', accent: COLORS.lime},
    {from: 770, to: 925, text: 'ANSYS can screen a design.'},
    {from: 925, to: 1090, text: 'Only evidence rules can advance qualification.', accent: COLORS.amber},
  ],
};

const CaptionOverlay: React.FC<{variant: MechanicalOSVariant}> = ({variant}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const cue = CAPTIONS[variant].find(({from, to}) => frame >= from && frame < to);
  if (!cue) return null;

  const progress = interpolate(frame, [cue.from, cue.from + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const landscape = width > 1200;

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 50,
        left: landscape ? 250 : 72,
        right: landscape ? 250 : 72,
        bottom: landscape ? 56 : 88,
        display: 'flex',
        justifyContent: 'center',
        opacity: progress,
        transform: `translateY(${(1 - progress) * 16}px)`,
      }}
    >
      <div
        style={{
          maxWidth: landscape ? 1300 : 920,
          border: `2px solid ${cue.accent ?? COLORS.line}`,
          borderRadius: 18,
          background: 'rgba(3, 10, 13, 0.90)',
          boxShadow: '0 18px 55px rgba(0, 0, 0, 0.42)',
          padding: landscape ? '18px 30px' : '22px 28px',
          color: COLORS.white,
          fontFamily: FONT,
          fontSize: landscape ? 38 : 42,
          fontWeight: 800,
          letterSpacing: -0.8,
          lineHeight: 1.15,
          textAlign: 'center',
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};

export const MechanicalOSCampaign: React.FC<MechanicalOSCampaignProps> = ({variant}) => (
  <AbsoluteFill style={{background: COLORS.bg, overflow: 'hidden'}}>
    <Background />
    <Audio src={staticFile(`mechanical-os-ugc/${variant}-mix.wav`)} />
    <BrandChrome />
    {variant === 'hero' ? <HeroVertical /> : null}
    {variant === 'proof' ? <ProofVertical /> : null}
    {variant === 'explainer' ? <ExplainerLandscape /> : null}
    <CaptionOverlay variant={variant} />
  </AbsoluteFill>
);
