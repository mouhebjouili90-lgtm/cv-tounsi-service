import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth, SavedCvItem } from "@/contexts/AuthContext";
import { FileText, Trash2, Calendar, Sparkles, Plus, Download, CheckCircle, Clock, FolderOpen, Crown, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UserSavedCvsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCv: (cv: SavedCvItem) => void;
  onNewCv: () => void;
  onUpgradeToPro?: () => void;
  unlockedPlan?: "student" | "pro";
}

export function UserSavedCvsModal({ isOpen, onClose, onLoadCv, onNewCv, onUpgradeToPro, unlockedPlan }: UserSavedCvsModalProps) {
  const { user, savedCvs, isLoadingCvs, deleteCvFromCloud } = useAuth();
  const isProUser = user?.role === "pro" || unlockedPlan === "pro";
  const isStudentUser = (user?.role === "student" || unlockedPlan === "student") && !isProUser;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-white border border-stone-200 shadow-2xl rounded-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-stone-900 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  Mes CVs Sauvegardés
                  {isProUser && (
                    <span className="text-[10px] bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" /> VIP PRO
                    </span>
                  )}
                  {isStudentUser && (
                    <span className="text-[10px] bg-sky-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> ÉTUDIANT
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-stone-400 text-xs mt-0.5">
                  Espace de <span className="text-emerald-400 font-semibold">{user?.name}</span> ({user?.email})
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onNewCv();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouveau CV
            </Button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {/* Student Upgrade Banner */}
          {isStudentUser && (
            <div className="bg-gradient-to-r from-sky-50 to-amber-50/60 border border-sky-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-stone-800">
              <div className="flex items-start gap-2.5 min-w-0">
                <GraduationCap className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sky-950 font-bold">Pass Étudiant Actif (1 CV HD Inclus)</strong>
                  <p className="text-stone-600 text-[11px] mt-0.5">
                    Pour créer des CVs illimités et débloquer tous les modèles exécutifs, passez au Pass Pro.
                  </p>
                </div>
              </div>
              {onUpgradeToPro && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onUpgradeToPro();
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-[11px] h-8 px-3 rounded-lg shrink-0 shadow-sm"
                >
                  <Crown className="w-3.5 h-3.5 mr-1" /> Passer Pro (+12 DT)
                </Button>
              )}
            </div>
          )}

          {isLoadingCvs ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-stone-500">Chargement de vos CVs...</p>
            </div>
          ) : savedCvs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-2xl p-6">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-stone-800">Aucun CV sauvegardé pour l'instant</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Lorsque vous créez un CV dans l'éditeur, cliquez sur "Sauvegarder" pour le retrouver ici à tout moment.
              </p>
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onNewCv();
                }}
                className="bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-semibold text-xs rounded-xl"
              >
                Créer mon premier CV
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {savedCvs.map((cv) => {
                let parsedData: any = {};
                try {
                  parsedData = JSON.parse(cv.dataJson);
                } catch {
                  parsedData = {};
                }

                const targetRole = parsedData?.targetRole || parsedData?.personalInfo?.title || "Curriculum Vitae";
                const candidateName = parsedData?.personalInfo?.fullName || user?.name || "Candidat";

                return (
                  <div
                    key={cv.id}
                    className="p-4 rounded-xl border border-stone-200 hover:border-emerald-500/50 bg-stone-50/50 hover:bg-emerald-50/20 transition-all group flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-stone-800 truncate group-hover:text-emerald-900">
                          {cv.title || targetRole}
                        </h4>
                        <p className="text-xs text-stone-500 truncate">
                          {candidateName} • {targetRole}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {cv.updatedAt ? format(new Date(cv.updatedAt), "dd MMM yyyy à HH:mm", { locale: fr }) : "Récemment"}
                          </span>
                          <span>•</span>
                          <span className="capitalize px-1.5 py-0.5 rounded bg-stone-200/60 text-stone-600 text-[10px] font-semibold">
                            {cv.template}
                          </span>
                          {cv.isUnlocked ? (
                            <span className="flex items-center gap-0.5 text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              <CheckCircle className="w-2.5 h-2.5" />
                              {isProUser ? "👑 Débloqué HD (Pro VIP)" : "🎓 Débloqué HD"}
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              🔒 Brouillon Démo (Pass Pro Requis)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          onLoadCv(cv);
                          onClose();
                        }}
                        className="bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-lg h-8 px-3"
                      >
                        Ouvrir
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCvFromCloud(cv.id)}
                        className="text-stone-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                        title="Supprimer ce CV"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
