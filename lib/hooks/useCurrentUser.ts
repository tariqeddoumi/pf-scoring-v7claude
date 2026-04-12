import { useState, useEffect } from "react";

interface CurrentUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "admin" | "manager" | "analyst" | "viewer";
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
        const data = await response.json();
        setUser(data.data);
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
