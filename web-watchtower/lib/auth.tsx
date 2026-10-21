"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { User, Organization } from "./types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  activeOrg: Organization | null;
  setActiveOrgId: (id: number) => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACTIVE_ORG_KEY = "watchtower_active_org";

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [activeOrgId, setActiveOrgIdState] = useState<number | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ data: User }>("/user").then((r) => r.data),
    retry: false,
  });

  useEffect(() => {
    if (!user?.organizations?.length) return;
    const stored = Number(localStorage.getItem(ACTIVE_ORG_KEY));
    const valid = user.organizations.find((o) => o.id === stored);
    // Syncing to localStorage (an external store only readable client-side,
    // once `user` has finished loading from the query) is exactly the
    // "synchronize with an external system" case React's own effect docs
    // call out as a legitimate use — not a derivable-at-render value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveOrgIdState(valid ? valid.id : user.organizations[0].id);
  }, [user]);

  const setActiveOrgId = (id: number) => {
    setActiveOrgIdState(id);
    localStorage.setItem(ACTIVE_ORG_KEY, String(id));
  };

  const activeOrg = user?.organizations?.find((o) => o.id === activeOrgId) ?? null;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        activeOrg,
        setActiveOrgId,
        refetchUser: () => qc.invalidateQueries({ queryKey: ["me"] }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
