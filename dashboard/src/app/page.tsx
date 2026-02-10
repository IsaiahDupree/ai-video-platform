"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Image as ImageIcon,
  Video,
  Sparkles,
  PlusCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { listBatches, checkHealth, type BatchSummary } from "@/lib/api";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function BatchRow({ batch }: { batch: BatchSummary }) {
  const statusColors: Record<string, string> = {
    rendered: "text-success",
    active: "text-accent",
    generating: "text-warning",
    completed: "text-muted-foreground",
    analyzed: "text-blue-400",
  };

  const statusIcons: Record<string, React.ElementType> = {
    rendered: CheckCircle2,
    active: Sparkles,
    generating: Clock,
    completed: CheckCircle2,
    analyzed: CheckCircle2,
  };

  const StatusIcon = statusIcons[batch.status] || AlertCircle;

  return (
    <Link
      href={`/batches/${batch.id}`}
      className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted/30 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Layers className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium group-hover:text-accent transition-colors">
            {batch.id}
          </p>
          <p className="text-xs text-muted-foreground">
            {batch.variantCount} variants · {batch.templates.slice(0, 3).join(", ")}
            {batch.templates.length > 3 && ` +${batch.templates.length - 3}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 ${statusColors[batch.status] || "text-muted-foreground"}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          <span className="text-xs capitalize">{batch.status}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [serverUp, setServerUp] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await checkHealth();
        setServerUp(true);
        const data = await listBatches();
        setBatches(data);
      } catch {
        setServerUp(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalVariants = batches.reduce((sum, b) => sum + b.variantCount, 0);
  const withPerf = batches.filter((b) => b.hasPerformance).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered UGC ad generation & optimization
          </p>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          New Batch
        </Link>
      </div>

      {/* Server status banner */}
      {serverUp === false && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-warning" />
          <p className="text-sm text-warning">
            API server not reachable at localhost:3100.{" "}
            <span className="text-muted-foreground">
              Run: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx tsx src/service/server.ts</code>
            </span>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Total Batches" value={String(batches.length)} sub="across all campaigns" color="bg-accent" />
        <StatCard icon={ImageIcon} label="Ad Variants" value={String(totalVariants)} sub="stills + videos" color="bg-blue-600" />
        <StatCard icon={Sparkles} label="Templates" value="7" sub="UGC ad templates" color="bg-emerald-600" />
        <StatCard icon={Video} label="With Performance" value={String(withPerf)} sub="batches with Meta data" color="bg-amber-600" />
      </div>

      {/* Recent Batches */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Recent Batches</h2>
          <Link href="/batches" className="text-xs text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No batches yet</p>
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-accent hover:underline"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Create your first batch
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
              {batches.slice(0, 8).map((batch) => (
                <BatchRow key={batch.id} batch={batch} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link
          href="/create"
          className="rounded-xl border border-border bg-card p-5 hover:border-accent/50 transition-colors group"
        >
          <PlusCircle className="h-6 w-6 text-accent mb-3" />
          <h3 className="text-sm font-semibold group-hover:text-accent transition-colors">
            Generate Ads
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Create a new batch with AI-generated images, copy, and video ads
          </p>
        </Link>
        <Link
          href="/optimize"
          className="rounded-xl border border-border bg-card p-5 hover:border-accent/50 transition-colors group"
        >
          <Sparkles className="h-6 w-6 text-amber-500 mb-3" />
          <h3 className="text-sm font-semibold group-hover:text-accent transition-colors">
            Optimize
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Score parameters, detect fatigue, and generate optimized next batch
          </p>
        </Link>
        <Link
          href="/batches"
          className="rounded-xl border border-border bg-card p-5 hover:border-accent/50 transition-colors group"
        >
          <Layers className="h-6 w-6 text-blue-500 mb-3" />
          <h3 className="text-sm font-semibold group-hover:text-accent transition-colors">
            Browse Gallery
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            View all composed ad variants with filtering and video playback
          </p>
        </Link>
      </div>
    </div>
  );
}
