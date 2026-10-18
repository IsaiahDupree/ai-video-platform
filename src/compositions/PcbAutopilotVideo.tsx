import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const PCB_AUTOPILOT_FPS = 30;
export const PCB_AUTOPILOT_DURATION_SECONDS = 60;
export const PCB_AUTOPILOT_FRAMES =
  PCB_AUTOPILOT_FPS * PCB_AUTOPILOT_DURATION_SECONDS;

export const PCB_AUTOPILOT_SCRIPT = [
  'The most important feature in our AI PCB agent is not generation. It is the ability to stop.',
  'This is a real KiCad fixture with two different nets crossing. It is deliberately invalid.',
  'We bound three fixtures to exact source hashes and ran them through an isolated, pinned KiCad 10.0.6 verifier.',
  'Every declared detector expectation conformed. Both critical mutation cases were observed—zero misses in this small declared corpus.',
  'Then the system refused to call the verifier qualified.',
  'The fixtures still need single-fault cleanup, a second clean baseline, and independent electrical review. Missing evidence stays missing.',
  'That is the architecture: AI proposes, deterministic rules check, EDA tools execute, humans approve. Build the kill switch before the autopilot.',
] as const;

type Layout = 'portrait' | 'landscape';

export interface PcbAutopilotVideoProps extends Record<string, unknown> {
  layout: Layout;
  audioSrc: string;
  boardTopSrc: string;
  boardIsoSrc: string;
}

export const pcbAutopilotPortraitProps: PcbAutopilotVideoProps = {
  layout: 'portrait',
  audioSrc: 'pcb-autopilot/audio/pcb-autopilot-master.wav',
  boardTopSrc: 'pcb-autopilot/images/broken-drc-top.png',
  boardIsoSrc: 'pcb-autopilot/images/broken-drc-isometric.png',
};

export const pcbAutopilotLandscapeProps: PcbAutopilotVideoProps = {
  ...pcbAutopilotPortraitProps,
  layout: 'landscape',
};

const COLORS = {
  ink: '#04080D',
  panel: '#0A121B',
  panelSoft: '#101D29',
  cyan: '#33E6FF',
  amber: '#FFB547',
  red: '#FF4D5A',
  green: '#42E39B',
  white: '#F6FAFD',
  muted: '#92A8B9',
  trace: '#21566B',
};

const SCENES = [
  {start: 0, end: 7, id: 'stop'},
  {start: 7, end: 15, id: 'fixture'},
  {start: 15, end: 24, id: 'receipts'},
  {start: 24, end: 34, id: 'observed'},
  {start: 34, end: 40, id: 'refused'},
  {start: 40, end: 50, id: 'missing'},
  {start: 50, end: 60, id: 'architecture'},
] as const;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const mono = 'SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const sans = 'Inter, Avenir Next, Helvetica Neue, Arial, sans-serif';

