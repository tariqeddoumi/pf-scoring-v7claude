"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Ban, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import {
  ACTIONS_REGLE,
  MALUS_MAX,
  SEVERITES,
  SEVERITE_LABELS,
  TYPES_REGLE,
  actionRegle,
  estBloquante,
  typeRegle,
  validerRegle,
  type Severite,
} from "@/lib/services/scoring/rule-vocabulary";
import {
  extractConditionFields,
  validateConditionExpression,
} from "@/lib/services/scoring/condition-evaluator";
import {
  CHAMPS_CONCRETS,
  champReconnu,
} from "@/lib/services/scoring/condition-context";

interface CritereModele {
  id: string;
  code: string;
  label: string;
  depth: number;
}

interface Rule {
  id: string;
  code: string;
  label: string;
  severity: string;
  ruleType: string;
  actionType: string;
  penaltyValue: number | null;
  conditionExpression: string | null;
  blocking?: boolean | null;
  messageUser?: string | null;
  messageCommittee?: string | null;
}

interface RulesTabProps {
  nodeId: string;
  versionId: string;
}

type Brouillon = {
  code: string;
  label: string;
  ruleType: string;
  actionType: string;
  severity: string;
  penaltyValue: string;
  conditionExpression: string;
  messageUser: string;
  messageCommittee: string;
};

const BROUILLON_VIDE: Brouillon = {
  code: "",
  label: "",
  ruleType: "WARNING",
  actionType: "SHOW_WARNING",
  severity: "MEDIUM",
  penaltyValue: "0",
  conditionExpression: "",
  messageUser: "",
  messageCommittee: "",
};

/** Exemples écrits avec les chemins réellement exposés par le moteur. */
const EXEMPLES = [
  "ratios.apportPct < 20",
  "score < 40",
  'projet.countryCode != "MA"',
  'projet.secteur in ["ENERGIE", "EAU"]',
];

/**
 * Édition des règles d'un nœud.
 *
 * L'écran ne montrait ni la condition de déclenchement ni le montant du malus : on
 * pouvait créer une règle « NO_GO » sans condition, que l'API complétait par « true »
 * — elle bloquait alors tous les dossiers — ou un type « MALUS » que le moteur ne
 * reconnaît pas et qui ne faisait rien. La condition, l'action et le malus sont
 * désormais saisis explicitement, et l'effet réel de la règle est affiché.
 */
