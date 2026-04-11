"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "admin" | "manager" | "analyst" | "viewer";

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
  createUser: (user: Omit<User, "id" | "createdAt">) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUser: (id: string) => User | null;
  setCurrentUser: (user: User | null) => void;
  getUsersByRole: (role: UserRole) => User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const MOCK_USERS: User[] = [
  {
    id: "u1",
    name: "Ahmed Ben Selhami",
    email: "ahmed.selhami@bank.ma",
    role: "admin",
    department: "Scoring & Risk",
    status: "active",
    createdAt: new Date("2025-01-15"),
    lastLogin: new Date("2026-04-03"),
    phone: "+212 661 234 567",
    avatar: "👨‍💼",
  },
  {
    id: "u2",
    name: "Fatima Zohra El Fassi",
    email: "fatima.fassi@bank.ma",
    role: "manager",
    department: "Project Finance",
    status: "active",
    createdAt: new Date("2025-02-20"),
    lastLogin: new Date("2026-04-02"),
    phone: "+212 661 345 678",
    avatar: "👩‍💼",
  },
  {
    id: "u3",
    name: "Mohamed Karim Bennani",
    email: "mohamed.karim@bank.ma",
    role: "analyst",
    department: "Scoring & Risk",
    status: "active",
    createdAt: new Date("2025-03-10"),
    lastLogin: new Date("2026-04-01"),
    phone: "+212 661 456 789",
    avatar: "👨‍💻",
  },
  {
    id: "u4",
    name: "Laïla Khouya",
    email: "laila.khouya@bank.ma",
    role: "analyst",
    department: "Scoring & Risk",
    status: "active",
    createdAt: new Date("2025-03-15"),
    lastLogin: new Date("2026-03-30"),
    phone: "+212 661 567 890",
    avatar: "👩‍💻",
  },
  {
    id: "u5",
    name: "Hassan Marhoum",
    email: "hassan.marhoum@bank.ma",
    role: "viewer",
    department: "Executive Board",
    status: "active",
    createdAt: new Date("2025-04-01"),
    lastLogin: new Date("2026-03-28"),
    phone: "+212 661 678 901",
    avatar: "👔",
  },
];

const STORAGE_KEY = "pf_users";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  // Load users from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const parsed: User[] = data.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          lastLogin: u.lastLogin ? new Date(u.lastLogin) : undefined,
        }));
        setUsers(parsed);
      } else {
        // Initialize with mock data
        setUsers(MOCK_USERS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USERS));
      }

      // Set first user as current (admin by default)
      const admin = MOCK_USERS.find((u) => u.role === "admin") || MOCK_USERS[0];
      setCurrentUserState(admin);
    } catch (error) {
      setUsers(MOCK_USERS);
    }
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    try {
      if (users.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      }
    } catch (error) {}
  }, [users]);

  const createUser = (userData: Omit<User, "id" | "createdAt">): User => {
    const newUser: User = {
      ...userData,
      id: `u_${Date.now()}`,
      createdAt: new Date(),
    };

    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const getUser = (id: string): User | null => {
    return users.find((user) => user.id === id) || null;
  };

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      updateUser(user.id, {
        lastLogin: new Date(),
      });
    }
  };

  const getUsersByRole = (role: UserRole): User[] => {
    return users.filter((user) => user.role === role);
  };

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        createUser,
        updateUser,
        deleteUser,
        getUser,
        setCurrentUser,
        getUsersByRole,
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