const enterStyle = (progress: number, distance = 56): React.CSSProperties => {
  const value = interpolate(progress, [0, 0.18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return {
    opacity: value,
    transform: `translateY(${(1 - value) * distance}px)`,
  };
};

const Kicker: React.FC<{children: React.ReactNode; color?: string}> = ({
  children,
  color = COLORS.cyan,
}) => (
  <div
    style={{
      color,
      fontFamily: mono,
      fontSize: 22,
      fontWeight: 900,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const Headline: React.FC<{
  children: React.ReactNode;
  size: number;
  color?: string;
  align?: 'left' | 'center';
}> = ({children, size, color = COLORS.white, align = 'left'}) => (
  <div
    style={{
      color,
      fontFamily: sans,
      fontSize: size,
      fontWeight: 950,
      letterSpacing: '-0.06em',
      lineHeight: 0.94,
      textAlign: align,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const Pill: React.FC<{
  children: React.ReactNode;
  color?: string;
  filled?: boolean;
}> = ({children, color = COLORS.cyan, filled = false}) => (
  <div
    style={{
      border: `1px solid ${color}99`,
      borderRadius: 999,
      background: filled ? color : `${color}16`,
      color: filled ? COLORS.ink : color,
      fontFamily: mono,
      fontSize: 19,
      fontWeight: 900,
      letterSpacing: '0.05em',
      padding: '11px 17px',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const Card: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({children, color = COLORS.trace, style}) => (
  <div
    style={{
      background: `linear-gradient(145deg, ${COLORS.panel}F5, ${COLORS.panelSoft}F0)`,
      border: `1px solid ${color}88`,
      borderRadius: 28,
      boxShadow: `0 20px 70px ${COLORS.ink}99, inset 0 1px 0 rgba(255,255,255,0.06)`,
      padding: 34,
      ...style,
    }}
  >
    {children}
  </div>
);

const BoardImage: React.FC<{
  src: string;
  isPortrait: boolean;
  label: string;
  progress: number;
}> = ({src, isPortrait, label, progress}) => {
  const scale = interpolate(progress, [0, 1], [1.045, 1.1]);
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: isPortrait ? 650 : 690,
        borderRadius: 30,
        overflow: 'hidden',
        border: `2px solid ${COLORS.cyan}88`,
        boxShadow: `0 0 90px ${COLORS.cyan}18`,
        background: '#09131B',
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, transparent 54%, rgba(3,8,13,0.92) 100%)',
        }}
      />
      <div style={{position: 'absolute', left: 24, bottom: 22}}>
        <Pill color={COLORS.green}>{label}</Pill>
      </div>
    </div>
  );
};

const Caption: React.FC<{
  text: string;
  progress: number;
  isPortrait: boolean;
}> = ({text, progress, isPortrait}) => {
  const words = text.split(/\s+/).filter(Boolean);
  const active = Math.min(words.length - 1, Math.floor(progress * words.length));
  return (
    <div
      style={{
        position: 'absolute',
        left: isPortrait ? 42 : 82,
        right: isPortrait ? 42 : 82,
        bottom: isPortrait ? 74 : 34,
        zIndex: 80,
        border: `1px solid ${COLORS.cyan}55`,
        borderRadius: 22,
        background: 'rgba(3,8,13,0.94)',
        boxShadow: '0 14px 48px rgba(0,0,0,0.5)',
        padding: isPortrait ? '22px 27px 25px' : '15px 25px 18px',
      }}
    >
      <div
        style={{
          color: COLORS.white,
          fontFamily: sans,
          fontSize: isPortrait ? 35 : 28,
          fontWeight: 850,
          lineHeight: 1.22,
          textAlign: 'center',
        }}
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            style={{color: index <= active ? COLORS.white : '#556A79'}}
          >
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

const SceneContent: React.FC<{
  sceneId: (typeof SCENES)[number]['id'];
  progress: number;
  isPortrait: boolean;
  props: PcbAutopilotVideoProps;
}> = ({sceneId, progress, isPortrait, props}) => {
  const titleSize = isPortrait ? 86 : 72;
  const sceneEnter = enterStyle(progress);

  if (sceneId === 'stop') {
    const stopScale = interpolate(progress, [0, 0.16, 1], [0.7, 1.04, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.8)),
    });
    return (
      <div style={{...sceneEnter, textAlign: isPortrait ? 'left' : 'center'}}>
        <Kicker>PCB AUTOPILOT / DESIGN PRINCIPLE 01</Kicker>
        <div style={{height: isPortrait ? 42 : 24}} />
        <Headline size={titleSize} align={isPortrait ? 'left' : 'center'}>
          The most important feature is
        </Headline>
        <div
          style={{
            color: COLORS.red,
            fontFamily: sans,
            fontSize: isPortrait ? 224 : 180,
            fontWeight: 1000,
            letterSpacing: '-0.09em',
            lineHeight: 0.82,
            marginTop: 22,
            textAlign: isPortrait ? 'left' : 'center',
            textShadow: `0 0 70px ${COLORS.red}55`,
            transform: `scale(${stopScale})`,
            transformOrigin: isPortrait ? 'left center' : 'center',
          }}
        >
          STOP.
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: isPortrait ? 'flex-start' : 'center',
            marginTop: 52,
          }}
        >
          <Pill>AI PROPOSES</Pill>
          <Pill color={COLORS.red} filled>KILL SWITCH</Pill>
        </div>
      </div>
    );
  }

  if (sceneId === 'fixture') {
    return (
      <div
        style={{
          ...sceneEnter,
          display: 'grid',
          gridTemplateColumns: isPortrait ? '1fr' : '0.78fr 1.22fr',
          gap: isPortrait ? 30 : 48,
          alignItems: 'center',
        }}
      >
        <div>
          <Kicker color={COLORS.amber}>REAL KICAD EVIDENCE</Kicker>
          <div style={{height: 24}} />
          <Headline size={isPortrait ? 71 : 78}>
            Two nets.
            <br />One crossing.
            <br />Invalid on purpose.
          </Headline>
          <div style={{display: 'flex', gap: 12, marginTop: 30, flexWrap: 'wrap'}}>
            <Pill color={COLORS.red}>BROKEN_DRC</Pill>
            <Pill color={COLORS.cyan}>KICAD 10.0.6</Pill>
          </div>
        </div>
        <BoardImage
          src={props.boardTopSrc}
          isPortrait={isPortrait}
          label="SOURCE RENDER / NOT A MOCKUP"
          progress={progress}
        />
      </div>
    );
  }

  if (sceneId === 'receipts') {
    const rows = [
      ['03', 'FIXTURES', COLORS.cyan],
      ['SHA-256', 'SOURCE BINDING', COLORS.amber],
      ['10.0.6', 'PINNED KICAD', COLORS.green],
    ] as const;
    return (
      <div
        style={{
          ...sceneEnter,
          display: 'grid',
          gridTemplateColumns: isPortrait ? '1fr' : '1.05fr 0.95fr',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <div>
          <Kicker>CONTENT-ADDRESSED CORPUS</Kicker>
          <div style={{height: 24}} />
          <Headline size={isPortrait ? 76 : 80}>Bound to the source. Pinned to the tool.</Headline>
          <div style={{marginTop: 34, display: 'grid', gap: 16}}>
            {rows.map(([value, label, color], index) => {
              const item = clamp((progress - index * 0.1) / 0.22);
              return (
                <Card
                  key={label}
                  color={color}
                  style={{
                    alignItems: 'center',
                    display: 'grid',
                    gridTemplateColumns: '0.55fr 1fr',
                    opacity: item,
                    padding: isPortrait ? '24px 28px' : '20px 28px',
                    transform: `translateX(${(1 - item) * 45}px)`,
                  }}
                >
                  <div style={{color, fontFamily: mono, fontSize: 42, fontWeight: 950}}>{value}</div>
                  <div style={{color: COLORS.white, fontFamily: sans, fontSize: 29, fontWeight: 900}}>{label}</div>
                </Card>
              );
            })}
          </div>
        </div>
        <BoardImage
          src={props.boardIsoSrc}
          isPortrait={isPortrait}
          label="FIXTURE / ISOMETRIC"
          progress={progress}
        />
      </div>
    );
  }

  if (sceneId === 'observed') {
    const metricScale = interpolate(progress, [0, 0.18, 1], [0.72, 1.04, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.5)),
    });
    return (
      <div style={{...sceneEnter}}>
        <Kicker color={COLORS.green}>DETECTOR CONFORMANCE / PASSED</Kicker>
        <div style={{height: 28}} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: isPortrait ? 22 : 34,
          }}
        >
          <Card color={COLORS.green} style={{minHeight: isPortrait ? 470 : 430}}>
            <div style={{transform: `scale(${metricScale})`, transformOrigin: 'left top'}}>
              <div style={{color: COLORS.green, fontFamily: sans, fontSize: isPortrait ? 154 : 142, fontWeight: 1000, lineHeight: 0.85}}>2</div>
              <div style={{color: COLORS.white, fontFamily: sans, fontSize: isPortrait ? 36 : 34, fontWeight: 950, marginTop: 34}}>CRITICAL MUTATION CASES</div>
              <div style={{color: COLORS.muted, fontFamily: mono, fontSize: 20, marginTop: 18}}>observed in declared corpus</div>
            </div>
          </Card>
          <Card color={COLORS.cyan} style={{minHeight: isPortrait ? 470 : 430}}>
            <div style={{transform: `scale(${metricScale})`, transformOrigin: 'left top'}}>
              <div style={{color: COLORS.cyan, fontFamily: sans, fontSize: isPortrait ? 154 : 142, fontWeight: 1000, lineHeight: 0.85}}>0</div>
              <div style={{color: COLORS.white, fontFamily: sans, fontSize: isPortrait ? 36 : 34, fontWeight: 950, marginTop: 34}}>OBSERVED MISSES</div>
              <div style={{color: COLORS.muted, fontFamily: mono, fontSize: 20, marginTop: 18}}>small declared corpus</div>
            </div>
          </Card>
        </div>
        <div style={{marginTop: 30}}>
          <Pill color={COLORS.amber}>BOUND CLAIM / NOT A GENERAL PERFORMANCE GUARANTEE</Pill>
        </div>
      </div>
    );
  }

  if (sceneId === 'refused') {
    return (
      <div style={{...sceneEnter, textAlign: 'center'}}>
        <Kicker color={COLORS.green}>DETECTOR CONFORMANCE: PASS</Kicker>
        <div style={{height: isPortrait ? 62 : 30}} />
        <Card color={COLORS.red} style={{padding: isPortrait ? '72px 42px' : '48px 54px'}}>
          <Headline size={isPortrait ? 72 : 66} align="center">Qualification gate</Headline>
          <div
            style={{
              color: COLORS.red,
              fontFamily: sans,
              fontSize: isPortrait ? 155 : 138,
              fontWeight: 1000,
              letterSpacing: '-0.08em',
              lineHeight: 0.86,
              marginTop: 30,
              textShadow: `0 0 70px ${COLORS.red}55`,
            }}
          >
            REFUSED
          </div>
          <div style={{color: COLORS.muted, fontFamily: mono, fontSize: 23, marginTop: 38}}>
            qualified_for_project_verification = false
          </div>
        </Card>
      </div>
    );
  }

  if (sceneId === 'missing') {
    const missing = [
      'Single-fault fixture cleanup',
      'Second clean baseline',
      'Independent electrical review',
    ];
    return (
      <div style={{...sceneEnter}}>
        <Kicker color={COLORS.red}>MISSING EVIDENCE / FAIL CLOSED</Kicker>
        <div style={{height: 26}} />
        <Headline size={isPortrait ? 72 : 78}>Missing evidence stays missing.</Headline>
        <div style={{marginTop: 42, display: 'grid', gap: 19}}>
          {missing.map((label, index) => {
            const item = clamp((progress - index * 0.11) / 0.24);
            return (
              <Card
                key={label}
                color={COLORS.red}
                style={{
                  alignItems: 'center',
                  display: 'grid',
                  gridTemplateColumns: isPortrait ? '82px 1fr auto' : '92px 1fr auto',
                  opacity: item,
                  padding: isPortrait ? '25px 28px' : '22px 34px',
                  transform: `translateY(${(1 - item) * 35}px)`,
                }}
              >
                <div style={{color: COLORS.red, fontFamily: mono, fontSize: 34, fontWeight: 950}}>0{index + 1}</div>
                <div style={{color: COLORS.white, fontFamily: sans, fontSize: isPortrait ? 30 : 32, fontWeight: 900}}>{label}</div>
                <Pill color={COLORS.red}>OPEN</Pill>
              </Card>
            );
          })}
        </div>
        <div style={{display: 'flex', gap: 12, marginTop: 30, flexWrap: 'wrap'}}>
          <Pill color={COLORS.red}>NO FABRICATION</Pill>
          <Pill color={COLORS.red}>NO ORDER</Pill>
          <Pill color={COLORS.red}>NO RELEASE</Pill>
        </div>
      </div>
    );
  }

  const steps = [
    ['01', 'AI PROPOSES', COLORS.cyan],
    ['02', 'RULES CHECK', COLORS.amber],
    ['03', 'EDA EXECUTES', COLORS.green],
    ['04', 'HUMAN APPROVES', COLORS.white],
  ] as const;
  return (
    <div style={{...sceneEnter}}>
      <Kicker>THE CONTROL PLANE</Kicker>
      <div style={{height: 24}} />
      <Headline size={isPortrait ? 68 : 74}>Build the kill switch before the autopilot.</Headline>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isPortrait ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 16,
          marginTop: 40,
        }}
      >
        {steps.map(([number, label, color], index) => {
          const item = clamp((progress - index * 0.08) / 0.2);
          return (
            <Card
              key={label}
              color={color}
              style={{
                minHeight: isPortrait ? 200 : 240,
                opacity: item,
                padding: isPortrait ? 24 : 28,
                transform: `translateY(${(1 - item) * 42}px)`,
              }}
            >
              <div style={{color, fontFamily: mono, fontSize: 25, fontWeight: 950}}>{number}</div>
              <div style={{color: COLORS.white, fontFamily: sans, fontSize: isPortrait ? 27 : 30, fontWeight: 950, lineHeight: 1.02, marginTop: 46}}>{label}</div>
            </Card>
          );
        })}
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 30}}>
        <Pill color={COLORS.red} filled>STOP IS A FEATURE</Pill>
      </div>
    </div>
  );
};

