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
  Img,
} from 'remotion';
import { TikTokCaptions, TikTokStyle } from '../components/TikTokCaptions';
import { generateTranscriptFromText } from '../components/AnimatedCaptions';

// =============================================================================
// Thermodynamics Explainer Video
// =============================================================================

interface Section {
  id: string;
  title: string;
  text: string;
  voiceoverPath: string;
  durationFrames: number;
  icon?: string;
  color: string;
}

const SECTIONS: Section[] = [
  {
    id: 'hook',
    title: '',
    text: 'What if I told you that everything in the universe follows just four simple rules?',
    voiceoverPath: 'assets/audio/voiceover/hook_vo.wav',
    durationFrames: 120,
    color: '#ff6b35',
  },
  {
    id: 'intro',
    title: 'The Laws of Thermodynamics',
    text: 'These are the laws of thermodynamics. The rules that govern energy in our universe.',
    voiceoverPath: 'assets/audio/voiceover/intro_vo.wav',
    durationFrames: 120,
    color: '#ff6b35',
  },
  {
    id: 'zeroth_law',
    title: '0️⃣ Zeroth Law',
    text: 'The zeroth law. If two systems are in thermal equilibrium with a third system, they are in equilibrium with each other.',
    voiceoverPath: 'assets/audio/voiceover/zeroth_law_vo.wav',
    durationFrames: 180,
    icon: '🌡️',
    color: '#4ecdc4',
  },
  {
    id: 'first_law',
    title: '1️⃣ First Law',
    text: 'The first law. Energy cannot be created or destroyed, only transformed.',
    voiceoverPath: 'assets/audio/voiceover/first_law_vo.wav',
    durationFrames: 150,
    icon: '⚡',
    color: '#ffe66d',
  },
  {
    id: 'second_law',
    title: '2️⃣ Second Law',
    text: 'The second law. Entropy always increases. Heat flows from hot to cold, never the reverse.',
    voiceoverPath: 'assets/audio/voiceover/second_law_vo.wav',
    durationFrames: 180,
    icon: '🔥',
    color: '#ff6b6b',
  },
  {
    id: 'third_law',
    title: '3️⃣ Third Law',
    text: 'The third law. As temperature approaches absolute zero, entropy approaches a minimum.',
    voiceoverPath: 'assets/audio/voiceover/third_law_vo.wav',
    durationFrames: 150,
    icon: '❄️',
    color: '#74b9ff',
  },
  {
    id: 'outro',
    title: 'Now You Know! 🧠',
    text: 'These four laws explain everything from why ice melts to why stars shine. Follow for more science!',
    voiceoverPath: 'assets/audio/voiceover/outro_vo.wav',
    durationFrames: 150,
    color: '#a29bfe',
  },
];

// Calculate total duration
const TOTAL_FRAMES = SECTIONS.reduce((sum, s) => sum + s.durationFrames, 0);

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
        fontSize: 56,
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
        fontSize: 120,
        transform: `scale(${bounce}) translateY(${float}px)`,
        textAlign: 'center',
        marginBottom: 30,
      }}
    >
      {icon}
    </div>
  );
};

// Section component
const SectionSlide: React.FC<{ section: Section }> = ({ section }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Generate transcript for captions
  const transcript = generateTranscriptFromText(section.text, 0.5, 130);

  // Background pulse
  const pulse = Math.sin(frame * 0.05) * 0.1 + 0.9;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${section.color}33 0%, #0a0a1a 70%)`,
      }}
    >
      {/* Animated background particles */}
      <AbsoluteFill style={{ opacity: 0.3 }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: section.color,
              transform: `translateY(${Math.sin((frame + i * 20) * 0.05) * 30}px)`,
              opacity: 0.5 + Math.sin((frame + i * 10) * 0.03) * 0.5,
            }}
          />
        ))}
      </AbsoluteFill>

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
        style="bouncy"
        fontSize={48}
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
export const ThermodynamicsVideo: React.FC = () => {
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

      {/* SFX layer */}
      <Sequence from={0} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/transitions/whoosh_cinematic.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={120} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/ui/meme_sfx_pack_iconic.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={240} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/ui/meme_sfx_pack_iconic.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={420} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/ui/meme_sfx_pack_iconic.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={600} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/ui/meme_sfx_pack_iconic.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={780} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/ui/meme_sfx_pack_iconic.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={930} durationInFrames={30}>
        <Audio src={staticFile('assets/sfx/impacts/fahhh_tiktok.wav')} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const thermodynamicsDefaultProps = {};
