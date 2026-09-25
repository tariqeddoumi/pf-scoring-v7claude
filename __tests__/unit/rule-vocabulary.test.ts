import {
  ACTIONS_REGLE,
  MALUS_MAX,
  TYPES_REGLE,
  bloquePublication,
  estBloquante,
  validerRegle,
} from "@/lib/services/scoring/rule-vocabulary";

describe("estBloquante", () => {
  test("NO_GO et HARD_STOP bloquent l'approbation", () => {
    expect(estBloquante({ ruleType: "NO_GO" })).toBe(true);
    expect(estBloquante({ ruleType: "HARD_STOP" })).toBe(true);
  });

  test("une alerte ne bloque pas", () => {
    expect(estBloquante({ ruleType: "WARNING" })).toBe(false);
    expect(estBloquante({ ruleType: "INFO" })).toBe(false);
  });

  test("la colonne blocking rend bloquante une règle qui ne l'est pas par son type", () => {
    expect(estBloquante({ ruleType: "WARNING", blocking: true })).toBe(true);
  });

  test("un type inconnu ne bloque pas silencieusement", () => {
    expect(estBloquante({ ruleType: "MALUS" })).toBe(false);
    expect(estBloquante({ ruleType: null })).toBe(false);
  });

  test("seul BLOCK_PUBLICATION empêche la publication", () => {
    expect(bloquePublication({ ruleType: "BLOCK_PUBLICATION" })).toBe(true);
    expect(bloquePublication({ ruleType: "NO_GO" })).toBe(false);
  });
});

describe("validerRegle", () => {
  const base = {
    ruleType: "WARNING",
    actionType: "SHOW_WARNING",
    severity: "MEDIUM",
    penaltyValue: 0,
  };

  test("accepte une règle cohérente", () => {
    expect(validerRegle(base).errors).toEqual([]);
  });

  test("refuse un type que le moteur ne reconnaît pas", () => {
    // « MALUS » était proposé par l'ancien formulaire et n'avait aucun effet.
    const r = validerRegle({ ...base, ruleType: "MALUS" });
    expect(r.errors.join(" ")).toMatch(/Type de règle inconnu/);
  });

  test("refuse une action inconnue", () => {
    expect(
      validerRegle({ ...base, actionType: "PENALISER" }).errors.join(" ")
    ).toMatch(/Action inconnue/);
  });

  test("refuse une sévérité inconnue", () => {
    expect(validerRegle({ ...base, severity: "URGENTE" }).errors.join(" ")).toMatch(
      /Sévérité inconnue/
    );
  });

  test("refuse un malus nul sur une action qui en exige un", () => {
    const r = validerRegle({ ...base, actionType: "APPLY_MALUS", penaltyValue: 0 });
    expect(r.errors.join(" ")).toMatch(/exige un montant supérieur à zéro/);
  });

  test("accepte un malus renseigné sur l'action de malus", () => {
    const r = validerRegle({ ...base, actionType: "APPLY_MALUS", penaltyValue: 10 });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  test("signale un malus qui ne sera jamais appliqué", () => {
    const r = validerRegle({ ...base, actionType: "SHOW_WARNING", penaltyValue: 15 });
    expect(r.errors).toEqual([]);
    expect(r.warnings.join(" ")).toMatch(/ne sera pas appliqué/);
  });

  test("refuse un malus négatif ou hors échelle", () => {
    expect(validerRegle({ ...base, penaltyValue: -1 }).errors.join(" ")).toMatch(
      /positif ou nul/
    );
    expect(
      validerRegle({ ...base, penaltyValue: MALUS_MAX + 1 }).errors.join(" ")
    ).toMatch(/ne peut pas dépasser/);
  });

  test("toutes les valeurs proposées par les listes sont acceptées", () => {
    for (const type of TYPES_REGLE) {
      for (const action of ACTIONS_REGLE) {
        const r = validerRegle({
          ruleType: type.code,
          actionType: action.code,
          severity: "MEDIUM",
          penaltyValue: action.exigeMalus ? 5 : 0,
        });
        expect(r.errors).toEqual([]);
      }
    }
  });
});
