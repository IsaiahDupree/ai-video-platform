"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Download,
  Filter,
  Play,
  X,
  CheckCircle2,
  BarChart3,
  Eye,
} from "lucide-react";
import { getBatch, type AdBatch, type AdVariant } from "@/lib/api";

const TEMPLATE_LABELS: Record<string, string> = {
  before_after: "Before/After",
  testimonial: "Testimonial",
  product_demo: "Product Demo",
  problem_solution: "Problem/Solution",
  stat_counter: "Stat Counter",
  feature_list: "Feature List",
  urgency: "Urgency",
};

const SIZE_LABELS: Record<string, string> = {
  feed_square: "Feed 1:1",
  feed_portrait: "Feed 4:5",
  story: "Story 9:16",
  reels: "Reels 9:16",
  fb_feed: "FB Feed",
  fb_square: "FB Square",
};

function VariantCard({
  variant,
  onPreview,
}: {
  variant: AdVariant;
  onPreview: (v: AdVariant, size: string, type: "image" | "video") => void;
}) {
  const template = variant.parameters.visual.template;
  const sizes = Object.keys(variant.assets.composedPaths || {});
  const videoSizes = Object.keys(variant.assets.videoPaths || {});

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-accent">
            {TEMPLATE_LABELS[template] || template}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            v{String(variant.variantIndex).padStart(2, "0")}
          </span>
        </div>
        <p className="text-sm font-medium mt-1 line-clamp-1">
          {variant.parameters.copy.headline}
        </p>
      </div>

      {/* Metadata */}
      <div className="px-4 py-2.5 text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Hook</span>
          <span className="text-foreground capitalize">{variant.parameters.copy.hookType}</span>
        </div>
        <div className="flex justify-between">
          <span>Awareness</span>
          <span className="text-foreground capitalize">
            {variant.parameters.targeting.awarenessLevel.replace("_", " ")}
          </span>
        </div>
        <div className="flex justify-between">
          <span>CTA</span>
          <span className="text-foreground">{variant.parameters.copy.ctaText}</span>
        </div>
      </div>

      {/* Assets */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Outputs</p>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => (
            <button
              key={`img-${size}`}
              onClick={() => onPreview(variant, size, "image")}
              className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <ImageIcon className="h-2.5 w-2.5" />
              {SIZE_LABELS[size] || size}
            </button>
          ))}
          {videoSizes.map((size) => (
            <button
              key={`vid-${size}`}
              onClick={() => onPreview(variant, size, "video")}
              className="flex items-center gap-1 rounded-md bg-accent/15 px-2 py-1 text-[10px] text-accent hover:bg-accent/25 transition-colors"
            >
              <Play className="h-2.5 w-2.5" />
              {SIZE_LABELS[size] || size}
            </button>
          ))}
        </div>
      </div>

      {/* Performance (if available) */}
      {variant.performance && (
        <div className="px-4 py-2.5 border-t border-border bg-muted/30">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs font-semibold">{(variant.performance.ctr * 100).toFixed(2)}%</p>
              <p className="text-[10px] text-muted-foreground">CTR</p>
            </div>
            <div>
              <p className="text-xs font-semibold">${variant.performance.cpc?.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">CPC</p>
            </div>
            <div>
              <p className="text-xs font-semibold">{variant.performance.roas?.toFixed(1)}x</p>
              <p className="text-[10px] text-muted-foreground">ROAS</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewModal({
  variant,
  size,
  type,
  onClose,
}: {
  variant: AdVariant;
  size: string;
  type: "image" | "video";
  onClose: () => void;
}) {
  const path =
    type === "video"
      ? variant.assets.videoPaths?.[size]
      : variant.assets.composedPaths?.[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Preview header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{variant.parameters.copy.headline}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {TEMPLATE_LABELS[variant.parameters.visual.template]} · {SIZE_LABELS[size] || size} · {type}
              </p>
            </div>
            {path && (
              <a
                href={`file://${path}`}
                className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-3 w-3" />
                Open file
              </a>
            )}
          </div>

          {/* Preview content */}
          <div className="p-4 flex items-center justify-center bg-black/20 min-h-[300px]">
            {!path ? (
              <p className="text-sm text-muted-foreground">File path not available</p>
            ) : type === "video" ? (
              <video
                src={`/api/file?path=${encodeURIComponent(path)}`}
                controls
                autoPlay
                loop
                className="max-h-[70vh] rounded-lg"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/file?path=${encodeURIComponent(path)}`}
                alt={variant.parameters.copy.headline}
                className="max-h-[70vh] rounded-lg"
              />
            )}
          </div>

          {/* Variant details */}
          <div className="px-4 py-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Template</span>
              <p className="font-medium">{TEMPLATE_LABELS[variant.parameters.visual.template]}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Hook</span>
              <p className="font-medium capitalize">{variant.parameters.copy.hookType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Awareness</span>
              <p className="font-medium capitalize">{variant.parameters.targeting.awarenessLevel.replace("_", " ")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">CTA</span>
              <p className="font-medium">{variant.parameters.copy.ctaText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.id as string;
  const [batch, setBatch] = useState<AdBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [preview, setPreview] = useState<{
    variant: AdVariant;
    size: string;
    type: "image" | "video";
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBatch(batchId);
        setBatch(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load batch");
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

  if (error || !batch) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link href="/batches" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to batches
        </Link>
        <div className="text-center py-20 rounded-xl border border-border bg-card">
          <p className="text-muted-foreground">{error || "Batch not found"}</p>
        </div>
      </div>
    );
  }

  const templates = [...new Set(batch.variants.map((v) => v.parameters.visual.template))];
  const filtered =
    templateFilter === "all"
      ? batch.variants
      : batch.variants.filter((v) => v.parameters.visual.template === templateFilter);

  const totalStills = batch.variants.reduce(
    (sum, v) => sum + Object.keys(v.assets.composedPaths || {}).length,
    0
  );
  const totalVideos = batch.variants.reduce(
    (sum, v) => sum + Object.keys(v.assets.videoPaths || {}).length,
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back + Header */}
      <Link href="/batches" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to batches
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{batch.id}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {batch.totalVariants} variants · {templates.length} templates · {batch.status}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/optimize?batch=${batch.id}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <BarChart3 className="h-4 w-4" /> Optimize
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-lg font-bold">{batch.totalVariants}</p>
          <p className="text-xs text-muted-foreground">Variants</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
            <p className="text-lg font-bold">{totalStills}</p>
          </div>
          <p className="text-xs text-muted-foreground">Still images</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-accent" />
            <p className="text-lg font-bold">{totalVideos}</p>
          </div>
          <p className="text-xs text-muted-foreground">Video ads</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-lg font-bold capitalize">{batch.status}</p>
          </div>
          <p className="text-xs text-muted-foreground">Status</p>
        </div>
      </div>

      {/* Performance summary */}
      {batch.performance && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" /> Performance Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl font-bold">{(batch.performance.overallCtr * 100).toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground">Overall CTR</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{batch.performance.overallRoas.toFixed(1)}x</p>
              <p className="text-xs text-muted-foreground">Overall ROAS</p>
            </div>
            <div>
              <p className="text-2xl font-bold">${batch.performance.totalSpend.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total Spend</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{batch.performance.totalConversions}</p>
              <p className="text-xs text-muted-foreground">Conversions</p>
            </div>
          </div>
        </div>
      )}

      {/* Template filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setTemplateFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            templateFilter === "all"
              ? "bg-accent text-white"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({batch.variants.length})
        </button>
        {templates.map((t) => {
          const count = batch.variants.filter((v) => v.parameters.visual.template === t).length;
          return (
            <button
              key={t}
              onClick={() => setTemplateFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                templateFilter === t
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {TEMPLATE_LABELS[t] || t} ({count})
            </button>
          );
        })}
      </div>

      {/* Variant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((variant) => (
          <VariantCard
            key={variant.id}
            variant={variant}
            onPreview={(v, size, type) => setPreview({ variant: v, size, type })}
          />
        ))}
      </div>

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          variant={preview.variant}
          size={preview.size}
          type={preview.type}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