export function RulesTab({ nodeId, versionId }: RulesTabProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Brouillon>(BROUILLON_VIDE);
  const [erreursServeur, setErreursServeur] = useState<string[]>([]);
  const [criteres, setCriteres] = useState<CritereModele[]>([]);
  const [rechercheCritere, setRechercheCritere] = useState("");

  const loadRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet(
        `/api/admin/scoring/rules?versionId=${versionId}&nodeId=${nodeId}`
      );
      if (res.ok) {
        const data = await res.json();
        setRules(data.data || []);
      }
    } catch (e) {
      console.error("Load rules error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [nodeId, versionId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Les critères servent à composer les conditions : une règle peut interroger
  // n'importe lequel d'entre eux, pas seulement celui auquel elle est rattachée.
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const res = await apiGet(
          `/api/admin/scoring/nodes?versionId=${versionId}&format=light`
        );
        if (!res.ok || annule) return;
        const data = await res.json();
        if (!annule) setCriteres(data.data ?? []);
      } catch (e) {
        console.error("Load criteria error:", e);
      }
    })();
    return () => {
      annule = true;
    };
  }, [versionId]);

  const criteresFiltres = useMemo(() => {
    const q = rechercheCritere.trim().toLowerCase();
    const liste = q
      ? criteres.filter(
          (c) =>
            c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
        )
      : criteres;
    return liste.slice(0, 40);
  }, [criteres, rechercheCritere]);

  const condition = useMemo(
    () => validateConditionExpression(formData.conditionExpression),
    [formData.conditionExpression]
  );

  /** Champs cités par la condition qui ne correspondent à rien d'interrogeable. */
  const champsInconnus = useMemo(
    () =>
      condition.valid
        ? extractConditionFields(formData.conditionExpression).filter(
            (c) => !champReconnu(c)
          )
        : [],
    [condition.valid, formData.conditionExpression]
  );

  const coherence = useMemo(
    () =>
      validerRegle({
        ruleType: formData.ruleType,
        actionType: formData.actionType,
        severity: formData.severity,
        penaltyValue: Number(formData.penaltyValue),
      }),
    [formData.ruleType, formData.actionType, formData.severity, formData.penaltyValue]
  );

  const typeChoisi = typeRegle(formData.ruleType);
  const actionChoisie = actionRegle(formData.actionType);
  const enregistrable =
    formData.code.trim() !== "" && condition.valid && coherence.errors.length === 0;

  const maj = (champ: keyof Brouillon, valeur: string) => {
    setErreursServeur([]);
    setFormData((prec) => ({ ...prec, [champ]: valeur }));
  };

  const ouvrirCreation = () => {
    setEditingId(null);
    setFormData(BROUILLON_VIDE);
    setErreursServeur([]);
    setShowForm(true);
  };

  const ouvrirEdition = (rule: Rule) => {
    setEditingId(rule.id);
    setFormData({
      code: rule.code,
      label: rule.label ?? "",
      ruleType: rule.ruleType,
      actionType: rule.actionType ?? "SHOW_WARNING",
      severity: rule.severity ?? "MEDIUM",
      penaltyValue: String(rule.penaltyValue ?? 0),
      conditionExpression: rule.conditionExpression ?? "",
      messageUser: rule.messageUser ?? "",
      messageCommittee: rule.messageCommittee ?? "",
    });
    setErreursServeur([]);
    setShowForm(true);
  };

  const enregistrer = async () => {
    if (!enregistrable) return;
    const charge = {
      versionId,
      nodeId,
      code: formData.code.trim(),
      label: formData.label.trim() || formData.code.trim(),
      ruleType: formData.ruleType,
      actionType: formData.actionType,
      severity: formData.severity,
      penaltyValue: Number(formData.penaltyValue) || 0,
      conditionExpression: formData.conditionExpression.trim(),
      messageUser: formData.messageUser.trim() || null,
      messageCommittee: formData.messageCommittee.trim() || null,
    };

    try {
      const res = editingId
        ? await apiPut(`/api/admin/scoring/rules?id=${editingId}`, charge)
        : await apiPost("/api/admin/scoring/rules", charge);
      const data = await res.json();

      if (!res.ok) {
        setErreursServeur(
          (data.errors ?? []).map((e: { message: string }) => e.message).length > 0
            ? data.errors.map((e: { message: string }) => e.message)
            : [data.error ?? "Enregistrement refusé."]
        );
        return;
      }

      await loadRules();
      setShowForm(false);
      setEditingId(null);
      setFormData(BROUILLON_VIDE);
    } catch (e) {
      console.error("Save rule error:", e);
      setErreursServeur(["Erreur réseau lors de l'enregistrement."]);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const res = await apiDelete(`/api/admin/scoring/rules?id=${ruleId}`);
      if (res.ok) setRules(rules.filter((r) => r.id !== ruleId));
    } catch (e) {
      console.error("Delete rule error:", e);
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {rules.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune règle pour ce nœud</p>
        ) : (
          rules.map((rule) => {
            const action = actionRegle(rule.actionType);
            const malus = action?.exigeMalus ? (rule.penaltyValue ?? 0) : 0;
            const conditionRegle = validateConditionExpression(rule.conditionExpression);
            return (
              <div key={rule.id} className="p-3 bg-card rounded border border-border">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium">
                      {rule.label || rule.code}
                    </p>
                    <p className="text-muted-foreground text-xs flex flex-wrap gap-2 mt-1">
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {typeRegle(rule.ruleType)?.label ?? rule.ruleType}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {SEVERITE_LABELS[rule.severity as Severite] ?? rule.severity}
                      </span>
                      {estBloquante(rule) && (
                        <span className="bg-destructive/15 text-destructive px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <Ban size={11} />
                          Bloquante
                        </span>
                      )}
                      {malus > 0 && (
                        <span className="bg-warning/15 text-warning px-2 py-0.5 rounded">
                          −{malus} pts
                        </span>
                      )}
                    </p>
                    <code className="block mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 break-all">
                      {rule.conditionExpression || "— aucune condition —"}
                    </code>
                    {!conditionRegle.valid && (
                      <p className="text-xs text-destructive mt-1 inline-flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Condition illisible : la règle ne se déclenchera jamais.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => ouvrirEdition(rule)}
                      className="p-1 hover:bg-accent rounded text-muted-foreground"
                      aria-label={`Modifier la règle ${rule.code}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 hover:bg-accent rounded text-destructive"
                      aria-label={`Supprimer la règle ${rule.code}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!showForm && (
        <button
          onClick={ouvrirCreation}
          className="w-full px-3 py-2 bg-card border border-input rounded hover:bg-accent text-sm text-secondary-foreground flex items-center gap-2 justify-center"
        >
          <Plus size={16} />
          Ajouter une règle
        </button>
      )}

      {showForm && (
        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="text-sm font-medium text-secondary-foreground">
            {editingId ? "Modifier la règle" : "Nouvelle règle"}
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Code (ex. NOGO_DSCR)"
              value={formData.code}
              onChange={(e) => maj("code", e.target.value)}
              disabled={!!editingId}
              className="px-3 py-2 bg-card border border-input rounded text-foreground text-sm disabled:opacity-60"
            />
            <input
              type="text"
              placeholder="Libellé"
              value={formData.label}
              onChange={(e) => maj("label", e.target.value)}
              className="px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Condition de déclenchement
            </label>
            <textarea
              value={formData.conditionExpression}
              onChange={(e) => maj("conditionExpression", e.target.value)}
              rows={2}
              placeholder="dscrMin < 1.05"
              className={`w-full px-3 py-2 bg-card border rounded text-foreground text-sm font-mono ${
                formData.conditionExpression && !condition.valid
                  ? "border-destructive"
                  : "border-input"
              }`}
            />
            {formData.conditionExpression && !condition.valid ? (
              <p className="text-xs text-destructive mt-1 inline-flex items-center gap-1">
                <AlertTriangle size={12} />
                {condition.error}
              </p>
            ) : condition.valid ? (
              champsInconnus.length > 0 ? (
                <p className="text-xs text-warning mt-1 inline-flex items-start gap-1">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  Le moteur n&apos;expose aucun champ nommé{" "}
                  {champsInconnus.map((c) => `« ${c} »`).join(", ")} : la règle ne se
                  déclenchera jamais.
                </p>
              ) : (
                <p className="text-xs text-success mt-1 inline-flex items-center gap-1">
                  <Check size={12} />
                  Champs interrogés :{" "}
                  {extractConditionFields(formData.conditionExpression).join(", ") ||
                    "aucun"}
                </p>
              )
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Opérateurs : <code>&gt; &gt;= &lt; &lt;= == != &amp;&amp; || !</code>,{" "}
                <code>in [ … ]</code>. Exemples :{" "}
                {EXEMPLES.map((ex, i) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => maj("conditionExpression", ex)}
                    className="underline hover:text-foreground"
                  >
                    {ex}
                    {i < EXEMPLES.length - 1 ? " · " : ""}
                  </button>
                ))}
              </p>
            )}

            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Critères du modèle ({criteres.length})
              </summary>
              <div className="mt-2 space-y-1 border border-border rounded p-2">
                <input
                  type="text"
                  value={rechercheCritere}
                  onChange={(e) => setRechercheCritere(e.target.value)}
                  placeholder="Rechercher un critère…"
                  className="w-full px-2 py-1 bg-card border border-input rounded text-foreground text-xs"
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {criteresFiltres.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        maj(
                          "conditionExpression",
                          `${formData.conditionExpression}${formData.conditionExpression ? " " : ""}criteres.${c.code}.valeur`
                        )
                      }
                      className="block w-full text-left text-xs hover:bg-accent rounded px-1 py-0.5"
                      style={{ paddingLeft: `${4 + c.depth * 10}px` }}
                    >
                      <code className="text-secondary-foreground">{c.code}</code>
                      <span className="text-muted-foreground"> — {c.label}</span>
                    </button>
                  ))}
                  {criteresFiltres.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1">
                      Aucun critère ne correspond.
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  Suffixes : <code>.valeur</code>, <code>.option</code>,{" "}
                  <code>.score</code>, <code>.repondu</code>.
                </p>
              </div>
            </details>

            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Autres champs interrogeables ({CHAMPS_CONCRETS.length})
              </summary>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1 border border-border rounded p-2">
                {CHAMPS_CONCRETS.map((c) => (
                  <button
                    key={c.path}
                    type="button"
                    onClick={() =>
                      maj(
                        "conditionExpression",
                        `${formData.conditionExpression}${formData.conditionExpression ? " " : ""}${c.path}`
                      )
                    }
                    className="block w-full text-left text-xs hover:bg-accent rounded px-1 py-0.5"
                  >
                    <code className="text-secondary-foreground">{c.path}</code>
                    <span className="text-muted-foreground">
                      {" "}
                      — {c.label}
                      {c.derive ? " (calculé)" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </details>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Type</label>
              <select
                value={formData.ruleType}
                onChange={(e) => maj("ruleType", e.target.value)}
                className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
              >
                {TYPES_REGLE.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Sévérité</label>
              <select
                value={formData.severity}
                onChange={(e) => maj("severity", e.target.value)}
                className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
              >
                {SEVERITES.map((s) => (
                  <option key={s} value={s}>
                    {SEVERITE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Action</label>
              <select
                value={formData.actionType}
                onChange={(e) => maj("actionType", e.target.value)}
                className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
              >
                {ACTIONS_REGLE.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Malus (points)
              </label>
              <input
                type="number"
                min={0}
                max={MALUS_MAX}
                step="0.5"
                value={formData.penaltyValue}
                onChange={(e) => maj("penaltyValue", e.target.value)}
                disabled={!actionChoisie?.exigeMalus}
                className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Message affiché à l'analyste"
            value={formData.messageUser}
            onChange={(e) => maj("messageUser", e.target.value)}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />
          <input
            type="text"
            placeholder="Message destiné au comité"
            value={formData.messageCommittee}
            onChange={(e) => maj("messageCommittee", e.target.value)}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />

          {/* Ce que la règle fera réellement, avant de l'enregistrer. */}
          <div className="rounded border border-border bg-muted/40 p-3 text-xs space-y-1">
            <p className="text-secondary-foreground font-medium">Effet au calcul</p>
            <p className="text-muted-foreground">{typeChoisi?.effet}</p>
            <p className="text-muted-foreground">{actionChoisie?.effet}</p>
          </div>

          {(coherence.errors.length > 0 ||
            coherence.warnings.length > 0 ||
            erreursServeur.length > 0) && (
            <ul className="text-xs space-y-1">
              {[...coherence.errors, ...erreursServeur].map((e, i) => (
                <li key={`e${i}`} className="text-destructive flex items-start gap-1">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  {e}
                </li>
              ))}
              {coherence.warnings.map((w, i) => (
                <li key={`w${i}`} className="text-warning flex items-start gap-1">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <button
              onClick={enregistrer}
              disabled={!enregistrable}
              className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded text-sm font-medium"
            >
              {editingId ? "Enregistrer" : "Créer"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setErreursServeur([]);
              }}
              className="flex-1 px-3 py-2 bg-muted hover:bg-secondary text-foreground rounded text-sm inline-flex items-center justify-center gap-1"
            >
              <X size={14} />
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
