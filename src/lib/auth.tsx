"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type UserRole = "admin" | "telecaller" | null;

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: UserRole;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  username: null,
  role: null,
  login: async () => ({ success: false }),
  logout: () => {},
  isAuthenticated: false,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // On mount, check for stored token
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem("auth_token");
      const storedUsername = localStorage.getItem("auth_username");
      const storedRole = localStorage.getItem("auth_role") as UserRole;

      if (storedToken) {
        try {
          const res = await fetch(`${API_URL}/api/auth/verify`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const data = await res.json();
          if (data.valid) {
            setToken(storedToken);
            setUsername(storedUsername || data.username);
            setRole(data.role || storedRole);
          } else {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_username");
            localStorage.removeItem("auth_role");
          }
        } catch {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_username");
          localStorage.removeItem("auth_role");
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  // Redirect based on auth state and role
  useEffect(() => {
    if (isLoading) return;

    if (!token && pathname !== "/login") {
      router.replace("/login");
    } else if (token && pathname === "/login") {
      router.replace(role === "telecaller" ? "/telecaller" : "/");
    } else if (token && role === "telecaller" && !pathname.startsWith("/telecaller") && pathname !== "/login") {
      router.replace("/telecaller");
    } else if (token && role === "admin" && pathname.startsWith("/telecaller/") && !pathname.startsWith("/telecallers")) {
      router.replace("/");
    }
  }, [token, role, pathname, isLoading, router]);

  const login = useCallback(async (user: string, pass: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_username", data.username);
        localStorage.setItem("auth_role", data.role);
        setToken(data.token);
        setUsername(data.username);
        setRole(data.role);
        router.replace(data.role === "telecaller" ? "/telecaller" : "/");
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch {
      return { success: false, error: "Network error. Is the server running?" };
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_username");
    localStorage.removeItem("auth_role");
    setToken(null);
    setUsername(null);
    setRole(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
