'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  Briefcase,
  CheckCircle,
  BookOpen,
  LogBook,
  Settings,
  LogOut,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      icon: BarChart3,
      label: 'Tableau de bord',
      href: '/dashboard',
      description: 'Vue d\'ensemble',
    },
    {
      icon: Users,
      label: 'Clients',
      href: '/clients',
      description: 'Gestion clients',
    },
    {
      icon: Briefcase,
      label: 'Projets',
      href: '/projects',
      description: 'Projet Finance',
    },
    {
      icon: CheckCircle,
      label: 'Évaluations',
      href: '/evaluations',
      description: 'Scorings',
    },
    {
      icon: BookOpen,
      label: 'Méthodologie',
      href: '/methodology',
      description: 'Guides',
    },
    {
      icon: LogBook,
      label: 'Journal d\'audit',
      href: '/audit',
      description: 'Logs',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 min-h-screen flex flex-col">
      {/* Menu Principal */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
  );
}
