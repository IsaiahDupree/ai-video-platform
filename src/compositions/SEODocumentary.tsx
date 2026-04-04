import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
} from 'remotion';

// ─── Chapter Data ─────────────────────────────────────────────────────────────
// Each chapter has: id, title, era, color, audioFile, durationSecs, description

export interface SEOChapter {
  id: string;
  title: string;
  era: string;
  color: string;
  audioFile: string;
  characterImageFile: string;
  durationSecs: number;
  description: string;
  keyFact: string;
}

export interface SEODocumentaryProps {
  chapters: SEOChapter[];
  characterImageUrl?: string; // Nano Banana character (Google ImageFX)
  showCharacter?: boolean;
}

// Default 11 chapters matching generate_voiceover.py
export const seoDocumentaryDefaultProps: SEODocumentaryProps = {
  showCharacter: true,
  characterImageUrl: '',  // set per-chapter via chapter config
  chapters: [
    {
      id: '00_intro',
      title: 'The Story of SEO',
      era: '1991 – 2030',
      color: '#00ff88',
      audioFile: 'seo_audio/00_intro.mp3',
      characterImageFile: 'seo_characters/00_intro_character.png',
      durationSecs: 60,
      description: 'From white-text keyword stuffing to AI Overviews — the complete evolution.',
      keyFact: '30 years of search evolution',
    },
    {
      id: '01_wild_west',
      title: 'The Wild West',
      era: '1991 – 1997',
      color: '#ff6b35',
      audioFile: 'seo_audio/01_wild_west.mp3',
      characterImageFile: 'seo_characters/01_wild_west_character.png',
      durationSecs: 180,
      description: 'Before Google, anyone with a keyboard could game the system.',
      keyFact: 'AltaVista. Yahoo. Keyword stuffing.',
    },
    {
      id: '02_pagerank',
      title: 'The PageRank Revolution',
      era: '1998 – 2002',
      color: '#4285f4',
      audioFile: 'seo_audio/02_pagerank.mp3',
      characterImageFile: 'seo_characters/02_pagerank_character.png',
      durationSecs: 150,
      description: 'Two Stanford students changed the internet forever.',
      keyFact: 'Google launches. Links become currency.',
    },
    {
      id: '03_algorithm_wars',
      title: 'The Algorithm Wars',
      era: '2003 – 2010',
      color: '#ea4335',
      audioFile: 'seo_audio/03_algorithm_wars.mp3',
      characterImageFile: 'seo_characters/03_algorithm_wars_character.png',
      durationSecs: 180,
      description: 'Black hat vs. white hat. The arms race begins.',
      keyFact: 'Florida. Big Daddy. Link farms explode.',
    },
    {
      id: '04_quality_revolution',
      title: 'The Quality Revolution',
      era: '2011 – 2013',
      color: '#fbbc04',
      audioFile: 'seo_audio/04_quality_revolution.mp3',
      characterImageFile: 'seo_characters/04_quality_revolution_character.png',
      durationSecs: 180,
      description: 'Panda. Penguin. The end of spam.',
      keyFact: '2012: 2.3 billion websites de-ranked.',
    },
    {
      id: '05_mobile_first',
      title: 'Mobile First',
      era: '2013 – 2016',
      color: '#34a853',
      audioFile: 'seo_audio/05_mobile_first.mp3',
      characterImageFile: 'seo_characters/05_mobile_first_character.png',
      durationSecs: 150,
      description: 'The smartphone changes everything.',
      keyFact: 'Mobilegeddon. Responsive design required.',
    },
    {
      id: '06_trust_language',
      title: 'Trust & Language',
      era: '2015 – 2019',
      color: '#9c27b0',
      audioFile: 'seo_audio/06_trust_language.mp3',
      characterImageFile: 'seo_characters/06_trust_language_character.png',
      durationSecs: 150,
      description: 'RankBrain. BERT. AI starts reading.',
      keyFact: 'E-A-T. Machine learning ranking.',
    },
    {
      id: '07_experience_era',
      title: 'The Experience Era',
      era: '2019 – 2022',
      color: '#00bcd4',
      audioFile: 'seo_audio/07_experience_era.mp3',
      characterImageFile: 'seo_characters/07_experience_era_character.png',
      durationSecs: 150,
      description: 'Core Web Vitals. Speed becomes a ranking factor.',
      keyFact: 'Page experience. UX = SEO.',
    },
    {
      id: '08_ai_disruption',
      title: 'AI Disruption',
      era: '2022 – 2024',
      color: '#ff4081',
      audioFile: 'seo_audio/08_ai_disruption.mp3',
      characterImageFile: 'seo_characters/08_ai_disruption_character.png',
      durationSecs: 180,
      description: 'ChatGPT. Helpful Content. The rules rewrite.',
      keyFact: 'AI-generated content floods search.',
    },
    {
      id: '09_geo_era',
      title: 'The GEO Era',
      era: '2024 – 2026',
      color: '#ff9800',
      audioFile: 'seo_audio/09_geo_era.mp3',
      characterImageFile: 'seo_characters/09_geo_era_character.png',
      durationSecs: 150,
      description: 'Generative Engine Optimization. Zero-click search.',
      keyFact: 'AI Overviews. Search evolves.',
    },
    {
      id: '10_future_outro',
      title: 'The Future of SEO',
      era: '2026 – 2030',
      color: '#00ff88',
      audioFile: 'seo_audio/10_future_outro.mp3',
      characterImageFile: 'seo_characters/10_future_outro_character.png',
      durationSecs: 120,
      description: 'What comes next. How to win.',
      keyFact: 'Agentic AI. Voice. Spatial computing.',
    },
  ],
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BG = '#050a14';
const TEXT = '#e8edf5';
const TEXT_DIM = '#7a8499';
const MONO = '"JetBrains Mono", monospace';
const SANS = '"Inter", system-ui, sans-serif';
const FPS = 30;

// ─── Helper: frames from seconds ─────────────────────────────────────────────
const sec = (s: number) => Math.round(s * FPS);

// ─── Chapter Title Card ───────────────────────────────────────────────────────
const ChapterCard: React.FC<{
  chapter: SEOChapter;
  localFrame: number;
  totalFrames: number;
}> = ({ chapter, localFrame, totalFrames }) => {
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(localFrame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const titleSlide = spring({ frame: localFrame - 5, fps, config: { damping: 18, stiffness: 80 } });
  const eraSlide = spring({ frame: localFrame - 15, fps, config: { damping: 20, stiffness: 70 } });
  const factSlide = spring({ frame: localFrame - 25, fps, config: { damping: 22, stiffness: 65 } });

  const progress = localFrame / totalFrames;
  const progressWidth = `${progress * 100}%`;

  const accentColor = chapter.color;

  return (
    <AbsoluteFill style={{ background: BG, opacity: fadeIn }}>
      {/* Subtle grid background */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Accent glow top-left */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
        }}
      />

      {/* Chapter number & era */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 80,
          opacity: eraSlide,
          transform: `translateX(${interpolate(eraSlide, [0, 1], [-20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 18,
            color: accentColor,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          {chapter.era}
        </div>
      </div>

      {/* Main title */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 80,
          right: 80,
          transform: `translateY(-50%) translateX(${interpolate(titleSlide, [0, 1], [-40, 0])}px)`,
          opacity: titleSlide,
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontSize: 96,
            fontWeight: 900,
            color: TEXT,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
          }}
        >
          {chapter.title}
        </div>

        {/* Accent line */}
        <div
          style={{
            height: 4,
            width: interpolate(titleSlide, [0, 1], [0, 120]),
            background: accentColor,
            borderRadius: 2,
            marginTop: 24,
            marginBottom: 32,
          }}
        />

        {/* Description */}
        <div
          style={{
            fontFamily: SANS,
            fontSize: 28,
            color: TEXT_DIM,
            lineHeight: 1.5,
            maxWidth: 800,
          }}
        >
          {chapter.description}
        </div>
      </div>

      {/* Key fact — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 80,
          opacity: factSlide,
          transform: `translateY(${interpolate(factSlide, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 16,
            color: TEXT_DIM,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          KEY FACT
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 22,
            color: accentColor,
            marginTop: 6,
          }}
        >
          {chapter.keyFact}
        </div>
      </div>

      {/* Progress bar — bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: progressWidth,
            background: accentColor,
            transition: 'width 0.1s linear',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Timeline Marker ─────────────────────────────────────────────────────────
const TimelineBar: React.FC<{
  chapters: SEOChapter[];
  currentChapterIndex: number;
  localProgress: number;
}> = ({ chapters, currentChapterIndex, localProgress }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 30,
        right: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'flex-end',
      }}
    >
      {chapters.map((ch, i) => {
        const isActive = i === currentChapterIndex;
        const isDone = i < currentChapterIndex;
        return (
          <div
            key={ch.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: isActive ? 1 : isDone ? 0.5 : 0.2,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 9,
                color: isActive ? ch.color : TEXT_DIM,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {ch.era.split(' – ')[0]}
            </div>
            <div
              style={{
                width: isActive ? 24 : 8,
                height: 2,
                background: isActive ? ch.color : TEXT_DIM,
                borderRadius: 1,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Documentary Composition ────────────────────────────────────────────
export const SEODocumentary: React.FC<SEODocumentaryProps> = ({
  chapters,
  showCharacter = false,
  characterImageUrl = '',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate cumulative frame offsets
  const chapterOffsets: number[] = [];
  let offset = 0;
  for (const ch of chapters) {
    chapterOffsets.push(offset);
    offset += sec(ch.durationSecs);
  }

  // Find current chapter
  let currentChapterIndex = 0;
  for (let i = 0; i < chapters.length; i++) {
    if (frame >= chapterOffsets[i]) currentChapterIndex = i;
  }
  const currentChapter = chapters[currentChapterIndex];
  const localFrame = frame - chapterOffsets[currentChapterIndex];
  const chapterDurationFrames = sec(currentChapter.durationSecs);

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Render each chapter as a Sequence */}
      {chapters.map((chapter, i) => (
        <Sequence
          key={chapter.id}
          from={chapterOffsets[i]}
          durationInFrames={sec(chapter.durationSecs)}
        >
          <ChapterCard
            chapter={chapter}
            localFrame={localFrame}
            totalFrames={chapterDurationFrames}
          />
          <Audio
            src={staticFile(chapter.audioFile)}
            volume={1}
          />
        </Sequence>
      ))}

      {/* Global timeline sidebar */}
      <TimelineBar
        chapters={chapters}
        currentChapterIndex={currentChapterIndex}
        localProgress={localFrame / chapterDurationFrames}
      />

      {/* Character overlay — per-chapter Nano Banana image */}
      {showCharacter && currentChapter.characterImageFile && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 80,
            width: 320,
            height: 200,
            borderRadius: 12,
            overflow: 'hidden',
            border: `2px solid ${currentChapter.color}44`,
            opacity: interpolate(localFrame, [0, 20], [0, 0.9], { extrapolateRight: 'clamp' }),
            boxShadow: `0 0 40px ${currentChapter.color}22`,
          }}
        >
          <img
            src={staticFile(currentChapter.characterImageFile)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          fontFamily: MONO,
          fontSize: 11,
          color: 'rgba(255,255,255,0.12)',
          letterSpacing: '0.1em',
        }}
      >
        SEODOCUMENTARY.COM
      </div>
    </AbsoluteFill>
  );
};

// ─── Total duration calculator ────────────────────────────────────────────────
export const getSEODocumentaryTotalFrames = (chapters: SEOChapter[]): number => {
  return chapters.reduce((acc, ch) => acc + sec(ch.durationSecs), 0);
};

export const seoDocumentaryTotalFrames = getSEODocumentaryTotalFrames(
  seoDocumentaryDefaultProps.chapters
);
