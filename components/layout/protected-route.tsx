"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager" | "analyst" | "viewer";
}

export function ProtectedRoute({
  children,
  requiredRole = "analyst",
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }

        const user = await res.json();

        // Vérifier le rôle
        const roleHierarchy: Record<string, number> = {
          admin: 4,
          manager: 3,
          analyst: 2,
          viewer: 1,
        };

        if (
          roleHierarchy[user.role] >= roleHierarchy[requiredRole]
        ) {
          setIsAuthorized(true);
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Erreur auth:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
