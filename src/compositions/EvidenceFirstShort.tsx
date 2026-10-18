import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface EvidenceTimelineBeat {
  beat: string;
  start: number;
  end: number;
  text: string;
}

export interface EvidenceFirstShortProps extends Record<string, unknown> {
  scriptId: string;
  topic: string;
  audience: string;
  audioSrc: string;
  timeline: EvidenceTimelineBeat[];
  narrationTimeline: EvidenceTimelineBeat[];
  evidenceSummary: {
    viralTranscriptPatterns: number;
    observedViewsSnapshot: number;
  };
  sourceReceiptIds: string[];
}

const COLORS = {
  background: "#070A0F",
  panel: "#0D141D",
  panelSoft: "#111C28",
  cyan: "#00E5FF",
  amber: "#FFB300",
  white: "#F7FAFC",
  muted: "#91A4B7",
  green: "#32D583",
  red: "#FF5A67",
};

export const evidenceFirstShortDefaultProps: EvidenceFirstShortProps = {
  scriptId: "script-preview",
  topic: "Evidence-first content systems",
  audience: "software founders building AI automation",
  audioSrc: "",
  timeline: [
    {
      beat: "human_hook",
      start: 0,
      end: 3,
      text: "You know that moment when viewers leave before the point arrives?",
    },
    {
      beat: "stakes",
      start: 3,
      end: 8,
      text: "You burned time and generation cost without learning what failed.",
    },
    {
      beat: "claim",
      start: 8,
      end: 15,
      text: "Every script needs source receipts and quality gates.",
    },
    {
      beat: "proof",
      start: 15,
      end: 23,
      text: "Three transcript patterns. Two hundred ninety-seven observed views.",
    },
    {
      beat: "method",
      start: 23,
      end: 31,
      text: "Start human. Show the receipt. Reveal the mechanism.",
    },
    {
      beat: "payoff",
      start: 31,
      end: 38,
      text: "Give founders a reason to keep watching.",
    },
    {
      beat: "cta",
      start: 38,
      end: 43,
      text: "Save this structure and test it.",
    },
  ],
  narrationTimeline: [
    {
      beat: "human_hook",
      start: 0,
      end: 3,
      text: "You know that moment when viewers leave before the point arrives?",
    },
    {
      beat: "stakes",
      start: 3,
      end: 8,
      text: "You burned time and generation cost without learning what failed.",
    },
    {
      beat: "claim",
      start: 8,
      end: 15,
      text: "Every script needs source receipts and quality gates.",
    },
    {
      beat: "proof",
      start: 15,
      end: 23,
      text: "Three transcript patterns. Two hundred ninety-seven observed views.",
    },
    {
      beat: "method",
      start: 23,
      end: 31,
      text: "Start human. Show the receipt. Reveal the mechanism.",
    },
    {
      beat: "payoff",
      start: 31,
      end: 38,
      text: "Give founders a reason to keep watching.",
    },
    {
      beat: "cta",
      start: 38,
      end: 43,
      text: "Save this structure and test it.",
    },
  ],
  evidenceSummary: { viralTranscriptPatterns: 3, observedViewsSnapshot: 297 },
  sourceReceiptIds: [],
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = COLORS.cyan,
}) => (
  <div
    style={{
      color,
      fontFamily: "SFMono-Regular, Menlo, ui-monospace, monospace",
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const Panel: React.FC<{
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ children, accent = COLORS.cyan, style }) => (
  <div
    style={{
      width: "100%",
      borderRadius: 32,
      border: `2px solid ${accent}55`,
      background: `linear-gradient(145deg, ${COLORS.panel}F5, ${COLORS.panelSoft}E8)`,
      boxShadow: `0 0 70px ${accent}1F, inset 0 1px 0 rgba(255,255,255,0.06)`,
      padding: 46,
      ...style,
    }}
  >
    {children}
  </div>
);

const BigText: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
  align?: "left" | "center";
}> = ({ children, color = COLORS.white, size = 78, align = "left" }) => (
  <div
    style={{
      color,
      fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
      fontSize: size,
      fontWeight: 900,
      lineHeight: 0.98,
      letterSpacing: "-0.055em",
      textAlign: align,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const Metric: React.FC<{
  value: string | number;
  label: string;
  color: string;
  progress: number;
}> = ({ value, label, color, progress }) => {
  const scale = interpolate(progress, [0, 0.28, 1], [0.72, 1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.7)),
  });
  return (
    <Panel
      accent={color}
      style={{
        flex: 1,
        minHeight: 330,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{ transform: `scale(${scale})`, transformOrigin: "left center" }}
      >
        <div
          style={{
            fontSize: 150,
            fontWeight: 950,
            lineHeight: 0.9,
            color,
            letterSpacing: "-0.08em",
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: 28,
            color: COLORS.white,
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          {label}
        </div>
      </div>
    </Panel>
  );
};

const Caption: React.FC<{ beat: EvidenceTimelineBeat; progress: number }> = ({
  beat,
  progress,
}) => {
  const words = beat.text.split(/\s+/).filter(Boolean);
  const activeIndex = Math.min(
    words.length - 1,
    Math.floor(progress * words.length),
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        right: 48,
        bottom: 92,
        zIndex: 30,
        padding: "28px 32px 30px",
        borderRadius: 26,
        backgroundColor: "rgba(4,8,13,0.93)",
        border: `1px solid ${COLORS.cyan}66`,
        boxShadow: "0 16px 50px rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
          fontSize: 39,
          fontWeight: 800,
          lineHeight: 1.22,
        }}
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            style={{ color: index <= activeIndex ? COLORS.white : "#617386" }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

const BeatVisual: React.FC<{
  beat: EvidenceTimelineBeat;
  progress: number;
  props: EvidenceFirstShortProps;
}> = ({ beat, progress, props }) => {
  const enter = interpolate(progress, [0, 0.16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const translateY = interpolate(enter, [0, 1], [70, 0]);
  const baseStyle: React.CSSProperties = {
    width: "100%",
    opacity: enter,
    transform: `translateY(${translateY}px)`,
  };

  if (beat.beat === "human_hook") {
    return (
      <div style={baseStyle}>
        <Kicker>THE HUMAN MOMENT</Kicker>
        <div style={{ height: 30 }} />
        <BigText size={94}>YOU DID THE WORK.</BigText>
        <BigText size={94} color={COLORS.red}>
          THEY LEFT EARLY.
        </BigText>
        <div
          style={{
            marginTop: 48,
            height: 12,
            borderRadius: 12,
            background: "#172534",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.max(8, progress * 100)}%`,
              background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.red})`,
            }}
          />
        </div>
      </div>
    );
  }

  if (beat.beat === "stakes") {
    return (
      <div style={baseStyle}>
        <Kicker color={COLORS.red}>THE COST OF NO FEEDBACK</Kicker>
        <div style={{ height: 34 }} />
        <Panel accent={COLORS.red}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}
          >
            {[
              ["TIME", "SPENT"],
              ["GENERATION", "COST"],
              ["ATTENTION", "LOST"],
              ["LEARNING", "ZERO"],
            ].map(([label, value], index) => (
              <div
                key={label}
                style={{
                  padding: 28,
                  borderRadius: 22,
                  background: index === 3 ? `${COLORS.red}26` : "#08111A",
                  border: `1px solid ${index === 3 ? COLORS.red : "#263849"}`,
                }}
              >
                <div
                  style={{ fontSize: 24, color: COLORS.muted, fontWeight: 800 }}
                >
                  {label}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 46,
                    color: index === 3 ? COLORS.red : COLORS.white,
                    fontWeight: 950,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  if (beat.beat === "claim") {
    return (
      <div style={baseStyle}>
        <Kicker>RELIABILITY REQUIRES RECEIPTS</Kicker>
        <div style={{ height: 30 }} />
        <BigText size={72}>SCRIPT → PROOF → GATES</BigText>
        <div style={{ height: 46 }} />
        {[
          ["SOURCE RECEIPTS", COLORS.amber],
          ["HUMAN RELATABILITY", COLORS.cyan],
          ["ATTENTION GATE", COLORS.green],
        ].map(([label, color], index) => {
          const itemEnter = clamp((progress - index * 0.12) / 0.25);
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginBottom: 22,
                opacity: itemEnter,
                transform: `translateX(${(1 - itemEnter) * 60}px)`,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  background: `${color}22`,
                  color,
                  border: `2px solid ${color}`,
                  fontSize: 30,
                  fontWeight: 950,
                }}
              >
                ✓
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "24px 28px",
                  borderRadius: 20,
                  background: COLORS.panel,
                  border: `1px solid ${color}55`,
                  color: COLORS.white,
                  fontSize: 36,
                  fontWeight: 900,
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (beat.beat === "proof") {
    return (
      <div style={baseStyle}>
        <Kicker color={COLORS.amber}>CURRENT MARKET TAPE RECEIPT</Kicker>
        <div style={{ height: 36 }} />
        <div style={{ display: "flex", gap: 28 }}>
          <Metric
            value={props.evidenceSummary.viralTranscriptPatterns}
            label="SOURCE TRANSCRIPT PATTERNS"
            color={COLORS.cyan}
            progress={progress}
          />
          <Metric
            value={props.evidenceSummary.observedViewsSnapshot}
            label="OBSERVED VIEWS"
            color={COLORS.amber}
            progress={progress}
          />
        </div>
        <div
          style={{
            marginTop: 30,
            display: "flex",
            justifyContent: "space-between",
            color: COLORS.muted,
            fontFamily: "SFMono-Regular, Menlo, monospace",
            fontSize: 20,
          }}
        >
          <span>SNAPSHOT / OBSERVED DATA</span>
          <span>{props.sourceReceiptIds.length} RECEIPTS LINKED</span>
        </div>
      </div>
    );
  }

  if (beat.beat === "method") {
    return (
      <div style={baseStyle}>
        <Kicker>THE STRUCTURE</Kicker>
        <div style={{ height: 34 }} />
        {[
          ["01", "START HUMAN", "Recognizable situation", COLORS.cyan],
          ["02", "SHOW THE RECEIPT", "Observed evidence", COLORS.amber],
          ["03", "REVEAL THE MECHANISM", "Why it works", COLORS.green],
        ].map(([number, title, subtitle, color], index) => {
          const itemEnter = clamp((progress - index * 0.15) / 0.26);
          return (
            <div
              key={number}
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 22,
                marginBottom: 24,
                opacity: itemEnter,
                transform: `translateY(${(1 - itemEnter) * 45}px)`,
              }}
            >
              <div
                style={{
                  width: 100,
                  borderRadius: 24,
                  display: "grid",
                  placeItems: "center",
                  background: color,
                  color: COLORS.background,
                  fontSize: 36,
                  fontWeight: 950,
                }}
              >
                {number}
              </div>
              <Panel accent={color} style={{ padding: "28px 32px" }}>
                <div
                  style={{ fontSize: 38, color: COLORS.white, fontWeight: 950 }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 25,
                    color: COLORS.muted,
                    fontWeight: 700,
                    marginTop: 7,
                  }}
                >
                  {subtitle}
                </div>
              </Panel>
            </div>
          );
        })}
      </div>
    );
  }

  if (beat.beat === "payoff") {
    const ring = interpolate(progress, [0, 1], [0, 360]);
    return (
      <div style={baseStyle}>
        <Kicker color={COLORS.green}>THE PAYOFF</Kicker>
        <div style={{ height: 38 }} />
        <Panel
          accent={COLORS.green}
          style={{
            minHeight: 650,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 210,
              height: 210,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: `conic-gradient(${COLORS.green} ${ring}deg, #172534 ${ring}deg)`,
              padding: 14,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: COLORS.panel,
                color: COLORS.green,
                fontSize: 68,
                fontWeight: 950,
              }}
            >
              →
            </div>
          </div>
          <div style={{ height: 42 }} />
          <BigText align="center" size={76}>
            A REASON TO KEEP WATCHING
          </BigText>
          <div
            style={{
              marginTop: 28,
              color: COLORS.muted,
              fontSize: 31,
              fontWeight: 700,
            }}
          >
            before you ask founders to act
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      <Kicker color={COLORS.amber}>NEXT TEST</Kicker>
      <div style={{ height: 34 }} />
      <Panel
        accent={COLORS.amber}
        style={{
          minHeight: 720,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <BigText color={COLORS.amber} size={104}>
          SAVE THIS STRUCTURE.
        </BigText>
        <div style={{ height: 34 }} />
        <div
          style={{
            fontSize: 42,
            color: COLORS.white,
            lineHeight: 1.25,
            fontWeight: 800,
          }}
        >
          Test it against your next real result.
        </div>
        <div style={{ height: 56 }} />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {["HUMAN", "RECEIPT", "MECHANISM"].map((label, index) => (
            <div
              key={label}
              style={{
                padding: "18px 24px",
                borderRadius: 16,
                background: index === 1 ? COLORS.amber : "#0B1620",
                color: index === 1 ? COLORS.background : COLORS.white,
                border: `1px solid ${COLORS.amber}88`,
                fontSize: 25,
                fontWeight: 950,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

export const EvidenceFirstShort: React.FC<EvidenceFirstShortProps> = (
  props,
) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const second = frame / fps;
  const beat =
    props.timeline.find((item) => second >= item.start && second < item.end) ??
    props.timeline.at(-1);
  const captionBeat =
    props.narrationTimeline.find(
      (item) => second >= item.start && second < item.end,
    ) ?? props.narrationTimeline.at(-1);
  if (!beat || !captionBeat) return null;
  const beatProgress = clamp(
    (second - beat.start) / Math.max(0.01, beat.end - beat.start),
  );
  const captionProgress = clamp(
    (second - captionBeat.start) /
      Math.max(0.01, captionBeat.end - captionBeat.start),
  );
  const globalProgress = frame / Math.max(1, durationInFrames - 1);
  const gridShift = (frame * 1.3) % 72;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        color: COLORS.white,
        overflow: "hidden",
      }}
    >
      {props.audioSrc ? (
        <Audio src={staticFile(props.audioSrc)} volume={1} />
      ) : null}

      <AbsoluteFill
        style={{
          opacity: 0.22,
          backgroundImage: `linear-gradient(${COLORS.cyan}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.cyan}22 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          backgroundPosition: `${gridShift}px ${gridShift}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 70% 12%, rgba(0,229,255,0.14), transparent 38%), radial-gradient(circle at 18% 74%, rgba(255,179,0,0.10), transparent 42%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 62,
          left: 52,
          right: 52,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: COLORS.green,
              boxShadow: `0 0 24px ${COLORS.green}`,
            }}
          />
          <div
            style={{
              fontFamily: "SFMono-Regular, Menlo, monospace",
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "0.14em",
            }}
          >
            MARKET TAPE / LIVE RECEIPT
          </div>
        </div>
        <div
          style={{
            fontFamily: "SFMono-Regular, Menlo, monospace",
            color: COLORS.muted,
            fontSize: 18,
          }}
        >
          {props.scriptId.slice(0, 22)}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 150,
          left: 52,
          right: 52,
          bottom: 330,
          display: "flex",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <BeatVisual beat={beat} progress={beatProgress} props={props} />
      </div>

      <Caption beat={captionBeat} progress={captionProgress} />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 13,
          background: "#142331",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${globalProgress * 100}%`,
            background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.amber})`,
            boxShadow: `0 0 24px ${COLORS.cyan}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default EvidenceFirstShort;
