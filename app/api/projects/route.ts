import { NextResponse } from "next/server";

// Mock data - sera remplacé par des appels à la base de données
const mockProjects = [
  {
    id: "1",
    nom: "Parc Éolien Taourirt",
    description: "Développement d'un parc éolien de 100 MW",
    secteur: "Énergie",
    montant: 500000000,
    devise: "MAD" as const,
    status: "en_cours" as const,
    scoreGlobal: 78.5,
    grade: "A" as const,
    dateCreation: new Date("2024-01-15"),
    dateMiseAJour: new Date("2024-03-27"),
    creePar: "user-1",
  },
  {
    id: "2",
    nom: "Autoroute Casablanca-Rabat",
    description: "Amélioration de l'infrastructure routière",
    secteur: "Infrastructure",
    montant: 1200000000,
    devise: "MAD" as const,
    status: "en_revue" as const,
    scoreGlobal: 82.3,
    grade: "AA" as const,
    dateCreation: new Date("2024-02-01"),
    dateMiseAJour: new Date("2024-03-20"),
    creePar: "user-1",
  },
  {
    id: "3",
    nom: "Projet Agricole Saïss",
    description: "Développement agricole durable",
    secteur: "Agriculture",
    montant: 150000000,
    devise: "MAD" as const,
    status: "brouillon" as const,
    scoreGlobal: null,
    grade: null,
    dateCreation: new Date("2024-03-10"),
    dateMiseAJour: new Date("2024-03-27"),
    creePar: "user-1",
  },
];

export async function GET() {
  // TODO: Implémenter avec Prisma une fois la BD connectée
  return NextResponse.json(mockProjects);
}

export async function POST() {
  // TODO: Implémenter la création de projet
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
