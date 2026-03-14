"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as authApi from "@/lib/auth-api";

const TOKEN_KEY = "lemontree_token";

type User = authApi.User;

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  agreeToTerms: () => Promise<void>;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const loadUser = useCallback(async () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    setTokenState(stored);
    try {
      const { user: u } = await authApi.me(stored);
      setUser(u);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: u, token: t } = await authApi.login(email, password);
      setToken(t);
      setUser(u);
      router.push("/");
    },
    [router, setToken]
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      const { user: u, token: t } = await authApi.signup(username, email, password);
      setToken(t);
      setUser(u);
      // Don't redirect yet; onboarding will show mission + terms, then redirect
    },
    [setToken]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.push("/onboarding");
  }, [router, setToken]);

  const agreeToTerms = useCallback(async () => {
    if (!token) return;
    const { user: u } = await authApi.agreeToTerms(token);
    setUser(u);
    router.push("/");
  }, [token, router]);

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    agreeToTerms,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
