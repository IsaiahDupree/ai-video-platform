"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { listBatches, type BatchSummary } from "@/lib/api";

const TEMPLATE_LABELS: Record<string, string> = {
  before_after: "Before/After",
  testimonial: "Testimonial",
  product_demo: "Product Demo",
  problem_solution: "Problem/Solution",
  stat_counter: "Stat Counter",
  feature_list: "Feature List",
  urgency: "Urgency",
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  rendered: { color: "text-emerald-400", icon: CheckCircle2 },
  active: { color: "text-violet-400", icon: Sparkles },
  generating: { color: "text-amber-400", icon: Clock },
  completed: { color: "text-zinc-400", icon: CheckCircle2 },
  analyzed: { color: "text-blue-400", icon: CheckCircle2 },
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await listBatches();
        setBatches(data);
      } catch {
        // Server not running — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = batches.filter((b) => {
    if (search && !b.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    return true;
  });

  const statuses = ["all", ...new Set(batches.map((b) => b.status))];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Batches</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and manage all ad generation batches
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-border bg-card">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {batches.length === 0 ? "No batches found. Start the API server or create a new batch." : "No batches match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((batch) => {
            const cfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.rendered;
            const StatusIcon = cfg.icon;
            return (
              <Link
                key={batch.id}
                href={`/batches/${batch.id}`}
                className="rounded-xl border border-border bg-card p-5 hover:border-accent/40 transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold group-hover:text-accent transition-colors">
                    {batch.id}
                  </h3>
                  <div className={`flex items-center gap-1.5 ${cfg.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    <span className="text-xs capitalize">{batch.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> {batch.variantCount} variants
                  </span>
                  {batch.hasPerformance && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Sparkles className="h-3 w-3" /> Has perf data
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {batch.templates.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {TEMPLATE_LABELS[t] || t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(batch.createdAt).toLocaleDateString()}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
