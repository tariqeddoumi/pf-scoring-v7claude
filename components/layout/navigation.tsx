"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  LogOut,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/projects", label: "Projets", icon: FolderOpen },
  { href: "/methodology", label: "Méthodologie", icon: BookOpen },
  { href: "/audit", label: "Journal d'audit", icon: LogOut },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card">
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl">📊</span>
          <span>PF Scoring</span>
        </Link>

        <div className="flex gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        <button className="p-2 rounded-md hover:bg-secondary text-muted-foreground">
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}
