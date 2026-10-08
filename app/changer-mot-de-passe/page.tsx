"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Loader2, X } from "lucide-react";
import { apiPost, messageErreurApi } from "@/lib/api-client";

const REGLES: Array<{ libelle: string; test: (m: string) => boolean }> = [
  { libelle: "12 caractères au moins", test: (m) => m.length >= 12 },
  { libelle: "une majuscule", test: (m) => /[A-Z]/.test(m) },
  { libelle: "une minuscule", test: (m) => /[a-z]/.test(m) },
  { libelle: "un chiffre", test: (m) => /[0-9]/.test(m) },
  { libelle: "un caractère spécial", test: (m) => /[^A-Za-z0-9]/.test(m) },
];

const champ =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none";

/**
 * Changement du mot de passe.
 *
 * Écran imposé à la première connexion (mot de passe provisoire attribué par un
 * administrateur) : tant que le mot de passe n'est pas remplacé, le serveur refuse
 * l'accès au reste de l'application. Il sert aussi à changer son mot de passe à tout
 * moment.
 */
export default function ChangerMotDePassePage() {
  const router = useRouter();
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const regles = useMemo(() => REGLES.map((r) => ({ ...r, ok: r.test(nouveau) })), [nouveau]);
  const pret = actuel.length > 0 && regles.every((r) => r.ok) && nouveau === confirmation;

  const valider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pret) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await apiPost("/api/auth/changer-mot-de-passe", { actuel, nouveau });
      if (!res.ok) throw new Error(await messageErreurApi(res, "Changement impossible."));
      router.push("/dashboard");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Changement impossible.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={valider} className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-xl">
        <div className="mb-5 flex items-center gap-2">
          <KeyRound size={20} className="text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Choisissez votre mot de passe</h1>
        </div>
        <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">
          Remplacez le mot de passe provisoire qui vous a été communiqué. Ne le réutilisez nulle part ailleurs.
        </p>

        <label className="mb-3 block text-[13px] text-foreground">
          Mot de passe actuel (provisoire)
          <input type="password" autoComplete="current-password" value={actuel} onChange={(e) => setActuel(e.target.value)} className={`${champ} mt-1`} required />
        </label>
        <label className="mb-3 block text-[13px] text-foreground">
          Nouveau mot de passe
          <input type="password" autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} className={`${champ} mt-1`} required />
        </label>
        <ul className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
          {regles.map((r) => (
            <li key={r.libelle} className={`flex items-center gap-1 ${r.ok ? "text-success" : "text-muted-foreground"}`}>
              {r.ok ? <Check size={12} /> : <X size={12} />} {r.libelle}
            </li>
          ))}
        </ul>
        <label className="mb-4 block text-[13px] text-foreground">
          Confirmation
          <input type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={`${champ} mt-1`} required />
        </label>
        {confirmation && nouveau !== confirmation && (
          <p className="mb-3 text-[12.5px] text-destructive">La confirmation ne correspond pas.</p>
        )}
        {erreur && <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erreur}</p>}

        <button
          type="submit"
          disabled={!pret || envoi}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {envoi && <Loader2 size={15} className="animate-spin" />}
          Enregistrer mon mot de passe
        </button>
      </form>
    </div>
  );
}
