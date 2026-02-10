"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Server,
  Key,
  Palette,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { checkHealth, getCapabilities, API_BASE } from "@/lib/api";

export default function SettingsPage() {
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [capabilities, setCapabilities] = useState<Record<string, unknown> | null>(null);

  async function checkServer() {
    setServerStatus("checking");
    try {
      await checkHealth();
      setServerStatus("online");
      const caps = await getCapabilities();
      setCapabilities(caps);
    } catch {
      setServerStatus("offline");
    }
  }

  useEffect(() => { checkServer(); }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Server connection, API keys, and configuration
        </p>
      </div>

      {/* Server Status */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Server className="h-4 w-4 text-accent" /> API Server
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {serverStatus === "checking" && (
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
            )}
            {serverStatus === "online" && (
              <CheckCircle2 className="h-4 w-4 text-success" />
            )}
            {serverStatus === "offline" && (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <div>
              <p className="text-sm font-medium">
                {serverStatus === "checking" && "Checking..."}
                {serverStatus === "online" && "Connected"}
                {serverStatus === "offline" && "Not reachable"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{API_BASE}</p>
            </div>
          </div>
          <button
            onClick={checkServer}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>

        {serverStatus === "offline" && (
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Start the server:</p>
            <code className="block text-accent">npx tsx src/service/server.ts</code>
          </div>
        )}
      </section>

      {/* Environment Variables */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Key className="h-4 w-4 text-accent" /> Environment
        </h2>

        <div className="space-y-3">
          {[
            { key: "NEXT_PUBLIC_API_URL", desc: "Pipeline API server URL", default: "http://localhost:3100" },
            { key: "NEXT_PUBLIC_API_KEY", desc: "API authentication key", default: "dev-api-key" },
            { key: "GOOGLE_API_KEY", desc: "Gemini API key (server-side)", default: "(set in .env.local)" },
          ].map((env) => (
            <div key={env.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-xs font-mono font-medium">{env.key}</p>
                <p className="text-[10px] text-muted-foreground">{env.desc}</p>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{env.default}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      {capabilities && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent" /> Server Capabilities
          </h2>
          <pre className="rounded-lg bg-muted/50 p-4 text-xs font-mono text-muted-foreground overflow-x-auto">
            {JSON.stringify(capabilities, null, 2)}
          </pre>
        </section>
      )}

      {/* Useful Links */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "UGC Ad Platform PRD", href: "#", desc: "Product requirements document" },
            { label: "Pipeline CLI Reference", href: "#", desc: "generate-ugc-ads.ts flags" },
            { label: "Optimization Guide", href: "#", desc: "optimize-ugc-ads.ts workflow" },
            { label: "Template Gallery", href: "/batches", desc: "Browse all ad templates" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted/30 transition-colors group"
            >
              <div>
                <p className="text-xs font-medium group-hover:text-accent transition-colors">{link.label}</p>
                <p className="text-[10px] text-muted-foreground">{link.desc}</p>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
