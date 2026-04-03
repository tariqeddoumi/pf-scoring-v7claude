'use client';

import Link from 'next/link';
import { ArrowRight, Zap, BarChart3, Users, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="pt-8">
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            PF Scoring V7++
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl">
            Système de scoring Project Finance professionnel. Évaluez les projets selon une méthodologie conforme IFC, EBRD, Basel et Bank Al-Maghrib.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/evaluations/new"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              <span>Créer une évaluation</span>
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center space-x-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              <span>Lire la méthodologie</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Clients', value: '12', color: 'from-blue-600 to-blue-700' },
          { icon: CheckCircle, label: 'Projets', value: '28', color: 'from-cyan-600 to-cyan-700' },
          { icon: BarChart3, label: 'Évaluations', value: '45', color: 'from-purple-600 to-purple-700' },
          { icon: Zap, label: 'Score moyen', value: '7.8/10', color: 'from-green-600 to-green-700' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`rounded-lg bg-gradient-to-br ${stat.color} p-6 text-white`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">{stat.label}</h3>
                <Icon size={20} opacity={0.7} />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-8">Fonctionnalités principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: BarChart3,
              title: '9 Domaines de scoring',
              description: 'Évaluation complète avec 9 domaines et 40+ règles métier',
            },
            {
              icon: CheckCircle,
              title: 'Stress Testing',
              description: '6 scénarios de stress testing pour évaluer la résilience',
            },
            {
              icon: Users,
              title: 'Gestion clients',
              description: 'Gérez vos clients et leurs projets en un seul endroit',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="rounded-lg bg-slate-800 border border-slate-700 p-6 hover:border-slate-600 transition-all"
              >
                <Icon className="text-cyan-500 mb-4" size={32} />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Access */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-8">Accès rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAccessCard
            title="Clients"
            description="Gestion complète des clients"
            href="/clients"
            icon={Users}
          />
          <QuickAccessCard
            title="Nouveaux Projets"
            description="Créer et évaluer un projet"
            href="/projects/new"
            icon={CheckCircle}
          />
          <QuickAccessCard
            title="Évaluations"
            description="Voir toutes les évaluations"
            href="/evaluations"
            icon={BarChart3}
          />
          <QuickAccessCard
            title="Méthodologie"
            description="Comprendre le système de scoring"
            href="/methodology"
            icon={Users}
          />
        </div>
      </section>
    </div>
  );
}

function QuickAccessCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size: number }>;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg bg-slate-800 border border-slate-700 p-6 hover:border-slate-600 hover:bg-slate-700 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
            {title}
          </h3>
          <p className="text-slate-400">{description}</p>
        </div>
        <Icon className="text-slate-500 group-hover:text-cyan-500 transition-colors" size={24} />
      </div>
      <div className="flex items-center text-cyan-500 text-sm font-medium">
        Accéder
        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
