import React from "react";
import {
  Sparkles,
  UploadCloud,
  LayoutTemplate,
  X,
  ArrowLeft,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface OnboardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner: () => void;
}

export function OnboardingGuideModal({
  isOpen,
  onClose,
  onOpenScanner,
}: OnboardingGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[3px] p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "var(--font-sans, inherit)" }}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="relative px-5 pt-4 pb-3 border-b border-[#F1F5F9] bg-[#FAFBF9] text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="إغلاق"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF0E9] text-[#3D4F38] text-xs font-bold mb-1.5 shadow-xs">
            <Sparkles size={13} className="text-[#60735A]" />
            <span>مرحباً بك في CV Tounsi 🇹🇳</span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] leading-snug">
            كيفاش تحب تصنع سيرتك الذاتية اليوم؟
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            اختر الطريقة الأنسب لك وسيتكفل الذكاء الاصطناعي بالباقي
          </p>
        </div>

        {/* Body Content — Dual Paths */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
          {/* ══════════════════════════════════════════════
              OPTION 1: SCAN & REVAMP EXISTING CV (HERO)
              ══════════════════════════════════════════════ */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-[#FAFBF9] via-[#F3F6F1] to-[#EBF0E9] border-2 border-[#60735A]/40 hover:border-[#60735A] shadow-sm hover:shadow-md transition-all duration-200">
            {/* Recommended Badge */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#60735A] text-white text-[10.5px] font-bold mb-2 shadow-xs">
              <Zap size={11} className="text-amber-300 fill-amber-300" />
              <span>موصى به لمن لديه ملف جاهز</span>
            </div>

            <div className="flex items-start gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#60735A] text-white flex items-center justify-center shrink-0 shadow-sm">
                <UploadCloud size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
                  🚀 عندي CV قديم يحتاج تجديد
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed mt-1">
                  ارفع ملفك القديم (PDF أو صورة): الذكاء الاصطناعي يحلله، يعطيك تقييم ATS، وينقل معلوماتك لقالب جديد فوراً بدون تعب.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#60735A] hover:bg-[#4d5c48] active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#60735A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>فحص وتحسين الـ CV الحالي 📄</span>
              <ArrowLeft size={16} />
            </button>
          </div>

          {/* ══════════════════════════════════════════════
              DIVIDER "أو"
              ══════════════════════════════════════════════ */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-[#E2E8F0] w-full" />
            <span className="bg-white px-3 text-xs font-bold text-[#94A3B8] uppercase shrink-0">
              أو
            </span>
            <div className="border-t border-[#E2E8F0] w-full" />
          </div>

          {/* ══════════════════════════════════════════════
              OPTION 2: START FROM SCRATCH WITH TEMPLATES
              ══════════════════════════════════════════════ */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-400/50 shadow-2xs hover:shadow-xs transition-all duration-200">
            <div className="flex items-start gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                <LayoutTemplate size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
                  ✍️ ما عنديش CV / نحب نبدأ من الصفر
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed mt-1">
                  اختر قالباً احترافياً معتمداً (كندا، أوروبا، تونس والخليج) وسيعينك الذكاء الاصطناعي في كتابة وتنسيق البيانات خطوة بخطوة.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 active:scale-[0.98] text-[#1E293B] font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>اختيار القالب والبدء من الصفر 🎨</span>
              <ArrowLeft size={16} />
            </button>
          </div>

          {/* Trust Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] pt-1">
            <ShieldCheck size={14} className="text-[#60735A]" />
            <span>بياناتك الشخصية سرية ومحمية 100% | دعم مباشر عبر الواتساب</span>
          </div>
        </div>

        {/* Modal Footer / Skip Button */}
        <div className="p-3 border-t border-[#F1F5F9] bg-[#FAFBF9] text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#94A3B8] hover:text-[#0F172A] font-semibold transition-colors cursor-pointer"
          >
            تخطي ومتابعة تصفح النماذج ✕
          </button>
        </div>
      </div>
    </div>
  );
}
