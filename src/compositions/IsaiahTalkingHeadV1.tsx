/**
 * IsaiahTalkingHeadV1 — Isaiah house style talking-head composition
 *
 * Layout (9:16, 1080x1920):
 *   [0–8%]   Top name bar: "Isaiah Dupree"
 *   [8–20%]  Summary strap: AI-generated hook, black on green
 *   [20–76%] Talking head video (face-safe)
 *   [76–92%] Bottom captions: black on green, phrase blocks
 *
 * ALL text is programmatic — nothing hardcoded.
 * Face boxes from analysis ensure overlays never cover the speaker.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  Video,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import type { IsaiahTalkingHeadV1Props, FaceBox, TranscriptWord } from "../types/IsaiahReelSchema";
import { loadIsaiahFonts } from "../lib/isaiahFonts";

// Load fonts once at module evaluation time (Remotion calls this during bundle)
loadIsaiahFonts();

// ─── Font constants ──────────────────────────────────────────────────────────

const FONT_MAP: Record<string, string> = {
  archivo_black: "'Archivo Black', sans-serif",
  anton_bold: "'Anton', sans-serif",
  sora_extrabold: "'Sora', sans-serif",
  space_grotesk_semibold: "'Space Grotesk', sans-serif",
  inter_bold: "'Inter', sans-serif",
  sora_bold: "'Sora', sans-serif",
};

// ─── Safe zone helpers ────────────────────────────────────────────────────────

function isFaceOverlapping(zone: { y: number; h: number }, box: FaceBox): boolean {
  const boxTop = box.y;
  const boxBottom = box.y + box.h;
  const zoneTop = zone.y;
  const zoneBottom = zone.y + zone.h;
  return !(zoneBottom < boxTop || zoneTop > boxBottom);
}

function getCapionYOffset(faceBoxes: FaceBox[], frameMs: number, defaultY: number): number {
  const nearestBox = faceBoxes.find(
    (b) => Math.abs(b.timeMs - frameMs) < 1000
  );
  if (!nearestBox) return defaultY;
  const captionZone = { y: defaultY, h: 0.16 };
  if (isFaceOverlapping(captionZone, nearestBox)) {
    // Push captions below face or above — choose below if space
    return Math.min(nearestBox.y + nearestBox.h + 0.01, 0.88);
  }
  return defaultY;
}

// ─── Caption chunking ─────────────────────────────────────────────────────────

interface CaptionPage {
  words: TranscriptWord[];
  startMs: number;
  endMs: number;
  text: string;
}

function chunkWordsToCaptionPages(words: TranscriptWord[], maxWordsPerPage: number): CaptionPage[] {
  if (words.length === 0) return [];

  const pages: CaptionPage[] = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + maxWordsPerPage);
    pages.push({
      words: chunk,
      startMs: chunk[0].startMs,
      endMs: chunk[chunk.length - 1].endMs,
      text: chunk.map((w) => w.word).join(" "),
    });
    i += maxWordsPerPage;
  }

  return pages;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const TopNameBar: React.FC<{
  brandName: string;
  fontFamily: string;
  textColor: string;
  bgColor: string;
}> = ({ brandName, fontFamily, textColor, bgColor }) => {
  const { width } = useVideoConfig();
  const frame = useCurrentFrame();

  const opacity = spring({
    frame,
    fps: 30,
    from: 0,
    to: 1,
    config: { damping: 20, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "8%",
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: width * 0.055,
          fontWeight: 900,
          color: textColor,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
        }}
      >
        {brandName}
      </span>
    </AbsoluteFill>
  );
};

const SummaryStrap: React.FC<{
  text: string;           // AI-generated — never hardcoded
  fontFamily: string;
  textColor: string;
  bgColor: string;
  topPercent?: number;
}> = ({ text, fontFamily, textColor, bgColor, topPercent = 8 }) => {
  const { width } = useVideoConfig();
  const frame = useCurrentFrame();

  const slideY = spring({
    frame,
    fps: 30,
    from: -40,
    to: 0,
    config: { damping: 18, stiffness: 180 },
  });

  const opacity = interpolate(frame, [0, 8], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        position: "absolute",
        top: `${topPercent}%`,
        left: "4%",
        right: "4%",
        maxHeight: "12%",
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 20,
        paddingRight: 20,
        transform: `translateY(${slideY}px)`,
        opacity,
        zIndex: 10,
        borderRadius: 6,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: width * 0.048,
          fontWeight: 900,
          color: textColor,
          letterSpacing: "-0.01em",
          textAlign: "center",
          lineHeight: 1.15,
          textTransform: "uppercase",
        }}
      >
        {text}
      </span>
    </AbsoluteFill>
  );
};

const CaptionPage: React.FC<{
  page: CaptionPage;
  fontFamily: string;
  textColor: string;
  bgColor: string;
  yPercent: number;
  animationMode: string;
}> = ({ page, fontFamily, textColor, bgColor, yPercent, animationMode }) => {
  const { width } = useVideoConfig();
  const frame = useCurrentFrame();

  const opacity =
    animationMode === "pop_in"
      ? spring({ frame, fps: 30, from: 0, to: 1, config: { damping: 12, stiffness: 300 } })
      : interpolate(frame, [0, 4], [0, 1]);

  const scale =
    animationMode === "pop_in"
      ? spring({ frame, fps: 30, from: 0.85, to: 1, config: { damping: 14, stiffness: 280 } })
      : 1;

  return (
    <AbsoluteFill
      style={{
        position: "absolute",
        bottom: `${100 - yPercent - 14}%`,
        left: "6%",
        right: "6%",
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center bottom",
        zIndex: 12,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          backgroundColor: bgColor,
          padding: "12px 20px",
          borderRadius: 6,
          maxWidth: "90%",
        }}
      >
        {animationMode === "karaoke_pop" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {page.words.map((w, i) => {
              const frameMsNow = (frame / 30) * 1000;
              const isActive = frameMsNow >= w.startMs && frameMsNow <= w.endMs;
              return (
                <span
                  key={i}
                  style={{
                    fontFamily,
                    fontSize: width * 0.052,
                    fontWeight: 800,
                    color: textColor,
                    opacity: isActive ? 1 : 0.45,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        ) : (
          <span
            style={{
              fontFamily,
              fontSize: width * 0.052,
              fontWeight: 800,
              color: textColor,
              letterSpacing: "-0.01em",
              lineHeight: 1.25,
              textAlign: "center",
              display: "block",
            }}
          >
            {page.text}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ─────────────────────────────────────────────────────────

export const IsaiahTalkingHeadV1: React.FC<IsaiahTalkingHeadV1Props> = ({
  sourceVideoUrl,
  transcriptWords,
  brandName,
  summaryStrapText,
  faceBoxes,
  selectedSegments,
  layoutRules,
  editPlan,
}) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const frameMs = (frame / fps) * 1000;

  const headlineFont = FONT_MAP[layoutRules.headlineFontPreset] ?? FONT_MAP.archivo_black;
  const captionFont = FONT_MAP[layoutRules.captionFontPreset] ?? FONT_MAP.space_grotesk_semibold;

  const captionPages = useMemo(
    () => chunkWordsToCaptionPages(transcriptWords, 6),
    [transcriptWords]
  );

  const activeCaptionPage = captionPages.find(
    (p) => frameMs >= p.startMs && frameMs <= p.endMs
  );

  const captionY = getCapionYOffset(faceBoxes, frameMs, 0.76);

  // Map selected segments to Remotion time ranges
  const primarySegment = selectedSegments[0];
  const videoStartMs = primarySegment?.startMs ?? 0;
  const videoEndMs = primarySegment?.endMs ?? undefined;

  // Zoom effect on emphasis moments
  const zoomTriggers = editPlan.zoomPlan.enabled ? editPlan.zoomPlan.triggerMoments : [];
  const nearestZoom = zoomTriggers.find((z) => Math.abs(z.atMs - frameMs) < 500);
  const zoomScale = nearestZoom
    ? interpolate(
        Math.abs(nearestZoom.atMs - frameMs),
        [0, 500],
        [1.06, 1.0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 1.0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", width, height }}>
      {/* Talking head video — main layer */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "center center",
        }}
      >
        <Video
          src={sourceVideoUrl}
          startFrom={Math.round((videoStartMs / 1000) * fps)}
          endAt={videoEndMs ? Math.round((videoEndMs / 1000) * fps) : undefined}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Gradient vignette at top and bottom for text readability */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 70%, rgba(0,0,0,0.55) 100%)",
          zIndex: 5,
        }}
      />

      {/* TOP NAME BAR — always Isaiah Dupree (programmatic) */}
      <TopNameBar
        brandName={brandName}
        fontFamily={headlineFont}
        textColor={layoutRules.summaryTextColor}
        bgColor={layoutRules.summaryBgColor}
      />

      {/* SUMMARY STRAP — AI-generated, black on green */}
      <SummaryStrap
        text={summaryStrapText}
        fontFamily={headlineFont}
        textColor={layoutRules.summaryTextColor}
        bgColor={layoutRules.summaryBgColor}
        topPercent={8}
      />

      {/* BOTTOM CAPTIONS — accurate to transcript, face-safe */}
      {activeCaptionPage && layoutRules.avoidFaceOverlap ? (
        <Sequence
          from={Math.round((activeCaptionPage.startMs / 1000) * fps)}
          durationInFrames={Math.round(
            ((activeCaptionPage.endMs - activeCaptionPage.startMs) / 1000) * fps
          )}
        >
          <CaptionPage
            page={activeCaptionPage}
            fontFamily={captionFont}
            textColor={layoutRules.captionTextColor}
            bgColor={layoutRules.captionBgColor}
            yPercent={Math.round(captionY * 100)}
            animationMode="pop_in"
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

export default IsaiahTalkingHeadV1;
