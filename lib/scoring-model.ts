/**
 * Modèle de Scoring Project Finance V7++
 * Grilles détaillées pour 9 domaines (D1-D9)
 * Weights : D1=10%, D2=10%, D3=15%, D4=10%, D5=10%, D6=10%, D7=15%, D8=10%, D9=10%
 */

export interface SubCriteria {
  id: string;
  label: string;
  criteria: Criteria[];
  weight: number; // % dans le sous-domaine
}

export interface Criteria {
  id: string;
  label: string;
  weight: number; // % dans le sous-critère
  scale: 'numeric' | 'qualitative';
  options?: { label: string; score: number }[];
  minValue?: number;
  maxValue?: number;
}

export interface Domain {
  id: string;
  name: string;
  shortName: string;
  weight: number; // % dans le scoring global
  subCriteria: SubCriteria[];
}

export const SCORING_MODEL: Domain[] = [
  // ==========================================
  // D1: Sponsor & Shareholders (10%)
  // ==========================================
  {
    id: 'D1',
    name: 'Sponsor & Shareholders',
    shortName: 'Sponsor',
    weight: 10,
    subCriteria: [
      {
        id: 'D1.1',
        label: 'Sponsor Strength',
        weight: 50,
        criteria: [
          {
            id: 'D1.1.1',
            label: 'Expérience sectorielle',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D1.1.2',
            label: 'Track record PF',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Aucun', score: 2 },
              { label: 'Limité', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Excellent', score: 10 },
            ],
          },
          {
            id: 'D1.1.3',
            label: 'Solidité financière',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Forte', score: 8 },
              { label: 'Très forte', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D1.2',
        label: 'Shareholder Structure',
        weight: 30,
        criteria: [
          {
            id: 'D1.2.1',
            label: 'Répartition capital',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très concentrée', score: 2 },
              { label: 'Concentrée', score: 4 },
              { label: 'Équilibrée', score: 6 },
              { label: 'Bien diversifiée', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D1.2.2',
            label: 'Alignement intérêts',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absent', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Parfait', score: 10 },
            ],
          },
          {
            id: 'D1.2.3',
            label: 'Engagement long terme',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Incertain', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Fort', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D1.3',
        label: 'Governance',
        weight: 20,
        criteria: [
          {
            id: 'D1.3.1',
            label: 'Structure décisionnelle',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Faible', score: 2 },
              { label: 'Acceptable', score: 4 },
              { label: 'Bonne', score: 6 },
              { label: 'Très bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D1.3.2',
            label: 'Transparence',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Faible', score: 2 },
              { label: 'Limitée', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D1.3.3',
            label: 'Reporting',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Inexistant', score: 2 },
              { label: 'Limité', score: 4 },
              { label: 'Basique', score: 6 },
              { label: 'Complet', score: 8 },
              { label: 'Premium', score: 10 },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // D2: Project Characteristics (10%)
  // ==========================================
  {
    id: 'D2',
    name: 'Project Characteristics',
    shortName: 'Caractéristiques',
    weight: 10,
    subCriteria: [
      {
        id: 'D2.1',
        label: 'Technical Complexity',
        weight: 40,
        criteria: [
          {
            id: 'D2.1.1',
            label: 'Technologie',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Non éprouvée', score: 2 },
              { label: 'Peu éprouvée', score: 4 },
              { label: 'Éprouvée', score: 6 },
              { label: 'Très éprouvée', score: 8 },
              { label: 'Standardisée', score: 10 },
            ],
          },
          {
            id: 'D2.1.2',
            label: 'Maturité technique',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Concept', score: 2 },
              { label: 'Démonstrée', score: 4 },
              { label: 'Prototype', score: 6 },
              { label: 'Production', score: 8 },
              { label: 'Commerciale', score: 10 },
            ],
          },
          {
            id: 'D2.1.3',
            label: 'Innovation',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très élevée', score: 2 },
              { label: 'Élevée', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Aucune', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D2.2',
        label: 'Location Risk',
        weight: 30,
        criteria: [
          {
            id: 'D2.2.1',
            label: 'Pays',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très haut risque', score: 2 },
              { label: 'Haut risque', score: 4 },
              { label: 'Risque modéré', score: 6 },
              { label: 'Faible risque', score: 8 },
              { label: 'Très faible risque', score: 10 },
            ],
          },
          {
            id: 'D2.2.2',
            label: 'Site',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très défavorable', score: 2 },
              { label: 'Défavorable', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Favorable', score: 8 },
              { label: 'Très favorable', score: 10 },
            ],
          },
          {
            id: 'D2.2.3',
            label: 'Accès infrastructure',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très limité', score: 2 },
              { label: 'Limité', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Excellent', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D2.3',
        label: 'Project Size & Structure',
        weight: 30,
        criteria: [
          {
            id: 'D2.3.1',
            label: 'Taille CAPEX',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très grand', score: 2 },
              { label: 'Grand', score: 4 },
              { label: 'Moyen', score: 6 },
              { label: 'Petit', score: 8 },
              { label: 'Très petit', score: 10 },
            ],
          },
          {
            id: 'D2.3.2',
            label: 'Complexité structure',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très complexe', score: 2 },
              { label: 'Complexe', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Simple', score: 8 },
              { label: 'Très simple', score: 10 },
            ],
          },
          {
            id: 'D2.3.3',
            label: 'Planning',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très serré', score: 2 },
              { label: 'Serré', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Confortable', score: 8 },
              { label: 'Très confortable', score: 10 },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // D3: Construction Risk (15%)
  // ==========================================
  {
    id: 'D3',
    name: 'Construction Risk',
    shortName: 'Construction',
    weight: 15,
    subCriteria: [
      {
        id: 'D3.1',
        label: 'EPC Completion Risk',
        weight: 40,
        criteria: [
          {
            id: 'D3.1.1',
            label: 'Type contrat EPC',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Prix révisable', score: 2 },
              { label: 'Semi-fixe', score: 4 },
              { label: 'Mixte', score: 6 },
              { label: 'Prix fixe partiel', score: 8 },
              { label: 'Prix fixe complet', score: 10 },
            ],
          },
          {
            id: 'D3.1.2',
            label: 'Expérience EPC',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Aucune', score: 2 },
              { label: 'Limitée', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D3.1.3',
            label: 'Garanties performance',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absentes', score: 2 },
              { label: 'Limitées', score: 4 },
              { label: 'Partielles', score: 6 },
              { label: 'Bonnes', score: 8 },
              { label: 'Complètes', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D3.2',
        label: 'Interfaces Risk',
        weight: 30,
        criteria: [
          {
            id: 'D3.2.1',
            label: 'Complexité interfaces',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très complexe', score: 2 },
              { label: 'Complexe', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Simple', score: 8 },
              { label: 'Minimale', score: 10 },
            ],
          },
          {
            id: 'D3.2.2',
            label: 'Coordinateur',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Absent/Faible', score: 2 },
              { label: 'Limité', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Excellent', score: 10 },
            ],
          },
          {
            id: 'D3.2.3',
            label: 'Gouvernance projet',
            weight: 20,
            scale: 'qualitative',
            options: [
              { label: 'Faible', score: 2 },
              { label: 'Limitée', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D3.3',
        label: 'Insurance Coverage',
        weight: 30,
        criteria: [
          {
            id: 'D3.3.1',
            label: 'Type polices',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Absentes', score: 2 },
              { label: 'Limitées', score: 4 },
              { label: 'Partielles', score: 6 },
              { label: 'Bonnes', score: 8 },
              { label: 'Complètes', score: 10 },
            ],
          },
          {
            id: 'D3.3.2',
            label: 'Couverture CAPEX',
            weight: 30,
            scale: 'numeric',
            minValue: 0,
            maxValue: 100,
          },
          {
            id: 'D3.3.3',
            label: 'Qualité assureur',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'AAA', score: 10 },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // D4: Market Risk (10%)
  // ==========================================
  {
    id: 'D4',
    name: 'Market Risk',
    shortName: 'Marché',
    weight: 10,
    subCriteria: [
      {
        id: 'D4.1',
        label: 'Demand Risk',
        weight: 40,
        criteria: [
          {
            id: 'D4.1.1',
            label: 'Stabilité demande',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très volatile', score: 2 },
              { label: 'Volatile', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Stable', score: 8 },
              { label: 'Très stable', score: 10 },
            ],
          },
          {
            id: 'D4.1.2',
            label: 'Prévisions marché',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très incertaines', score: 2 },
              { label: 'Incertaines', score: 4 },
              { label: 'Modérées', score: 6 },
              { label: 'Bonnes', score: 8 },
              { label: 'Excellentes', score: 10 },
            ],
          },
          {
            id: 'D4.1.3',
            label: 'Sensibilité économique',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très sensible', score: 2 },
              { label: 'Sensible', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D4.2',
        label: 'Price Risk',
        weight: 30,
        criteria: [
          {
            id: 'D4.2.1',
            label: 'Volatilité prix',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très haute', score: 2 },
              { label: 'Haute', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Basse', score: 8 },
              { label: 'Très basse', score: 10 },
            ],
          },
          {
            id: 'D4.2.2',
            label: 'Indexation',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Aucune', score: 2 },
              { label: 'Partielle', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Complète', score: 10 },
            ],
          },
          {
            id: 'D4.2.3',
            label: 'Mécanisme pricing',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absent', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Excellent', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D4.3',
        label: 'Competition',
        weight: 30,
        criteria: [
          {
            id: 'D4.3.1',
            label: 'Intensité concurrentielle',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très intense', score: 2 },
              { label: 'Intense', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
          {
            id: 'D4.3.2',
            label: 'Barrières entrée',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absentes', score: 2 },
              { label: 'Faibles', score: 4 },
              { label: 'Modérées', score: 6 },
              { label: 'Bonnes', score: 8 },
              { label: 'Très fortes', score: 10 },
            ],
          },
          {
            id: 'D4.3.3',
            label: 'Positionnement projet',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Excellent', score: 10 },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // D5: Operational Risk (10%)
  // ==========================================
  {
    id: 'D5',
    name: 'Operational Risk',
    shortName: 'Opérationnel',
    weight: 10,
    subCriteria: [
      {
        id: 'D5.1',
        label: 'O&M Capability',
        weight: 40,
        criteria: [
          {
            id: 'D5.1.1',
            label: 'Expérience opérateur',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Aucune', score: 2 },
              { label: 'Limitée', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D5.1.2',
            label: 'Performance historique',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très mauvaise', score: 2 },
              { label: 'Mauvaise', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D5.1.3',
            label: 'Ressources techniques',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très insuffisantes', score: 2 },
              { label: 'Insuffisantes', score: 4 },
              { label: 'Acceptables', score: 6 },
              { label: 'Bonnes', score: 8 },
              { label: 'Excellentes', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D5.2',
        label: 'Operational Stability',
        weight: 30,
        criteria: [
          {
            id: 'D5.2.1',
            label: 'Fiabilité opérations',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Très bonne', score: 10 },
            ],
          },
          {
            id: 'D5.2.2',
            label: 'Maintenance',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absente', score: 2 },
              { label: 'Basique', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Préventive complète', score: 10 },
            ],
          },
          {
            id: 'D5.2.3',
            label: 'Dépendance fournisseurs',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très élevée', score: 2 },
              { label: 'Élevée', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D5.3',
        label: 'Cost Control',
        weight: 30,
        criteria: [
          {
            id: 'D5.3.1',
            label: 'Structure coûts',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très variable', score: 2 },
              { label: 'Variable', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Stable', score: 8 },
              { label: 'Très stable', score: 10 },
            ],
          },
          {
            id: 'D5.3.2',
            label: 'Sensibilité inflation',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très sensible', score: 2 },
              { label: 'Sensible', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Indexée', score: 10 },
            ],
          },
          {
            id: 'D5.3.3',
            label: 'Capacité optimisation',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // D6: Counterparty Risk (10%)
  // ==========================================
  {
    id: 'D6',
    name: 'Counterparty Risk',
    shortName: 'Contrepartie',
    weight: 10,
    subCriteria: [
      {
        id: 'D6.1',
        label: 'Offtaker Risk',
        weight: 40,
        criteria: [
          {
            id: 'D6.1.1',
            label: 'Qualité crédit',
            weight: 50,
            scale: 'qualitative',
            options: [
              { label: 'D / CCC', score: 2 },
              { label: 'CC / C', score: 4 },
              { label: 'B / BB', score: 6 },
              { label: 'BBB / A', score: 8 },
              { label: 'AA / AAA', score: 10 },
            ],
          },
          {
            id: 'D6.1.2',
            label: 'Historique paiement',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Mauvais', score: 2 },
              { label: 'Acceptable', score: 4 },
              { label: 'Bon', score: 6 },
              { label: 'Très bon', score: 8 },
              { label: 'Excellent', score: 10 },
            ],
          },
          {
            id: 'D6.1.3',
            label: 'Dépendance projet',
            weight: 20,
            scale: 'qualitative',
            options: [
              { label: 'Très élevée', score: 2 },
              { label: 'Élevée', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D6.2',
        label: 'Supplier Risk',
        weight: 30,
        criteria: [
          {
            id: 'D6.2.1',
            label: 'Fiabilité fournisseurs',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D6.2.2',
            label: 'Diversification',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absente (1)', score: 2 },
              { label: 'Limitée (2)', score: 4 },
              { label: 'Modérée (3)', score: 6 },
              { label: 'Bonne (4+)', score: 8 },
              { label: 'Excellente (5+)', score: 10 },
            ],
          },
          {
            id: 'D6.2.3',
            label: 'Risque supply chain',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très élevé', score: 2 },
              { label: 'Élevé', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D6.3',
        label: 'Financial Partners',
        weight: 30,
        criteria: [
          {
            id: 'D6.3.1',
            label: 'Qualité prêteurs',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D6.3.2',
            label: 'Structure financement',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très complexe', score: 2 },
              { label: 'Complexe', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Simple', score: 8 },
              { label: 'Très simple', score: 10 },
            ],
          },
          {
            id: 'D6.3.3',
            label: 'Alignement intérêts',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absent', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Parfait', score: 10 },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // D7: Financial Structure & Cash Flow (15%)
  // ==========================================
  {
    id: 'D7',
    name: 'Financial Structure & Cash Flow',
    shortName: 'Financement',
    weight: 15,
    subCriteria: [
      {
        id: 'D7.1',
        label: 'Financial Structure',
        weight: 35,
        criteria: [
          {
            id: 'D7.1.1',
            label: 'Leverage',
            weight: 40,
            scale: 'numeric',
            minValue: 0,
            maxValue: 100,
          },
          {
            id: 'D7.1.2',
            label: 'Support sponsor',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absent', score: 2 },
              { label: 'Limité', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Excellent', score: 10 },
            ],
          },
          {
            id: 'D7.1.3',
            label: 'Réserves',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absentes', score: 2 },
              { label: 'Insuffisantes', score: 4 },
              { label: 'Acceptables', score: 6 },
              { label: 'Bonnes', score: 8 },
              { label: 'Excellentes', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D7.2',
        label: 'Cash Flow Predictability',
        weight: 30,
        criteria: [
          {
            id: 'D7.2.1',
            label: 'Visibilité revenus',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D7.2.2',
            label: 'Price risk',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très élevé', score: 2 },
              { label: 'Élevé', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
          {
            id: 'D7.2.3',
            label: 'Volume risk',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très élevé', score: 2 },
              { label: 'Élevé', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D7.3',
        label: 'Debt Service Capacity',
        weight: 35,
        criteria: [
          {
            id: 'D7.3.1',
            label: 'DSCR',
            weight: 50,
            scale: 'numeric',
            minValue: 0.5,
            maxValue: 3,
          },
          {
            id: 'D7.3.2',
            label: 'LLCR',
            weight: 30,
            scale: 'numeric',
            minValue: 0.5,
            maxValue: 4,
          },
          {
            id: 'D7.3.3',
            label: 'Stress resilience',
            weight: 20,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // D8: Legal & Documentation (10%)
  // ==========================================
  {
    id: 'D8',
    name: 'Legal & Documentation',
    shortName: 'Juridique',
    weight: 10,
    subCriteria: [
      {
        id: 'D8.1',
        label: 'Contractual Framework',
        weight: 40,
        criteria: [
          {
            id: 'D8.1.1',
            label: 'Complétude contrats',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très incomplète', score: 2 },
              { label: 'Incomplète', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Complète', score: 8 },
              { label: 'Très complète', score: 10 },
            ],
          },
          {
            id: 'D8.1.2',
            label: 'Bankability',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Non bancable', score: 2 },
              { label: 'Faiblement bancable', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bancable', score: 8 },
              { label: 'Très bancable', score: 10 },
            ],
          },
          {
            id: 'D8.1.3',
            label: 'Direct agreements',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absents', score: 2 },
              { label: 'Limités', score: 4 },
              { label: 'Partiels', score: 6 },
              { label: 'Complets', score: 8 },
              { label: 'Très complètement exécutés', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D8.2',
        label: 'Security Package',
        weight: 35,
        criteria: [
          {
            id: 'D8.2.1',
            label: 'Type garanties',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Absentes', score: 2 },
              { label: 'Minimales', score: 4 },
              { label: 'Basiques', score: 6 },
              { label: 'Bonnes', score: 8 },
              { label: 'Très complètes', score: 10 },
            ],
          },
          {
            id: 'D8.2.2',
            label: 'Enforceability',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D8.2.3',
            label: 'Couverture',
            weight: 30,
            scale: 'numeric',
            minValue: 0,
            maxValue: 100,
          },
        ],
      },
      {
        id: 'D8.3',
        label: 'Legal Environment',
        weight: 25,
        criteria: [
          {
            id: 'D8.3.1',
            label: 'Stabilité réglementaire',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très instable', score: 2 },
              { label: 'Instable', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Stable', score: 8 },
              { label: 'Très stable', score: 10 },
            ],
          },
          {
            id: 'D8.3.2',
            label: 'Autorisations',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absentes', score: 2 },
              { label: 'Partielles', score: 4 },
              { label: 'En cours', score: 6 },
              { label: 'Obtenues', score: 8 },
              { label: 'Sécurisées', score: 10 },
            ],
          },
          {
            id: 'D8.3.3',
            label: 'Litiges',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Nombreux', score: 2 },
              { label: 'Plusieurs', score: 4 },
              { label: 'Quelques', score: 6 },
              { label: 'Mineurs', score: 8 },
              { label: 'Aucun', score: 10 },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // D9: ESG & Climate Risk (10%)
  // ==========================================
  {
    id: 'D9',
    name: 'ESG & Climate Risk',
    shortName: 'ESG & Climat',
    weight: 10,
    subCriteria: [
      {
        id: 'D9.1',
        label: 'Environmental',
        weight: 30,
        criteria: [
          {
            id: 'D9.1.1',
            label: 'Impact environnemental',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très négatif', score: 2 },
              { label: 'Négatif', score: 4 },
              { label: 'Neutre', score: 6 },
              { label: 'Positif', score: 8 },
              { label: 'Très positif', score: 10 },
            ],
          },
          {
            id: 'D9.1.2',
            label: 'Conformité',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Non conforme', score: 2 },
              { label: 'Partiellement conforme', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Conforme', score: 8 },
              { label: 'Strictement conforme', score: 10 },
            ],
          },
          {
            id: 'D9.1.3',
            label: 'Efficience ressources',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Très faible', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D9.2',
        label: 'Social',
        weight: 20,
        criteria: [
          {
            id: 'D9.2.1',
            label: 'Impact communautés',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très négatif', score: 2 },
              { label: 'Négatif', score: 4 },
              { label: 'Neutre', score: 6 },
              { label: 'Positif', score: 8 },
              { label: 'Très positif', score: 10 },
            ],
          },
          {
            id: 'D9.2.2',
            label: 'Conditions travail',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Non respectées', score: 2 },
              { label: 'Partiellement respectées', score: 4 },
              { label: 'Acceptables', score: 6 },
              { label: 'Respectées', score: 8 },
              { label: 'Excellentes', score: 10 },
            ],
          },
          {
            id: 'D9.2.3',
            label: 'Engagement parties prenantes',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absent', score: 2 },
              { label: 'Faible', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Bon', score: 8 },
              { label: 'Excellent', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D9.3',
        label: 'Governance',
        weight: 20,
        criteria: [
          {
            id: 'D9.3.1',
            label: 'Reporting',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Inexistant', score: 2 },
              { label: 'Limité', score: 4 },
              { label: 'Basique', score: 6 },
              { label: 'Complet', score: 8 },
              { label: 'Premium', score: 10 },
            ],
          },
          {
            id: 'D9.3.2',
            label: 'Structure gouvernance',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absente', score: 2 },
              { label: 'Minimale', score: 4 },
              { label: 'Basique', score: 6 },
              { label: 'Bonne', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
          {
            id: 'D9.3.3',
            label: 'Politique ESG',
            weight: 30,
            scale: 'qualitative',
            options: [
              { label: 'Absente', score: 2 },
              { label: 'Basique', score: 4 },
              { label: 'Acceptable', score: 6 },
              { label: 'Complète', score: 8 },
              { label: 'Excellente', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'D9.4',
        label: 'Climate Risk',
        weight: 30,
        criteria: [
          {
            id: 'D9.4.1',
            label: 'Risque physique',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très élevé', score: 2 },
              { label: 'Élevé', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
          {
            id: 'D9.4.2',
            label: 'Risque transition',
            weight: 40,
            scale: 'qualitative',
            options: [
              { label: 'Très élevé', score: 2 },
              { label: 'Élevé', score: 4 },
              { label: 'Modéré', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
          {
            id: 'D9.4.3',
            label: 'Intensité carbone',
            weight: 20,
            scale: 'qualitative',
            options: [
              { label: 'Très élevée', score: 2 },
              { label: 'Élevée', score: 4 },
              { label: 'Modérée', score: 6 },
              { label: 'Faible', score: 8 },
              { label: 'Très faible', score: 10 },
            ],
          },
        ],
      },
    ],
  },
];

// NO-GO RULES
export const NO_GO_RULES = [
  { id: 'nogogo1', label: 'DSCR < 1.1x', value: 'dscr', operator: '<', threshold: 1.1 },
  { id: 'nogogo2', label: 'Equity < 20%', value: 'equity', operator: '<', threshold: 20 },
  { id: 'nogogo3', label: 'Absence de garanties', value: 'guarantees', operator: 'missing' },
  { id: 'nogogo4', label: 'Contrats essentiels non signés', value: 'contracts', operator: 'missing' },
  { id: 'nogogo5', label: 'Non conformité ESG majeure', value: 'esg_major', operator: '<', threshold: 4 },
];

// SCORE TO RATING MAPPING
export const SCORE_TO_RATING = [
  { minScore: 8.5, rating: 'AAA', color: 'bg-green-600', textColor: 'text-green-600' },
  { minScore: 8, rating: 'AA', color: 'bg-green-500', textColor: 'text-green-500' },
  { minScore: 7.5, rating: 'A', color: 'bg-green-400', textColor: 'text-green-400' },
  { minScore: 7, rating: 'BBB+', color: 'bg-blue-600', textColor: 'text-blue-600' },
  { minScore: 6.5, rating: 'BBB', color: 'bg-blue-500', textColor: 'text-blue-500' },
  { minScore: 6, rating: 'BBB-', color: 'bg-blue-400', textColor: 'text-blue-400' },
  { minScore: 5.5, rating: 'BB+', color: 'bg-yellow-600', textColor: 'text-yellow-600' },
  { minScore: 5, rating: 'BB', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  { minScore: 4.5, rating: 'BB-', color: 'bg-yellow-400', textColor: 'text-yellow-400' },
  { minScore: 4, rating: 'B+', color: 'bg-red-600', textColor: 'text-red-600' },
  { minScore: 3, rating: 'B', color: 'bg-red-500', textColor: 'text-red-500' },
  { minScore: 0, rating: 'B-/C/D', color: 'bg-red-700', textColor: 'text-red-700' },
];

// PD MAPPING (Indicative)
export const RATING_TO_PD = {
  'AAA': { min: 0.01, max: 0.05 },
  'AA': { min: 0.05, max: 0.1 },
  'A': { min: 0.1, max: 0.3 },
  'BBB+': { min: 0.3, max: 0.5 },
  'BBB': { min: 0.5, max: 0.8 },
  'BBB-': { min: 0.8, max: 1.2 },
  'BB+': { min: 1.2, max: 2 },
  'BB': { min: 2, max: 3.5 },
  'BB-': { min: 3.5, max: 5 },
  'B+': { min: 5, max: 8 },
  'B': { min: 8, max: 12 },
  'B-': { min: 12, max: 20 },
};

export const EVALUATION_STATUSES = ['Brouillon', 'Soumis', 'En révision', 'Validé', 'Rejeté', 'Archivé'];
export const EVALUATION_TYPES = ['Initiale', 'Annuelle', 'Ad hoc', 'Pré-comité', 'Post-close', 'Monitoring'];
