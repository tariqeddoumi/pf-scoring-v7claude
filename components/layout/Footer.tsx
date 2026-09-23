"use client";

import { Code, Users, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-foreground font-bold mb-4">PF Scoring V7++</h3>
            <p className="text-muted-foreground text-sm">
              Système de scoring Project Finance conforme IFC, EBRD, Basel et
              Bank Al-Maghrib.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/dashboard" className="hover:text-foreground transition">
                  Tableau de bord
                </a>
              </li>
              <li>
                <a href="/clients" className="hover:text-foreground transition">
                  Clients
                </a>
              </li>
              <li>
                <a href="/projects" className="hover:text-foreground transition">
                  Projets
                </a>
              </li>
              <li>
                <a href="/methodology" className="hover:text-foreground transition">
                  Méthodologie
                </a>
              </li>
            </ul>
          </div>

          {/* Documentation */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Documentation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition">
                  API Docs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Developer Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Contact</h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition"
                title="Email"
              >
                <Mail size={20} />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition"
                title="GitHub"
              >
                <Code size={20} />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition"
                title="LinkedIn"
              >
                <Users size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            © 2026 PF Scoring V7++. Tous droits réservés.
          </p>
          <div className="flex space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition">
              Confidentialité
            </a>
            <a href="#" className="hover:text-foreground transition">
              Conditions
            </a>
            <a href="#" className="hover:text-foreground transition">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
