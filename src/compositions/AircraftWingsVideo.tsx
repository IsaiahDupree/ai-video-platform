import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { TikTokCaptions, TikTokStyle } from '../components/TikTokCaptions';
import { generateTranscriptFromText } from '../components/AnimatedCaptions';

// =============================================================================
// Aircraft Wings - Differential Flow Explainer Video
// Beginner → Expert → Postgraduate Levels
// =============================================================================

interface Section {
  id: string;
  level: 'beginner' | 'expert' | 'postgrad';
  title: string;
  text: string;
  voiceoverPath: string;
  durationFrames: number;
  icon?: string;
  color: string;
}

const SECTIONS: Section[] = [
  // === HOOK ===
  {
    id: 'hook',
    level: 'beginner',
    title: '',
    text: 'Ever wonder how a 500-ton airplane stays in the air? It all comes down to how air flows differently over the wing.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/hook_vo.wav',
    durationFrames: 295,
    color: '#00d4ff',
  },

  // === BEGINNER LEVEL ===
  {
    id: 'beginner_intro',
    level: 'beginner',
    title: '🟢 Beginner Level',
    text: 'Let\'s start simple. Air moves faster over the top of a wing and slower underneath.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/beginner_intro_vo.wav',
    durationFrames: 223,
    icon: '✈️',
    color: '#4ade80',
  },
  {
    id: 'beginner_lift',
    level: 'beginner',
    title: 'What Creates Lift?',
    text: 'Faster air means lower pressure. The higher pressure below pushes the wing up. That\'s lift!',
    voiceoverPath: 'assets/audio/voiceover/aircraft/beginner_lift_vo.wav',
    durationFrames: 220,
    icon: '⬆️',
    color: '#4ade80',
  },
  {
    id: 'beginner_shape',
    level: 'beginner',
    title: 'Wing Shape Matters',
    text: 'Wings are curved on top and flatter below. This shape forces air to travel different distances.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/beginner_shape_vo.wav',
    durationFrames: 225,
    icon: '🔄',
    color: '#4ade80',
  },

  // === EXPERT LEVEL ===
  {
    id: 'expert_intro',
    level: 'expert',
    title: '🟡 Expert Level',
    text: 'Now let\'s go deeper. We need to understand Bernoulli\'s principle and the continuity equation.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/expert_intro_vo.wav',
    durationFrames: 239,
    icon: '📐',
    color: '#facc15',
  },
  {
    id: 'expert_bernoulli',
    level: 'expert',
    title: 'Bernoulli\'s Equation',
    text: 'P plus one-half rho v squared plus rho g h equals constant. Pressure and velocity are inversely related in a streamline.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/expert_bernoulli_vo.wav',
    durationFrames: 303,
    icon: '📊',
    color: '#facc15',
  },
  {
    id: 'expert_circulation',
    level: 'expert',
    title: 'Circulation Theory',
    text: 'Lift also comes from circulation - the net rotation of airflow around the wing. This is described by the Kutta-Joukowski theorem.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/expert_circulation_vo.wav',
    durationFrames: 267,
    icon: '🌀',
    color: '#facc15',
  },
  {
    id: 'expert_angle',
    level: 'expert',
    title: 'Angle of Attack',
    text: 'Increasing angle of attack increases lift, but too much causes flow separation and stall. There\'s a critical angle.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/expert_angle_vo.wav',
    durationFrames: 297,
    icon: '📏',
    color: '#facc15',
  },

  // === POSTGRADUATE LEVEL ===
  {
    id: 'postgrad_intro',
    level: 'postgrad',
    title: '🔴 Postgraduate Level',
    text: 'Time for the full picture. We\'re solving the Navier-Stokes equations for viscous, compressible flow.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/postgrad_intro_vo.wav',
    durationFrames: 251,
    icon: '🎓',
    color: '#f87171',
  },
  {
    id: 'postgrad_navier',
    level: 'postgrad',
    title: 'Navier-Stokes Equations',
    text: 'Rho times the material derivative of velocity equals negative pressure gradient plus viscous stress tensor divergence plus body forces.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/postgrad_navier_vo.wav',
    durationFrames: 370,
    icon: '∂',
    color: '#f87171',
  },
  {
    id: 'postgrad_boundary',
    level: 'postgrad',
    title: 'Boundary Layer Theory',
    text: 'Near the wing surface, viscosity dominates. The boundary layer transitions from laminar to turbulent, affecting drag and separation.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/postgrad_boundary_vo.wav',
    durationFrames: 285,
    icon: '〰️',
    color: '#f87171',
  },
  {
    id: 'postgrad_cfd',
    level: 'postgrad',
    title: 'CFD & Turbulence Models',
    text: 'Modern analysis uses computational fluid dynamics with Reynolds-averaged Navier-Stokes and turbulence closure models like k-epsilon or k-omega SST.',
    voiceoverPath: 'assets/audio/voiceover/aircraft/postgrad_cfd_vo.wav',
    durationFrames: 317,
    icon: '💻',
    color: '#f87171',
  },

  // === OUTRO ===
  {
    id: 'outro',
    level: 'postgrad',
    title: 'From Simple to Complex 🧠',
    text: 'That\'s differential flow over wings - from basic pressure differences to solving partial differential equations. Follow for more aerospace science!',
    voiceoverPath: 'assets/audio/voiceover/aircraft/outro_vo.wav',
    durationFrames: 299,
    color: '#a78bfa',
  },
];

