"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Columns2,
  Image as ImageIcon,
  Play,
  ChevronDown,
  BarChart3,
  Trophy,
} from "lucide-react";
import { getBatch, type AdBatch, type AdVariant } from "@/lib/api";

const SIZE_LABELS: Record<string, string> = {
  feed_square: "Feed 1:1",
  feed_portrait: "Feed 4:5",
  story: "Story 9:16",
  reels: "Reels 9:16",
  fb_feed: "FB Feed",
  fb_square: "FB Square",
};

const TEMPLATE_LABELS: Record<string, string> = {
  before_after: "Before/After",
  testimonial: "Testimonial",
  product_demo: "Product Demo",
  problem_solution: "Problem/Solution",
  stat_counter: "Stat Counter",
  feature_list: "Feature List",
  urgency: "Urgency",
};

function VariantPreview({
  variant,
  size,
  mediaType,
  side,
}: {
  variant: AdVariant;
  size: string;
  mediaType: "image" | "video";
  side: "A" | "B";
}) {
  const path =
    mediaType === "video"
      ? variant.assets.videoPaths?.[size]
      : variant.assets.composedPaths?.[size];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex-1">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${
              side === "A" ? "bg-accent" : "bg-emerald-500"
            }`}
          >
            {side}
          </span>
          <div>
            <p className="text-xs font-medium">v{String(variant.variantIndex).padStart(2, "0")}</p>
            <p className="text-[10px] text-muted-foreground">
              {TEMPLATE_LABELS[variant.parameters.visual.template]}
            </p>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {SIZE_LABELS[size] || size}
        </span>
      </div>

      {/* Preview */}
      <div className="relative bg-black/20 flex items-center justify-center min-h-[300px]">
        {!path ? (
          <p className="text-xs text-muted-foreground">No asset for this size</p>
        ) : mediaType === "video" ? (
          <video
            src={`/api/file?path=${encodeURIComponent(path)}`}
            controls
            loop
            className="max-h-[500px] w-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/file?path=${encodeURIComponent(path)}`}
            alt={variant.parameters.copy.headline}
            className="max-h-[500px] w-full object-contain"
          />
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2 text-xs">
        <p className="font-medium line-clamp-2">{variant.parameters.copy.headline}</p>
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div>
            <span className="text-[10px]">Hook</span>
            <p className="text-foreground capitalize">{variant.parameters.copy.hookType}</p>
          </div>
          <div>
            <span className="text-[10px]">Awareness</span>
            <p className="text-foreground capitalize">
              {variant.parameters.targeting.awarenessLevel.replace("_", " ")}
            </p>
          </div>
          <div>
            <span className="text-[10px]">CTA</span>
            <p className="text-foreground">{variant.parameters.copy.ctaText}</p>
          </div>
          <div>
            <span className="text-[10px]">Template</span>
            <p className="text-foreground">
              {TEMPLATE_LABELS[variant.parameters.visual.template]}
            </p>
          </div>
        </div>

        {/* Performance */}
        {variant.performance && (
          <div className="pt-2 border-t border-border grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-bold">{(variant.performance.ctr * 100).toFixed(2)}%</p>
              <p className="text-[10px] text-muted-foreground">CTR</p>
            </div>
            <div>
              <p className="text-sm font-bold">${variant.performance.cpc?.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">CPC</p>
            </div>
            <div>
              <p className="text-sm font-bold">{variant.performance.roas?.toFixed(1)}x</p>
              <p className="text-[10px] text-muted-foreground">ROAS</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batch") || "";

  const [batch, setBatch] = useState<AdBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantA, setVariantA] = useState<number>(0);
  const [variantB, setVariantB] = useState<number>(1);
  const [size, setSize] = useState("feed_square");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");

  useEffect(() => {
    if (!batchId) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const data = await getBatch(batchId);
        setBatch(data);
        if (data.variants.length > 1) setVariantB(1);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!batch || !batchId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Compare Variants</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Pick a batch to compare two ad variants side by side.
        </p>
        <div className="text-center py-20 rounded-xl border border-border bg-card">
          <Columns2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-3">
            Open this page from a batch detail view, or provide a batch ID in the URL.
          </p>
          <Link href="/batches" className="text-sm text-accent hover:underline">
            Browse batches →
          </Link>
        </div>
      </div>
    );
  }

  const vA = batch.variants[variantA];
  const vB = batch.variants[variantB];

  const allSizes = [
    ...new Set(
      batch.variants.flatMap((v) => [
        ...Object.keys(v.assets.composedPaths || {}),
        ...Object.keys(v.assets.videoPaths || {}),
      ])
    ),
  ];

  // Winner badge logic
  let winner: "A" | "B" | "tie" | null = null;
  if (vA?.performance && vB?.performance) {
    if (vA.performance.ctr > vB.performance.ctr) winner = "A";
    else if (vB.performance.ctr > vA.performance.ctr) winner = "B";
    else winner = "tie";
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href={`/batches/${batchId}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {batchId}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Columns2 className="h-6 w-6 text-accent" /> Side-by-Side Compare
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare two variants from batch {batchId}
          </p>
        </div>

        {winner && winner !== "tie" && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
              winner === "A"
                ? "bg-accent/15 text-accent"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Variant {winner} wins on CTR
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Variant A:</label>
          <select
            value={variantA}
            onChange={(e) => setVariantA(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {batch.variants.map((v, i) => (
              <option key={i} value={i}>
                v{String(v.variantIndex).padStart(2, "0")} —{" "}
                {TEMPLATE_LABELS[v.parameters.visual.template]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Variant B:</label>
          <select
            value={variantB}
            onChange={(e) => setVariantB(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {batch.variants.map((v, i) => (
              <option key={i} value={i}>
                v{String(v.variantIndex).padStart(2, "0")} —{" "}
                {TEMPLATE_LABELS[v.parameters.visual.template]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Size:</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {allSizes.map((s) => (
              <option key={s} value={s}>
                {SIZE_LABELS[s] || s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setMediaType("image")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              mediaType === "image"
                ? "bg-accent text-white"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon className="h-3 w-3" /> Image
          </button>
          <button
            onClick={() => setMediaType("video")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              mediaType === "video"
                ? "bg-accent text-white"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Play className="h-3 w-3" /> Video
          </button>
        </div>
      </div>

      {/* Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vA && (
          <VariantPreview variant={vA} size={size} mediaType={mediaType} side="A" />
        )}
        {vB && (
          <VariantPreview variant={vB} size={size} mediaType={mediaType} side="B" />
        )}
      </div>

      {/* Performance Comparison Table */}
      {vA?.performance && vB?.performance && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-accent" /> Performance Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2 pr-4">Metric</th>
                  <th className="text-right py-2 px-4">Variant A</th>
                  <th className="text-right py-2 px-4">Variant B</th>
                  <th className="text-right py-2 pl-4">Diff</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "CTR",
                    a: vA.performance.ctr * 100,
                    b: vB.performance.ctr * 100,
                    fmt: (v: number) => `${v.toFixed(2)}%`,
                  },
                  {
                    label: "CPC",
                    a: vA.performance.cpc || 0,
                    b: vB.performance.cpc || 0,
                    fmt: (v: number) => `$${v.toFixed(2)}`,
                    invert: true,
                  },
                  {
                    label: "ROAS",
                    a: vA.performance.roas || 0,
                    b: vB.performance.roas || 0,
                    fmt: (v: number) => `${v.toFixed(1)}x`,
                  },
                  {
                    label: "Spend",
                    a: vA.performance.spend || 0,
                    b: vB.performance.spend || 0,
                    fmt: (v: number) => `$${v.toFixed(0)}`,
                  },
                  {
                    label: "Conversions",
                    a: vA.performance.conversions || 0,
                    b: vB.performance.conversions || 0,
                    fmt: (v: number) => String(Math.round(v)),
                  },
                ].map((row) => {
                  const diff = row.a - row.b;
                  const betterIsHigher = !row.invert;
                  const aWins = betterIsHigher ? diff > 0 : diff < 0;
                  return (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-medium">{row.label}</td>
                      <td
                        className={`text-right py-2 px-4 ${
                          aWins ? "text-accent font-semibold" : ""
                        }`}
                      >
                        {row.fmt(row.a)}
                      </td>
                      <td
                        className={`text-right py-2 px-4 ${
                          !aWins && diff !== 0 ? "text-emerald-400 font-semibold" : ""
                        }`}
                      >
                        {row.fmt(row.b)}
                      </td>
                      <td
                        className={`text-right py-2 pl-4 ${
                          diff > 0 ? "text-emerald-400" : diff < 0 ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {diff > 0 ? "+" : ""}
                        {row.fmt(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
