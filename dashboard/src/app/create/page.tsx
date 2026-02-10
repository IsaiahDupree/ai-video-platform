"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Sparkles,
  Video,
  FileText,
  Palette,
  Settings2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { triggerPipeline } from "@/lib/api";

const ALL_TEMPLATES = [
  { id: "before_after", label: "Before/After", desc: "Side-by-side comparison" },
  { id: "testimonial", label: "Testimonial", desc: "Quote + avatar + stars" },
  { id: "product_demo", label: "Product Demo", desc: "3-step workflow" },
  { id: "problem_solution", label: "Problem/Solution", desc: "Pain → relief panels" },
  { id: "stat_counter", label: "Stat Counter", desc: "Big animated numbers" },
  { id: "feature_list", label: "Feature List", desc: "Checklist with badges" },
  { id: "urgency", label: "Urgency", desc: "Countdown + pricing" },
];

const STRATEGIES = [
  { id: "latin_square", label: "Latin Square", desc: "Balanced coverage (recommended)" },
  { id: "full_cross", label: "Full Cross", desc: "All parameter combinations" },
  { id: "random_sample", label: "Random Sample", desc: "Random subset" },
];

export default function CreatePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resultId, setResultId] = useState("");

  const [product, setProduct] = useState("BlankLogo");
  const [description, setDescription] = useState("AI watermark removal tool for creators");
  const [brandName, setBrandName] = useState("BlankLogo");
  const [primaryColor, setPrimaryColor] = useState("#635bff");
  const [accentColor, setAccentColor] = useState("#00d4ff");
  const [templates, setTemplates] = useState<string[]>(ALL_TEMPLATES.map((t) => t.id));
  const [maxVariants, setMaxVariants] = useState(12);
  const [strategy, setStrategy] = useState("latin_square");
  const [autoCopy, setAutoCopy] = useState(true);
  const [renderVideo, setRenderVideo] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  function toggleTemplate(id: string) {
    setTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("running");
    setErrorMsg("");

    try {
      const result = await triggerPipeline({
        product,
        description,
        brandName,
        primaryColor,
        accentColor,
        templates,
        maxVariants,
        strategy,
        dryRun,
        autoCopy,
        renderVideo,
      });
      setResultId(result.batchId);
      setStatus("done");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Pipeline failed");
      setStatus("error");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create New Batch</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure and launch a new UGC ad generation pipeline
        </p>
      </div>

      {/* Success banner */}
      {status === "done" && resultId && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-300">Pipeline complete!</p>
              <p className="text-xs text-muted-foreground">Batch {resultId} generated successfully</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/batches/${resultId}`)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            View Batch →
          </button>
        </div>
      )}

      {/* Error banner */}
      {status === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Pipeline failed</p>
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Info */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" /> Product
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Product Name</label>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              required
            />
          </div>
        </section>

        {/* Brand Colors */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent" /> Brand Colors
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-9 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-9 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> Templates
            </h2>
            <span className="text-xs text-muted-foreground">{templates.length} selected</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {ALL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTemplate(t.id)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  templates.includes(t.id)
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <p className={`text-xs font-medium ${templates.includes(t.id) ? "text-accent" : "text-foreground"}`}>
                  {t.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Strategy & Options */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-accent" /> Options
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Max Variants</label>
              <input
                type="number"
                value={maxVariants}
                onChange={(e) => setMaxVariants(parseInt(e.target.value) || 12)}
                min={1}
                max={100}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {STRATEGIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} — {s.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-sm">AI Copy Generation</p>
                  <p className="text-[10px] text-muted-foreground">Use Gemini to generate product-aware copy</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoCopy}
                onChange={(e) => setAutoCopy(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-accent"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm">Render Video Ads</p>
                  <p className="text-[10px] text-muted-foreground">8s MP4 with intro/outro/SFX (slower)</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={renderVideo}
                onChange={(e) => setRenderVideo(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-accent"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">Dry Run</p>
                  <p className="text-[10px] text-muted-foreground">Generate variants only, skip image/video rendering</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-accent"
              />
            </label>
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "running" || templates.length === 0}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "running" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Running pipeline...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" /> Launch Pipeline
            </>
          )}
        </button>
      </form>
    </div>
  );
}
