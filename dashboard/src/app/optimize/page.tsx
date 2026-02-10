"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  Sparkles,
  Upload,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { optimizeBatch, type OptimizationReport } from "@/lib/api";

export default function OptimizePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <OptimizeContent />
    </Suspense>
  );
}

function OptimizeContent() {
  const searchParams = useSearchParams();
  const initialBatch = searchParams.get("batch") || "";

  const [batchId, setBatchId] = useState(initialBatch);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [report, setReport] = useState<OptimizationReport | null>(null);

  async function handleOptimize(e: React.FormEvent) {
    e.preventDefault();
    if (!batchId) return;

    setStatus("running");
    setError("");

    try {
      const result = await optimizeBatch(batchId);
      setReport(result);
      setStatus("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Optimization failed");
      setStatus("error");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Optimize</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Score parameters, analyze performance, and generate optimized next batches
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">1</div>
            <h3 className="text-sm font-medium">Upload Meta CSV</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Export performance data from Meta Ads Manager as CSV
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">2</div>
            <h3 className="text-sm font-medium">Score Parameters</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Welch&apos;s t-test + Thompson Sampling finds top performers
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">3</div>
            <h3 className="text-sm font-medium">Next Batch</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Auto-generate an optimized batch with exploit/explore mix
          </p>
        </div>
      </div>

      {/* Optimize Form */}
      <form onSubmit={handleOptimize} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" /> Run Optimization
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Batch ID</label>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="b810405"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Meta CSV (optional)</label>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>

        {csvFile && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Upload className="h-3 w-3" />
            <span>{csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "running" || !batchId}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "running" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Run Optimization</>
          )}
        </button>
      </form>

      {/* Error */}
      {status === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Optimization failed</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {report && (
        <div className="space-y-6">
          {/* Recommendations */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Recommendations
            </h2>
            <div className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Parameter Scores */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-accent" /> Parameter Scores
            </h2>
            <div className="space-y-6">
              {Object.entries(report.parameterScores).map(([param, scores]) => (
                <div key={param}>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {param.replace(/([A-Z])/g, " $1").trim()}
                  </h3>
                  <div className="space-y-1.5">
                    {scores.slice(0, 5).map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-muted-foreground w-5">#{s.rank}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium capitalize">
                              {s.value.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(s.compositeScore * 100).toFixed(0)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${Math.min(s.compositeScore * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Next Batch CTA */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Ready to generate the next batch?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                An optimized batch will exploit top performers and explore new combinations
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
              Generate Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* CLI Reference */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">CLI Reference</h2>
        <div className="space-y-2 text-xs font-mono text-muted-foreground">
          <p># Ingest Meta CSV and optimize</p>
          <p className="text-foreground">npx tsx scripts/optimize-ugc-ads.ts --batch b810405 --csv meta-export.csv</p>
          <p className="mt-3"># Generate next optimized batch</p>
          <p className="text-foreground">npx tsx scripts/optimize-ugc-ads.ts --batch b810405 --next-batch --max-variants 12</p>
        </div>
      </div>
    </div>
  );
}
