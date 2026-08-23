import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, User as UserIcon, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    login,
    register,
    loginWithGoogle,
    loginDemoGoogle,
  } = useAuth();

  const [tab, setTab] = useState<"login" | "register">(authModalTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setTab(authModalTab);
    setErrorMsg("");
  }, [authModalTab, isAuthModalOpen]);

  // Load Google Identity Services Script if Google Client ID is available
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const googleClientId = (window as any).VITE_GOOGLE_CLIENT_ID || "102839218392-demo.apps.googleusercontent.com";
    if ((window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response?.credential) {
              loginWithGoogle(response.credential);
            }
          },
        });

        const btnElement = document.getElementById("google-signin-official-btn");
        if (btnElement) {
          (window as any).google.accounts.id.renderButton(btnElement, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
            locale: "fr",
          });
        }
      } catch (err) {
        console.debug("Google Identity initialization fallback:", err);
      }
    }
  }, [isAuthModalOpen, loginWithGoogle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (tab === "login") {
        const ok = await login(email, password);
        if (!ok) setErrorMsg("Identifiants incorrects ou compte introuvable.");
      } else {
        if (!name.trim()) {
          setErrorMsg("Veuillez saisir votre nom complet.");
          setIsSubmitting(false);
          return;
        }
        const ok = await register(name, email, password);
        if (!ok) setErrorMsg("Impossible de créer le compte. Vérifiez l'adresse email.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white border border-stone-200 shadow-2xl rounded-2xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] p-6 text-white text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 mb-2 border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            Espace Candidat Sécurisé
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
              {tab === "login" ? "Bon retour parmi nous !" : "Créez votre compte CV Tounsi"}
            </DialogTitle>
            <DialogDescription className="text-emerald-100/90 text-sm mt-1">
              {tab === "login"
                ? "Retrouvez tous vos CVs sauvegardés et vos téléchargements."
                : "Sauvegardez vos CVs dans le cloud et modifiez-les à tout moment."}
            </DialogDescription>
          </DialogHeader>

          {/* Tab Switcher */}
          <div className="flex bg-black/20 p-1 rounded-xl mt-4 max-w-[280px] mx-auto border border-white/10">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorMsg("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                tab === "login"
                  ? "bg-white text-[#1b4332] shadow-sm font-bold"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setErrorMsg("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                tab === "register"
                  ? "bg-white text-[#1b4332] shadow-sm font-bold"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Inscription
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Google Sign-in Option */}
          <div className="space-y-2">
            <div id="google-signin-official-btn" className="w-full"></div>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => loginDemoGoogle()}
              className="w-full flex items-center justify-center gap-2.5 h-11 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-700 font-medium rounded-xl transition-all shadow-sm group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google (1-Clic)</span>
            </Button>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-stone-200 w-full"></div>
            <span className="bg-white px-3 text-xs font-semibold uppercase text-stone-400 tracking-wider">
              ou avec votre email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name" className="text-xs font-semibold text-stone-700">
                  Nom et Prénom
                </Label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="auth-name"
                    type="text"
                    placeholder="Ex: Mohamed Ben Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-9 h-10 border-stone-200 focus-visible:ring-[#2d6a4f] rounded-xl text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-email" className="text-xs font-semibold text-stone-700">
                Adresse Email
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="nom@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 h-10 border-stone-200 focus-visible:ring-[#2d6a4f] rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-password" className="text-xs font-semibold text-stone-700">
                  Mot de passe
                </Label>
                {tab === "login" && (
                  <span className="text-[11px] text-[#2d6a4f] hover:underline cursor-pointer">
                    Mot de passe oublié ?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-9 h-10 border-stone-200 focus-visible:ring-[#2d6a4f] rounded-xl text-sm"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <span>{tab === "login" ? "Se connecter" : "Créer mon compte"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Benefits footer */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-around text-[11px] text-stone-500 font-medium">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sauvegarde automatique</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Accès multi-appareils</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
