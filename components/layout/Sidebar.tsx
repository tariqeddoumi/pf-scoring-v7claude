"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Users,
  Briefcase,
  CheckCircle,
  BookOpen,
  Settings,
  LogOut,
  Search,
  Bell,
  GitCompare,
  TrendingUp,
  Download,
  FileText,
  Shield,
  LineChart,
  Target,
  Sliders,
  Menu,
  X,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      icon: BarChart3,
      label: "Tableau de bord",
      href: "/dashboard",
      description: "Vue d'ensemble",
    },
    {
      icon: Sliders,
      label: "Configurer Tableau",
      href: "/dashboard-config",
      description: "Personnalisation",
    },
    {
      icon: Users,
      label: "Clients",
      href: "/clients",
      description: "Gestion clients",
    },
    {
      icon: Briefcase,
      label: "Projets",
      href: "/projects",
      description: "Projet Finance",
    },
    {
      icon: CheckCircle,
      label: "Évaluations",
      href: "/evaluations",
      description: "Scorings",
    },
    {
      icon: Search,
      label: "Recherche Avancée",
      href: "/search",
      description: "Multi-critères",
    },
    {
      icon: Bell,
      label: "Alertes",
      href: "/alerts",
      description: "Centre d'alertes",
    },
    {
      icon: GitCompare,
      label: "Comparaison",
      href: "/compare",
      description: "Projets côte à côte",
    },
    {
      icon: TrendingUp,
      label: "Monitoring",
      href: "/monitoring",
      description: "Performance post-clôture",
    },
    {
      icon: Download,
      label: "Exportations",
      href: "/exports",
      description: "PDF, Excel, Word",
    },
    {
      icon: FileText,
      label: "Documents",
      href: "/documents",
      description: "Gestion centralisée",
    },
    {
      icon: Shield,
      label: "Conformité",
      href: "/compliance",
      description: "GDPR & Confidentialité",
    },
    {
      icon: LineChart,
      label: "Analytique",
      href: "/analytics",
      description: "Tendances & Insights",
    },
    {
      icon: Target,
      label: "Benchmarking",
      href: "/benchmarking",
      description: "Comparaison secteur",
    },
    {
      icon: BookOpen,
      label: "Méthodologie",
      href: "/methodology",
      description: "Guides",
    },
    {
      icon: BookOpen,
      label: "Journal d'audit",
      href: "/audit",
      description: "Logs",
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 bg-slate-900 border-r border-slate-700 min-h-screen flex flex-col transition-all z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Menu Principal */}
        <div className="flex-1 overflow-y-auto p-4 mt-12 md:mt-0">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={20} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-slate-700 p-4 space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Settings size={20} />
            <span className="text-sm">Paramètres</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={20} />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