// Calculate total duration
const TOTAL_FRAMES = SECTIONS.reduce((sum, s) => sum + s.durationFrames, 0);

// Level badge component
const LevelBadge: React.FC<{ level: string; color: string }> = ({ level, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  const levelLabels: Record<string, string> = {
    beginner: 'BEGINNER',
    expert: 'EXPERT',
    postgrad: 'POSTGRADUATE',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        right: 40,
        transform: `scale(${scale})`,
        backgroundColor: color,
        padding: '8px 20px',
        borderRadius: 20,
        fontSize: 18,
        fontWeight: 800,
        color: '#000',
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: 1,
      }}
    >
      {levelLabels[level] || level.toUpperCase()}
    </div>
  );
};

// Animated title component
const AnimatedTitle: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <div
      style={{
        fontSize: 52,
        fontWeight: 800,
        color,
        transform: `scale(${scale})`,
        textAlign: 'center',
        textShadow: '0 4px 20px rgba(0,0,0,0.5)',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '0 40px',
      }}
    >
      {text}
    </div>
  );
};

// Icon animation
const AnimatedIcon: React.FC<{ icon: string }> = ({ icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 150 },
  });

  const float = Math.sin(frame * 0.1) * 10;

  return (
    <div
      style={{
        fontSize: 100,
        transform: `scale(${bounce}) translateY(${float}px)`,
        textAlign: 'center',
        marginBottom: 20,
      }}
    >
      {icon}
    </div>
  );
};

// Airflow visualization
const AirflowVisualization: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill style={{ opacity: 0.15 }}>
      {/* Streamlines */}
      {[...Array(8)].map((_, i) => {
        const yBase = 300 + i * 150;
        const offset = (frame * 3 + i * 50) % 1200;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: -200 + offset,
              top: yBase + Math.sin((frame + i * 20) * 0.05) * 30,
              width: 200,
              height: 3,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              borderRadius: 2,
              opacity: 0.6,
            }}
          />
        );
      })}
      
      {/* Wing silhouette */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '45%',
          transform: 'translate(-50%, -50%) rotate(-5deg)',
          width: 400,
          height: 80,
          background: `linear-gradient(180deg, ${color}40 0%, ${color}20 100%)`,
          borderRadius: '50% 50% 30% 30% / 60% 60% 40% 40%',
          boxShadow: `0 10px 40px ${color}30`,
        }}
      />
    </AbsoluteFill>
  );
};

// Section component
const SectionSlide: React.FC<{ section: Section }> = ({ section }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Generate transcript for captions
  const transcript = generateTranscriptFromText(section.text, 0.5, 130);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${section.color}25 0%, #0a0a1a 70%)`,
      }}
    >
      {/* Airflow visualization */}
      <AirflowVisualization color={section.color} />

      {/* Animated background particles */}
      <AbsoluteFill style={{ opacity: 0.4 }}>
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 37 + frame * 0.5) % 110 - 5}%`,
              top: `${(i * 53) % 100}%`,
              width: 3,
              height: 3,
              borderRadius: '50%',
              backgroundColor: section.color,
              transform: `translateY(${Math.sin((frame + i * 20) * 0.05) * 20}px)`,
              opacity: 0.4 + Math.sin((frame + i * 10) * 0.03) * 0.4,
            }}
          />
        ))}
      </AbsoluteFill>

      {/* Level badge */}
      <LevelBadge level={section.level} color={section.color} />

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        {section.icon && <AnimatedIcon icon={section.icon} />}
        {section.title && <AnimatedTitle text={section.title} color={section.color} />}
      </AbsoluteFill>

      {/* TikTok-style captions */}
      <TikTokCaptions
        transcript={transcript}
        style="glow"
        fontSize={44}
        accentColor={section.color}
        position="bottom"
        maxWordsVisible={5}
      />

      {/* Voiceover audio */}
      <Audio src={staticFile(section.voiceoverPath)} volume={1} />

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 4,
          width: `${(frame / section.durationFrames) * 100}%`,
          backgroundColor: section.color,
        }}
      />
    </AbsoluteFill>
  );
};

// Main composition
export const AircraftWingsVideo: React.FC = () => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      {SECTIONS.map((section, i) => {
        const from = currentFrame;
        currentFrame += section.durationFrames;

        return (
          <Sequence
            key={section.id}
            from={from}
            durationInFrames={section.durationFrames}
          >
            <SectionSlide section={section} />
          </Sequence>
        );
      })}

      {/* Transition SFX */}
      <Sequence from={0} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/transitions/whoosh_cinematic.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={150} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/ui/meme_sfx_pack_iconic.wav')} volume={0.25} />
      </Sequence>
      <Sequence from={560} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/ui/meme_sfx_pack_iconic.wav')} volume={0.25} />
      </Sequence>
      <Sequence from={1220} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/ui/meme_sfx_pack_iconic.wav')} volume={0.25} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const aircraftWingsDefaultProps = {};

// Export section data for voiceover generation
export const AIRCRAFT_SECTIONS = SECTIONS;
