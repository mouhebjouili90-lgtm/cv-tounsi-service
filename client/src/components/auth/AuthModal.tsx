import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, User as UserIcon, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    login,
    register,
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
              {tab === "login" ? "Connexion à votre compte" : "Créer un compte CV Tounsi"}
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
