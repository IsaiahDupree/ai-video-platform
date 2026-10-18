"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Monitor,
  Smartphone,
  ThumbsUp,
  Share2,
} from "lucide-react";
import { getBatch, type AdBatch, type AdVariant } from "@/lib/api";

const SIZE_LABELS: Record<string, string> = {
  feed_square: "Feed 1:1",
  feed_portrait: "Feed 4:5",
  story: "Story 9:16",
  fb_feed: "FB Feed",
};

function InstagramFeedMockup({
  variant,
  size,
  brandName,
}: {
  variant: AdVariant;
  size: string;
  brandName: string;
}) {
  const path = variant.assets.composedPaths?.[size];
  const videoPath = variant.assets.videoPaths?.[size];
  const hasVideo = !!videoPath;

  return (
    <div className="w-full max-w-[375px] mx-auto rounded-xl border border-border bg-black overflow-hidden">
      {/* IG Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-black">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
          <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">
              {brandName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-white">{brandName.toLowerCase().replace(/\s+/g, "")}</p>
          <p className="text-[10px] text-zinc-400">Sponsored</p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-white" />
      </div>

      {/* Image/Video */}
      <div className="relative bg-zinc-900 aspect-square">
        {hasVideo ? (
          <video
            src={`/api/file?path=${encodeURIComponent(videoPath!)}`}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/file?path=${encodeURIComponent(path)}`}
            alt={variant.parameters.copy.headline}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-xs text-zinc-500">No preview</p>
          </div>
        )}
      </div>

      {/* IG Actions */}
      <div className="px-3 py-2 bg-black">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="h-5 w-5 text-white" />
            <MessageCircle className="h-5 w-5 text-white" />
            <Send className="h-5 w-5 text-white" />
          </div>
          <Bookmark className="h-5 w-5 text-white" />
        </div>
        <p className="text-xs text-white mb-1">
          <span className="font-semibold">{brandName.toLowerCase().replace(/\s+/g, "")}</span>{" "}
          {variant.parameters.copy.headline}
        </p>
        <p className="text-[10px] text-zinc-400">
          {variant.parameters.copy.ctaText} · See more
        </p>
      </div>
    </div>
  );
}

function FacebookFeedMockup({
  variant,
  size,
  brandName,
}: {
  variant: AdVariant;
  size: string;
  brandName: string;
}) {
  const path = variant.assets.composedPaths?.[size] || variant.assets.composedPaths?.["fb_feed"];
  const videoPath = variant.assets.videoPaths?.[size];
  const hasVideo = !!videoPath;

  return (
    <div className="w-full max-w-[500px] mx-auto rounded-xl border border-border bg-[#242526] overflow-hidden">
      {/* FB Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {brandName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{brandName}</p>
          <p className="text-[11px] text-zinc-400">Sponsored · 🌐</p>
        </div>
        <MoreHorizontal className="h-5 w-5 text-zinc-400" />
      </div>

      {/* Caption */}
      <div className="px-4 pb-2">
        <p className="text-sm text-white">{variant.parameters.copy.headline}</p>
      </div>

      {/* Image/Video */}
      <div className="relative bg-zinc-800">
        {hasVideo ? (
          <video
            src={`/api/file?path=${encodeURIComponent(videoPath!)}`}
            autoPlay
            loop
            muted
            playsInline
            className="w-full"
          />
        ) : path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/file?path=${encodeURIComponent(path)}`}
            alt={variant.parameters.copy.headline}
            className="w-full"
          />
        ) : (
          <div className="w-full aspect-video flex items-center justify-center">
            <p className="text-xs text-zinc-500">No preview</p>
          </div>
        )}
      </div>

      {/* CTA bar */}
      <div className="px-4 py-2.5 border-t border-zinc-700 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide">
            {brandName.toLowerCase().replace(/\s+/g, "")}.com
          </p>
          <p className="text-sm font-medium text-white line-clamp-1">
            {variant.parameters.copy.subheadline || variant.parameters.copy.headline}
          </p>
        </div>
        <button className="rounded-md bg-[#2374e1] px-4 py-1.5 text-xs font-medium text-white whitespace-nowrap">
          {variant.parameters.copy.ctaText}
        </button>
      </div>

      {/* FB Actions */}
      <div className="px-4 py-2 border-t border-zinc-700 flex items-center justify-around">
        <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
          <ThumbsUp className="h-4 w-4" /> Like
        </button>
        <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
          <MessageCircle className="h-4 w-4" /> Comment
        </button>
        <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batch") || "";
  const variantIdx = parseInt(searchParams.get("variant") || "0");

  const [batch, setBatch] = useState<AdBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(variantIdx);
  const [platform, setPlatform] = useState<"instagram" | "facebook">("instagram");
  const [size, setSize] = useState("feed_square");

  useEffect(() => {
    if (!batchId) { setLoading(false); return; }
    async function load() {
      try {
        const data = await getBatch(batchId);
        setBatch(data);
      } catch { /* error */ }
      finally { setLoading(false); }
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
        <h1 className="text-2xl font-bold mb-2">Feed Preview</h1>
        <p className="text-sm text-muted-foreground mb-6">
          See how your ads look in a real Instagram or Facebook feed.
        </p>
        <div className="text-center py-20 rounded-xl border border-border bg-card">
          <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-3">
            Open this page from a batch detail view.
          </p>
          <Link href="/batches" className="text-sm text-accent hover:underline">
            Browse batches →
          </Link>
        </div>
      </div>
    );
  }

  const variant = batch.variants[currentIdx] || batch.variants[0];
  const brandName = batch.productId || "Brand";
  const allSizes = [...new Set(batch.variants.flatMap((v) => Object.keys(v.assets.composedPaths || {})))];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/batches/${batchId}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {batchId}
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Feed Preview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          See how variant v{String(variant.variantIndex).padStart(2, "0")} looks in a real feed
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          <button
            onClick={() => setPlatform("instagram")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors ${
              platform === "instagram"
                ? "bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 text-white"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" /> Instagram
          </button>
          <button
            onClick={() => setPlatform("facebook")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors ${
              platform === "facebook"
                ? "bg-[#2374e1] text-white"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" /> Facebook
          </button>
        </div>

        <select
          value={currentIdx}
          onChange={(e) => setCurrentIdx(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          {batch.variants.map((v, i) => (
            <option key={i} value={i}>
              v{String(v.variantIndex).padStart(2, "0")} — {v.parameters.copy.headline.slice(0, 40)}
            </option>
          ))}
        </select>

        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          {allSizes.map((s) => (
            <option key={s} value={s}>{SIZE_LABELS[s] || s}</option>
          ))}
        </select>
      </div>

      {/* Mockup */}
      <div className="flex justify-center py-4">
        {platform === "instagram" ? (
          <InstagramFeedMockup variant={variant} size={size} brandName={brandName} />
        ) : (
          <FacebookFeedMockup variant={variant} size={size} brandName={brandName} />
        )}
      </div>

      {/* Variant nav */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs disabled:opacity-30 hover:bg-muted transition-colors"
        >
          ← Previous
        </button>
        <span className="text-xs text-muted-foreground">
          {currentIdx + 1} / {batch.variants.length}
        </span>
        <button
          onClick={() => setCurrentIdx(Math.min(batch.variants.length - 1, currentIdx + 1))}
          disabled={currentIdx === batch.variants.length - 1}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs disabled:opacity-30 hover:bg-muted transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
