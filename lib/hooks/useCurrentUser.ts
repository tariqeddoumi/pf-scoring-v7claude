import { useState, useEffect } from "react";

interface CurrentUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "system_admin" | "scoring_admin" | "risk_manager" | "committee_member" | "risk_analyst" | "auditor" | "read_only";
  avatar?: string;
  createdAt: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          // Default to viewer if not authenticated
          setUser(null);
          setError(null);
          return;
        }
        const corps = await response.json();
        // /api/auth/me répond à plat ({ id, email, nom, … }) et non sous une
        // enveloppe { data }. Le crochet lisait « data.data » : l'utilisateur valait
        // donc toujours null, et tous les contrôles de permission fondés dessus
        // refusaient l'action — « Nouveau projet » restait verrouillé jusque pour un
        // administrateur. L'enveloppe reste tolérée si elle est appliquée un jour.
        const u = corps?.data ?? corps;
        setUser(u?.id ? (u as CurrentUser) : null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return { user, loading, error };
}
