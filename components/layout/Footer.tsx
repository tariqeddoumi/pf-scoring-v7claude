'use client';

import { Code, Users, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold mb-4">PF Scoring V7++</h3>
            <p className="text-slate-400 text-sm">
              Système de scoring Project Finance conforme IFC, EBRD, Basel et Bank Al-Maghrib.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/dashboard" className="hover:text-white transition">Tableau de bord</a></li>
              <li><a href="/clients" className="hover:text-white transition">Clients</a></li>
              <li><a href="/projects" className="hover:text-white transition">Projets</a></li>
              <li><a href="/methodology" className="hover:text-white transition">Méthodologie</a></li>
            </ul>
          </div>

          {/* Documentation */}
          <div>
            <h4 className="text-white font-semibold mb-4">Documentation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition">API Docs</a></li>
              <li><a href="#" className="hover:text-white transition">Developer Guide</a></li>
              <li><a href="#" className="hover:text-white transition">Support</a></li>
              <li><a href="#" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition" title="Email">
                <Mail size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition" title="GitHub">
                <Code size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition" title="LinkedIn">
                <Users size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm mb-4 md:mb-0">
            © 2026 PF Scoring V7++. Tous droits réservés.
          </p>
          <div className="flex space-x-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition">Confidentialité</a>
            <a href="#" className="hover:text-white transition">Conditions</a>
            <a href="#" className="hover:text-white transition">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
