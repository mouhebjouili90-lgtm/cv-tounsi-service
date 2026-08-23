import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
}

export interface SavedCvItem {
  id: number;
  userId: number;
  title: string;
  dataJson: string;
  template: string;
  language: string;
  isUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "register";
  savedCvs: SavedCvItem[];
  isLoadingCvs: boolean;
  openAuthModal: (tab?: "login" | "register") => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginDemoGoogle: () => Promise<boolean>;
  logout: () => void;
  fetchUserCvs: () => Promise<void>;
  saveCvToCloud: (cvData: {
    id?: number;
    title: string;
    dataJson: any;
    template?: string;
    language?: string;
    isUnlocked?: boolean;
  }) => Promise<SavedCvItem | null>;
  deleteCvFromCloud: (cvId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "cvtounsi_user_token";
const AUTH_USER_KEY = "cvtounsi_user_profile";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [savedCvs, setSavedCvs] = useState<SavedCvItem[]>([]);
  const [isLoadingCvs, setIsLoadingCvs] = useState(false);

  const setAuthSession = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
  }, []);

  const clearAuthSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setSavedCvs([]);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  // Verify and refresh session on mount
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
          }
        } else if (res.status === 401) {
          clearAuthSession();
        }
      } catch (err) {
        console.warn("[AuthContext] Unable to verify session online:", err);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [clearAuthSession]);

  const openAuthModal = (tab: "login" | "register" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Échec de connexion.");
        return false;
      }

      setAuthSession(data.token, data.user);
      toast.success(`Bienvenue, ${data.user.name || "cher utilisateur"} !`);
      closeAuthModal();
      return true;
    } catch {
      toast.error("Impossible de joindre le serveur. Vérifiez votre connexion.");
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Échec de l'inscription.");
        return false;
      }

      setAuthSession(data.token, data.user);
      toast.success("Compte créé avec succès ! Bienvenue sur CV Tounsi.");
      closeAuthModal();
      return true;
    } catch {
      toast.error("Impossible de joindre le serveur.");
      return false;
    }
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Erreur de connexion Google.");
        return false;
      }

      setAuthSession(data.token, data.user);
      toast.success(`Connecté avec Google en tant que ${data.user.name}`);
      closeAuthModal();
      return true;
    } catch {
      toast.error("Erreur de connexion avec Google.");
      return false;
    }
  };

  const loginDemoGoogle = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/google/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "candidat.tounsi@gmail.com",
          name: "Candidat Tounsi",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Erreur connexion rapide");
        return false;
      }

      setAuthSession(data.token, data.user);
      toast.success("Connecté instantanément via Google (Compte Démo)");
      closeAuthModal();
      return true;
    } catch {
      toast.error("Erreur serveur lors de la connexion");
      return false;
    }
  };

  const logout = () => {
    clearAuthSession();
    toast.info("Vous avez été déconnecté.");
  };

  const fetchUserCvs = useCallback(async () => {
    const currentToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) return;

    setIsLoadingCvs(true);
    try {
      const res = await fetch("/api/user/cvs", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSavedCvs(data.cvs || []);
      }
    } catch (err) {
      console.error("[AuthContext] Error fetching CVs:", err);
    } finally {
      setIsLoadingCvs(false);
    }
  }, [token]);

  const saveCvToCloud = async (cvData: {
    id?: number;
    title: string;
    dataJson: any;
    template?: string;
    language?: string;
    isUnlocked?: boolean;
  }): Promise<SavedCvItem | null> => {
    const currentToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) {
      openAuthModal("login");
      toast.info("Veuillez vous connecter pour sauvegarder votre CV en ligne.");
      return null;
    }

    try {
      const res = await fetch("/api/user/cvs/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(cvData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Erreur lors de la sauvegarde.");
        return null;
      }

      toast.success("CV sauvegardé avec succès dans votre espace personnel !");
      await fetchUserCvs();
      return data.cv;
    } catch {
      toast.error("Erreur de connexion au serveur.");
      return null;
    }
  };

  const deleteCvFromCloud = async (cvId: number): Promise<boolean> => {
    const currentToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) return false;

    try {
      const res = await fetch(`/api/user/cvs/${cvId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("CV supprimé.");
        setSavedCvs((prev) => prev.filter((c) => c.id !== cvId));
        return true;
      }
      toast.error("Impossible de supprimer le CV.");
      return false;
    } catch {
      toast.error("Erreur serveur.");
      return false;
    }
  };

  // Automatically load user's CVs once authenticated
  useEffect(() => {
    if (user && token) {
      fetchUserCvs();
    }
  }, [user, token, fetchUserCvs]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        savedCvs,
        isLoadingCvs,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginWithGoogle,
        loginDemoGoogle,
        logout,
        fetchUserCvs,
        saveCvToCloud,
        deleteCvFromCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
