import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Mock data pour fallback
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
];

export async function GET() {
  try {
    // Récupérer les données de Supabase
    const { data, error } = await supabase
      .from("pf_scoring_projects")
      .select("*")
      .order("date_creation", { ascending: false });

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(mockProjects);
    }

    // Transformer les données pour correspondre au format attendu
    interface ProjectRow {
      id: string;
      nom: string;
      description: string;
      secteur: string;
      montant: number;
      devise: string;
      status: string;
      score_global: number | null;
      grade: string | null;
      date_creation: string;
      date_mise_a_jour: string;
      cree_par: string;
    }

    const projects = data?.map((p: ProjectRow) => ({
      id: p.id,
      nom: p.nom,
      description: p.description,
      secteur: p.secteur,
      montant: p.montant,
      devise: p.devise,
      status: p.status,
      scoreGlobal: p.score_global,
      grade: p.grade,
      dateCreation: new Date(p.date_creation),
      dateMiseAJour: new Date(p.date_mise_a_jour),
      creePar: p.cree_par,
    })) || [];

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(mockProjects);
  }
}

export async function POST(request: Request) {
  try {
    const { nom, description, secteur, montant } = await request.json();

    // Valider les données
    if (!nom || !description || !secteur || !montant) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Créer le projet dans Supabase
    const { data, error } = await supabase
      .from("pf_scoring_projects")
      .insert([
        {
          nom,
          description,
          secteur,
          montant: parseFloat(montant),
          devise: "MAD",
          status: "brouillon",
          cree_par: "550e8400-e29b-41d4-a716-446655440000", // UUID de l'utilisateur test
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
