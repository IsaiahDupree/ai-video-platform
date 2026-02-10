"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/batches", label: "Batches", icon: Layers },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/optimize", label: "Optimize", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">UGC Ad Platform</h1>
          <p className="text-[11px] text-muted-foreground">AI-powered creatives</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent/15 text-accent font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Server connected</span>
        </div>
      </div>
    </aside>
  );
}
