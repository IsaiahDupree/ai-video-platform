"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  PlusCircle,
  Trash2,
  Layers,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Pause,
  Play,
} from "lucide-react";
import {
  listCampaigns,
  listProducts,
  createCampaign,
  deleteCampaign as apiDeleteCampaign,
  type Campaign,
  type Product,
} from "@/lib/api";

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  draft: { color: "text-zinc-400", icon: Clock },
  active: { color: "text-emerald-400", icon: Play },
  paused: { color: "text-amber-400", icon: Pause },
  completed: { color: "text-blue-400", icon: CheckCircle2 },
};

const GOAL_LABELS: Record<string, string> = {
  ctr: "Maximize CTR",
  roas: "Maximize ROAS",
  conversions: "Maximize Conversions",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [goal, setGoal] = useState<"ctr" | "roas" | "conversions">("ctr");
  const [dailyBudget, setDailyBudget] = useState(50);
  const [totalBudget, setTotalBudget] = useState(500);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [c, p] = await Promise.all([listCampaigns(), listProducts()]);
      setCampaigns(c);
      setProducts(p);
    } catch {
      // Server not available
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createCampaign({
        name,
        productId,
        goal,
        budget: { daily: dailyBudget, total: totalBudget },
        status: "draft",
      });
      setShowCreate(false);
      setName("");
      setProductId("");
      await loadData();
    } catch {
      // Handle error
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign?")) return;
    try {
      await apiDeleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // Handle error
    }
  }

  function getProductName(pid: string): string {
    return products.find((p) => p.id === pid)?.name || pid;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group batches into campaigns and track performance over time
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={products.length === 0}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusCircle className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {products.length === 0 && !loading && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-warning" />
          <p className="text-sm text-warning">
            Add a product first before creating campaigns.{" "}
            <Link href="/products" className="underline">
              Go to Products →
            </Link>
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">New Campaign</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-md hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Q1 2026 Growth"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Product *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  required
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as typeof goal)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="ctr">Maximize CTR</option>
                  <option value="roas">Maximize ROAS</option>
                  <option value="conversions">Maximize Conversions</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Daily Budget ($)</label>
                  <input
                    type="number"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Total Budget ($)</label>
                  <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creating || !productId}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Create Campaign
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Campaign List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-border bg-card">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No campaigns yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={campaign.id}
                className="rounded-xl border border-border bg-card p-5 hover:border-accent/30 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold">{campaign.name}</h3>
                      <div className={`flex items-center gap-1 ${cfg.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-[10px] capitalize">{campaign.status}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getProductName(campaign.productId)} · {GOAL_LABELS[campaign.goal]} · ${campaign.budget.daily}/day
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>

                {/* Batches */}
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    {campaign.batches.length} batch{campaign.batches.length !== 1 ? "es" : ""}
                  </div>
                  {campaign.batches.length > 0 && (
                    <div className="flex gap-1.5">
                      {campaign.batches.slice(0, 5).map((bId) => (
                        <Link
                          key={bId}
                          href={`/batches/${bId}`}
                          className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {bId}
                        </Link>
                      ))}
                      {campaign.batches.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{campaign.batches.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
