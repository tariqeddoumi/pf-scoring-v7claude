/**
 * Clés de paramétrage connues de l'application. Une base neuve, ou copiée sans ses
 * données de référence, ne contient pas ces lignes : l'écran « Paramétrage de l'outil »
 * n'affichait alors ni le nom ni le logo, et une clé créée à l'enregistrement était
 * rangée « comportement », non publique — le logo n'atteignait jamais l'affichage.
 */
export interface CleCatalogue {
  key: string;
  value: string;
  type: "string" | "color" | "url" | "enum" | "bool" | "number" | "json";
  category: "branding" | "theme" | "behavior" | "scoring" | "screens" | "ia" | "t24";
  description: string;
  isPublic: boolean;
  metadata?: string;
}

export const CATALOGUE_CONFIG: CleCatalogue[] = [
  { key: "APP_NAME", value: "", type: "string", category: "branding", isPublic: true, description: "Nom de l'outil affiché (vide = « Scoring PF »)" },
  { key: "APP_LOGO_URL", value: "", type: "url", category: "branding", isPublic: true, description: "Logo de l'outil (vide = initiales du nom)" },
  { key: "PRIMARY_COLOR", value: "", type: "color", category: "theme", isPublic: true, description: "Couleur principale (vide = couleur par défaut)" },
  { key: "FONT_FAMILY", value: "", type: "string", category: "theme", isPublic: true, description: "Police principale (vide = police par défaut)" },
  { key: "THEME_MODE", value: "light", type: "enum", category: "theme", isPublic: true, description: "Thème clair ou sombre", metadata: '["light","dark"]' },
];

export function cleCatalogue(key: string): CleCatalogue | undefined {
  return CATALOGUE_CONFIG.find((c) => c.key === key);
}
