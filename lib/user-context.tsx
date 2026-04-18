"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole =
  | "system_admin"
  | "scoring_admin"
  | "risk_analyst"
  | "risk_manager"
  | "committee_member"
  | "auditor"
  | "read_only";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: "active" | "inactive";
  createdAt: Date;
  lastLogin?: Date;
  phone?: string;
  avatar?: string;
}

interface UserContextType {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  createUser: (user: Omit<User, "id" | "createdAt">) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUser: (id: string) => User | null;
  setCurrentUser: (user: User | null) => void;
  getUsersByRole: (role: UserRole) => User[];
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper: Get JWT token from cookie or localStorage
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  // Try to get from cookie first
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];
  if (cookieValue) return cookieValue;

  // Fallback to localStorage (for development)
  return localStorage.getItem("auth_token");
}

// Helper: Parse JWT payload (does NOT verify signature, just extracts payload)
function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load users from API on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        const parsed: User[] = data.data.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          lastLogin: u.lastLogin ? new Date(u.lastLogin) : undefined,
        }));
        setUsers(parsed);

        // Load current user from auth token
        const tokenPayload = parseJwt(token);
        if (tokenPayload && tokenPayload.userId) {
          const user = parsed.find((u) => u.id === tokenPayload.userId);
          if (user) {
            setCurrentUserState(user);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      console.error("[UserContext] Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = async () => {
    await loadUsers();
  };

  const createUser = async (
    user: Omit<User, "id" | "createdAt">
  ): Promise<User> => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.data) {
      const newUser: User = {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        lastLogin: data.data.lastLogin
          ? new Date(data.data.lastLogin)
          : undefined,
      };
      setUsers([...users, newUser]);
      return newUser;
    }

    throw new Error("Failed to create user");
  };

  const updateUser = async (
    id: string,
    updates: Partial<User>
  ): Promise<void> => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.data) {
      setUsers(
        users.map((u) =>
          u.id === id
            ? {
                ...data.data,
                createdAt: new Date(data.data.createdAt),
                lastLogin: data.data.lastLogin
                  ? new Date(data.data.lastLogin)
                  : undefined,
              }
            : u
        )
      );
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.status}`);
    }

    setUsers(users.filter((u) => u.id !== id));
  };

  const getUser = (id: string): User | null => {
    return users.find((u) => u.id === id) || null;
  };

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
  };

  const getUsersByRole = (role: UserRole): User[] => {
    return users.filter((user) => user.role === role);
  };

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        loading,
        error,
        createUser,
        updateUser,
        deleteUser,
        getUser,
        setCurrentUser,
        getUsersByRole,
        refreshUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within UserProvider");
  }
  return context;
}
