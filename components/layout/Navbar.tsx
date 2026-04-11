"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { UserProfile } from "./UserProfile";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PF</span>
            </div>
            <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
              PF Scoring V7++
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/dashboard" label="Tableau de bord" />
            <NavLink href="/clients" label="Clients" />
            <NavLink href="/projects" label="Projets" />
            <NavLink href="/evaluations" label="Évaluations" />
            <NavLink href="/methodology" label="Méthodologie" />
            <NavLink href="/audit" label="Journal d'audit" />
          </div>

          {/* User Menu & Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            <div className="hidden md:block">
              <UserProfile />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-700">
            <div className="flex flex-col space-y-2 pt-4">
              <MobileNavLink href="/dashboard" label="Tableau de bord" />
              <MobileNavLink href="/clients" label="Clients" />
              <MobileNavLink href="/projects" label="Projets" />
              <MobileNavLink href="/evaluations" label="Évaluations" />
              <MobileNavLink href="/methodology" label="Méthodologie" />
              <MobileNavLink href="/audit" label="Journal d'audit" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors block"
    >
      {label}
    </Link>
  );
}
