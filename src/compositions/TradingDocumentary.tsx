import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TradingChapter {
  id: string;
  title: string;
  era: string;
  color: string;
  audioFile: string;
  sceneImageFile?: string;
  durationSecs: number;
  description: string;
  keyFact: string;
  startSecs?: number;
  words?: WordTimestamp[];
}

export interface TradingDocumentaryProps {
  chapters: TradingChapter[];
}

// ─── Default Props (from render_props_trading.json) ───────────────────────────
export const tradingDocumentaryDefaultProps: TradingDocumentaryProps = {
  chapters: [
    {
      id: '00_intro',
      title: 'Money, Markets, and Mankind',
      era: '3000 BC – 2030',
      color: '#00ff88',
      audioFile: 'trading_audio/00_intro.mp3',
      sceneImageFile: 'trading_scene_images/00_intro_scene.jpg',
      durationSecs: 85.0,
      description: 'From clay tablets to quantum computers — the complete story of how humans learned to trade.',
      keyFact: '5,000 years of trading history',
    },
    {
      id: '01_first_traders',
      title: 'The First Traders',
      era: '3000 BC – 1600s',
      color: '#ff6b35',
      audioFile: 'trading_audio/01_first_traders.mp3',
      sceneImageFile: 'trading_scene_images/01_first_traders_scene.jpg',
      durationSecs: 204.9,
      description: 'Mesopotamian clay tablets. Phoenician ships. The Roman Forum. How civilization invented commerce.',
      keyFact: 'First recorded trade: 3000 BC, Mesopotamia',
    },
    {
      id: '02_stock_market_birth',
      title: 'The Birth of the Stock Market',
      era: '1602 – 1850',
      color: '#4285f4',
      audioFile: 'trading_audio/02_stock_market_birth.mp3',
      sceneImageFile: 'trading_scene_images/02_stock_market_birth_scene.jpg',
      durationSecs: 214.8,
      description: 'Amsterdam 1602. The VOC. Tulip mania. The Buttonwood Agreement. How stocks were born.',
      keyFact: 'VOC: First publicly traded company, 1602',
    },
    {
      id: '03_ticker_telegrams',
      title: 'Ticker Tape and Telegrams',
      era: '1844 – 1929',
      color: '#ea4335',
      audioFile: 'trading_audio/03_ticker_telegrams.mp3',
      sceneImageFile: 'trading_scene_images/03_ticker_telegrams_scene.jpg',
      durationSecs: 217.0,
      description: 'The telegraph. The ticker tape. J.P. Morgan saves the country twice. The roaring twenties.',
      keyFact: 'Ticker tape machine invented 1867 by Edward Calahan',
    },
    {
      id: '04_great_crash',
      title: 'The Great Crash',
      era: '1929 – 1970',
      color: '#fbbc04',
      audioFile: 'trading_audio/04_great_crash.mp3',
      sceneImageFile: 'trading_scene_images/04_great_crash_scene.jpg',
      durationSecs: 190.2,
      description: 'Black Thursday. Margin calls. 89% wiped out. The SEC. Glass-Steagall. The New Deal.',
      keyFact: 'Dow Jones fell 89% from 1929 peak to 1932 trough',
    },
    {
      id: '05_electronic_revolution',
      title: 'The Electronic Revolution',
      era: '1971 – 1987',
      color: '#34a853',
      audioFile: 'trading_audio/05_electronic_revolution.mp3',
      sceneImageFile: 'trading_scene_images/05_electronic_revolution_scene.jpg',
      durationSecs: 199.1,
      description: 'NASDAQ launches 1971. Bloomberg Terminal 1981. Black Monday 1987: -22.6% in one day.',
      keyFact: 'Black Monday 1987: largest single-day % drop in history',
    },
    {
      id: '06_quant_invasion',
      title: 'The Quant Invasion',
      era: '1988 – 2005',
      color: '#9c27b0',
      audioFile: 'trading_audio/06_quant_invasion.mp3',
      sceneImageFile: 'trading_scene_images/06_quant_invasion_scene.jpg',
      durationSecs: 223.4,
      description: 'Renaissance Technologies. D.E. Shaw. The Medallion Fund: 66% annualized returns. LTCM collapses.',
      keyFact: 'Medallion Fund: 66% average annual returns 1988–2018',
    },
    {
      id: '07_speed_wars',
      title: 'The Speed Wars',
      era: '2005 – 2012',
      color: '#00bcd4',
      audioFile: 'trading_audio/07_speed_wars.mp3',
      sceneImageFile: 'trading_scene_images/07_speed_wars_scene.jpg',
      durationSecs: 204.0,
      description: 'Reg NMS. Co-location. Microwave towers. The Flash Crash: $1 trillion gone in minutes.',
      keyFact: 'Flash Crash 2010: $1 trillion evaporated in 36 minutes',
    },
    {
      id: '08_reckoning_2008',
      title: 'The 2008 Reckoning',
      era: '2007 – 2010',
      color: '#ff4081',
      audioFile: 'trading_audio/08_reckoning_2008.mp3',
      sceneImageFile: 'trading_scene_images/08_reckoning_2008_scene.jpg',
      durationSecs: 202.8,
      description: 'CDOs. MBS. Credit default swaps. Lehman Brothers. The $700B bailout.',
      keyFact: '$19.2 trillion in US household wealth destroyed in 2008',
    },
    {
      id: '09_bitcoin_blockchain',
      title: 'Bitcoin and the Blockchain Revolution',
      era: '2009 – 2023',
      color: '#ff9800',
      audioFile: 'trading_audio/09_bitcoin_blockchain.mp3',
      sceneImageFile: 'trading_scene_images/09_bitcoin_blockchain_scene.jpg',
      durationSecs: 217.6,
      description: 'Satoshi Nakamoto. The genesis block. Ethereum. DeFi summer 2020. NFT mania.',
      keyFact: 'Bitcoin: from $0.001 in 2009 to $69,000 in 2021',
    },
    {
      id: '10_meme_revolution',
      title: 'GameStop and the Meme Revolution',
      era: '2020 – 2023',
      color: '#e91e63',
      audioFile: 'trading_audio/10_meme_revolution.mp3',
      sceneImageFile: 'trading_scene_images/10_meme_revolution_scene.jpg',
      durationSecs: 113.2,
      description: 'Reddit vs. Wall Street. GameStop +2,700%. Robinhood halts trading. Payment for order flow exposed.',
      keyFact: 'GME short interest was 140% of float — mathematically impossible',
    },
    {
      id: '11_trading_2030',
      title: 'Trading in 2030',
      era: '2024 – 2030',
      color: '#3f51b5',
      audioFile: 'trading_audio/11_trading_2030.mp3',
      sceneImageFile: 'trading_scene_images/11_trading_2030_scene.jpg',
      durationSecs: 243.1,
      description: 'AI autonomous agents. Quantum computing. Tokenized real-world assets. 24/7 global markets.',
      keyFact: 'By 2030: AI will execute 90%+ of all trades',
    },
  ],
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BG = '#020914';
const TEXT = '#e8edf5';
const TEXT_DIM = '#7a8499';
const MONO = '"JetBrains Mono", "Courier New", monospace';
const SANS = '"Inter", system-ui, sans-serif';
const FPS = 30;

const sec = (s: number) => Math.round(s * FPS);

// ─── Animated ticker tape background ─────────────────────────────────────────
const TickerBackground: React.FC<{ color: string; frame: number }> = ({ color, frame }) => {
  const tickers = ['NYSE', 'NASDAQ', 'SPY', 'BTC', 'ETH', 'AAPL', 'TSLA', 'GME', 'DJI', 'VOC', 'GOLD', 'OIL'];
  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity: 0.04 }}>
      {tickers.map((t, i) => (
        <div
          key={t}
          style={{
            position: 'absolute',
            top: `${(i / tickers.length) * 100}%`,
            left: `${((frame * (0.3 + i * 0.05) + i * 200) % 2200) - 200}px`,
            fontFamily: MONO,
            fontSize: 14,
            color,
            letterSpacing: '0.2em',
            whiteSpace: 'nowrap',
          }}
        >
          {t} ▲ {(Math.sin(frame * 0.02 + i) * 2 + 2).toFixed(2)}%{'   '}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ─── Captions ─────────────────────────────────────────────────────────────────
const Captions: React.FC<{
  words: WordTimestamp[];
  localFrame: number;
  accentColor: string;
}> = ({ words, localFrame, accentColor }) => {
  if (!words || words.length === 0) return null;

  const currentSec = localFrame / FPS;

  // Find the active word
  let activeIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (words[i].start <= currentSec) activeIdx = i;
    if (words[i].start > currentSec) break;
  }

  if (activeIdx < 0) return null;

  // Show a sliding window of ~10 words
  const WINDOW = 10;
  const lineStart = Math.floor(activeIdx / WINDOW) * WINDOW;
  const lineWords = words.slice(lineStart, lineStart + WINDOW);

  // Fade in new line at transitions
  const lineAge = activeIdx - lineStart;
  const lineOpacity = interpolate(lineAge, [0, 2], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        left: 60,
        right: 60,
        textAlign: 'center',
        opacity: lineOpacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(0,0,0,0.72)',
          borderRadius: 6,
          padding: '8px 22px 10px',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        {lineWords.map((w, i) => {
          const globalIdx = lineStart + i;
          const isActive = globalIdx === activeIdx;
          const isPast = w.end < currentSec;
          return (
            <span
              key={`${globalIdx}-${w.word}`}
              style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: 36,
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? accentColor
                  : isPast
                  ? 'rgba(255,255,255,0.45)'
                  : 'rgba(255,255,255,0.92)',
                marginRight: 9,
                textShadow: isActive
                  ? `0 0 24px ${accentColor}55`
                  : '0 1px 6px rgba(0,0,0,0.8)',
                letterSpacing: '0.01em',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ─── Chapter Card ─────────────────────────────────────────────────────────────
const ChapterCard: React.FC<{
  chapter: TradingChapter;
  localFrame: number;
  totalFrames: number;
  chapterIndex: number;
  totalChapters: number;
}> = ({ chapter, localFrame, totalFrames, chapterIndex, totalChapters }) => {
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(localFrame, [0, 35], [0, 1], { extrapolateRight: 'clamp' });
  const titleSlide = spring({ frame: localFrame - 5, fps, config: { damping: 18, stiffness: 80 } });
  const eraSlide = spring({ frame: localFrame - 10, fps, config: { damping: 20, stiffness: 70 } });
  const factSlide = spring({ frame: localFrame - 20, fps, config: { damping: 22, stiffness: 65 } });
  const progress = localFrame / totalFrames;
  const accentColor = chapter.color;

  // Slow ken-burns zoom on scene image
  const sceneScale = interpolate(localFrame, [0, totalFrames], [1.0, 1.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Fade out last 35 frames
  const fadeOut = interpolate(
    localFrame,
    [totalFrames - 35, totalFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill style={{ background: BG, opacity }}>
      {/* ── Scene image background with ken-burns ── */}
      {chapter.sceneImageFile && (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={staticFile(chapter.sceneImageFile)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${sceneScale})`,
              transformOrigin: 'center center',
            }}
          />
          {/* Dark overlay so text remains legible */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(
                135deg,
                rgba(2,9,20,0.82) 0%,
                rgba(2,9,20,0.55) 50%,
                rgba(2,9,20,0.75) 100%
              )`,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Animated ticker tape (subtle on top of scene) */}
      <TickerBackground color={accentColor} frame={localFrame} />

      {/* Bottom gradient for grounding */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 400,
          background: `linear-gradient(transparent, ${BG}cc, ${BG})`,
        }}
      />

      {/* Top gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          background: `linear-gradient(${BG}88, transparent)`,
        }}
      />

      {/* Accent glow top-left */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Chapter number badge */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 80,
          opacity: eraSlide,
          transform: `translateX(${interpolate(eraSlide, [0, 1], [-20, 0])}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 13,
            color: accentColor,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            border: `1px solid ${accentColor}55`,
            padding: '4px 14px',
            borderRadius: 4,
            background: `${accentColor}10`,
            backdropFilter: 'blur(4px)',
          }}
        >
          CHAPTER {String(chapterIndex + 1).padStart(2, '0')}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 13,
            color: TEXT_DIM,
            letterSpacing: '0.12em',
          }}
        >
          {chapter.era}
        </div>
      </div>

      {/* Main title — left side */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: 80,
          right: 200,
          transform: `translateY(-50%) translateX(${interpolate(titleSlide, [0, 1], [-50, 0])}px)`,
          opacity: titleSlide,
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontSize: chapter.title.length > 25 ? 72 : 84,
            fontWeight: 900,
            color: TEXT,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            textShadow: '0 4px 40px rgba(0,0,0,0.6)',
          }}
        >
          {chapter.title}
        </div>

        {/* Accent bar */}
        <div
          style={{
            height: 4,
            width: interpolate(titleSlide, [0, 1], [0, 140]),
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}33)`,
            borderRadius: 2,
            marginTop: 20,
            marginBottom: 22,
          }}
        />

        <div
          style={{
            fontFamily: SANS,
            fontSize: 24,
            color: 'rgba(232,237,245,0.8)',
            lineHeight: 1.5,
            maxWidth: 780,
            textShadow: '0 2px 16px rgba(0,0,0,0.5)',
          }}
        >
          {chapter.description}
        </div>
      </div>

      {/* Key fact */}
      <div
        style={{
          position: 'absolute',
          bottom: 110,
          left: 80,
          opacity: factSlide,
          transform: `translateY(${interpolate(factSlide, [0, 1], [20, 0])}px)`,
          maxWidth: 1600,
        }}
      >
        <div style={{
          fontFamily: MONO,
          fontSize: 10,
          color: `${accentColor}99`,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          KEY FACT
        </div>
        <div style={{
          fontFamily: MONO,
          fontSize: 18,
          color: accentColor,
          textShadow: `0 0 20px ${accentColor}44`,
        }}>
          {chapter.keyFact}
        </div>
      </div>

      {/* Captions */}
      <Captions words={chapter.words ?? []} localFrame={localFrame} accentColor={accentColor} />

      {/* Chapter progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: accentColor }} />
      </div>

      {/* Overall documentary progress */}
      <div style={{ position: 'absolute', bottom: 3, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.03)' }}>
        <div
          style={{
            height: '100%',
            width: `${((chapterIndex + progress) / totalChapters) * 100}%`,
            background: `${accentColor}55`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Timeline Sidebar ─────────────────────────────────────────────────────────
const TimelineSidebar: React.FC<{ chapters: TradingChapter[]; currentIndex: number }> = ({
  chapters,
  currentIndex,
}) => (
  <div style={{ position: 'absolute', top: 40, right: 50, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
    {chapters.map((ch, i) => {
      const isActive = i === currentIndex;
      const isDone = i < currentIndex;
      return (
        <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isActive ? 1 : isDone ? 0.4 : 0.15 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: isActive ? ch.color : TEXT_DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {ch.era.split(' – ')[0]}
          </div>
          <div style={{ width: isActive ? 20 : 6, height: 2, background: isActive ? ch.color : TEXT_DIM, borderRadius: 1 }} />
        </div>
      );
    })}
  </div>
);

// ─── Main Composition ─────────────────────────────────────────────────────────
export const TradingDocumentary: React.FC<TradingDocumentaryProps> = ({
  chapters,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chapterOffsets: number[] = [];
  let offset = 0;
  for (const ch of chapters) {
    chapterOffsets.push(offset);
    offset += sec(ch.durationSecs);
  }

  let currentChapterIndex = 0;
  for (let i = 0; i < chapters.length; i++) {
    if (frame >= chapterOffsets[i]) currentChapterIndex = i;
  }

  const localFrame = frame - chapterOffsets[currentChapterIndex];
  const chapterDurationFrames = sec(chapters[currentChapterIndex].durationSecs);

  return (
    <AbsoluteFill style={{ background: BG }}>
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
            chapterIndex={i}
            totalChapters={chapters.length}
          />
          <Audio src={staticFile(chapter.audioFile)} volume={1} />
        </Sequence>
      ))}

      <TimelineSidebar chapters={chapters} currentIndex={currentChapterIndex} />

      {/* Watermark */}
      <div style={{
        position: 'absolute', bottom: 18, right: 18,
        fontFamily: MONO, fontSize: 10,
        color: 'rgba(255,255,255,0.1)', letterSpacing: '0.1em',
      }}>
        TRADINGBOT · MONEY, MARKETS & MANKIND
      </div>
    </AbsoluteFill>
  );
};

export const getTradingDocumentaryTotalFrames = (chapters: TradingChapter[]): number =>
  chapters.reduce((acc, ch) => acc + sec(ch.durationSecs), 0);

export const tradingDocumentaryTotalFrames = getTradingDocumentaryTotalFrames(
  tradingDocumentaryDefaultProps.chapters
);