export const PcbAutopilotVideo: React.FC<PcbAutopilotVideoProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const second = frame / fps;
  const scene = SCENES.find(({start, end}) => second >= start && second < end) ?? SCENES[SCENES.length - 1];
  const sceneProgress = clamp((second - scene.start) / (scene.end - scene.start));
  const isPortrait = props.layout === 'portrait' || height > width;
  const globalProgress = frame / Math.max(1, durationInFrames - 1);
  const gridOffset = (frame * 0.75) % 70;
  const scanY = interpolate(sceneProgress, [0, 1], [-10, 110]);

  return (
    <AbsoluteFill style={{background: COLORS.ink, color: COLORS.white, overflow: 'hidden'}}>
      <Audio src={staticFile(props.audioSrc)} volume={1} />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COLORS.trace}30 1px, transparent 1px), linear-gradient(90deg, ${COLORS.trace}30 1px, transparent 1px)`,
          backgroundPosition: `${gridOffset}px ${gridOffset}px`,
          backgroundSize: '70px 70px',
          opacity: 0.38,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 83% 8%, rgba(51,230,255,0.15), transparent 38%), radial-gradient(circle at 12% 82%, rgba(255,181,71,0.09), transparent 42%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: `${scanY}%`,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${COLORS.cyan}66, transparent)`,
          boxShadow: `0 0 28px ${COLORS.cyan}66`,
          opacity: 0.55,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: isPortrait ? 48 : 28,
          left: isPortrait ? 44 : 72,
          right: isPortrait ? 44 : 72,
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          zIndex: 30,
        }}
      >
        <div style={{alignItems: 'center', display: 'flex', gap: 12}}>
          <div style={{width: 12, height: 12, borderRadius: 99, background: COLORS.green, boxShadow: `0 0 20px ${COLORS.green}`}} />
          <div style={{color: COLORS.white, fontFamily: mono, fontSize: 18, fontWeight: 900, letterSpacing: '0.12em'}}>PCB AUTOPILOT</div>
        </div>
        <div style={{color: COLORS.muted, fontFamily: mono, fontSize: 17}}>
          EVIDENCE FIRST / {String(Math.floor(second)).padStart(2, '0')}:60
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: isPortrait ? 150 : 92,
          left: isPortrait ? 48 : 88,
          right: isPortrait ? 48 : 88,
          bottom: isPortrait ? 310 : 160,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <SceneContent sceneId={scene.id} progress={sceneProgress} isPortrait={isPortrait} props={props} />
      </div>

      <Caption text={PCB_AUTOPILOT_SCRIPT[SCENES.indexOf(scene)]} progress={sceneProgress} isPortrait={isPortrait} />

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 7, background: '#172732', zIndex: 90}}>
        <div style={{height: '100%', width: `${globalProgress * 100}%`, background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.green}, ${COLORS.amber})`}} />
      </div>
    </AbsoluteFill>
  );
};
