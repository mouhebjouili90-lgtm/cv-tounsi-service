import React from "react";
import {
  Sparkles,
  LayoutTemplate,
  FileCheck2,
  Eye,
  X,
  MessageCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface OnboardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingGuideModal({ isOpen, onClose }: OnboardingGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "var(--font-sans, inherit)" }}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="relative px-5 pt-4 pb-3 border-b border-[#F1F5F9] bg-[#FAFBF9]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="إغلاق"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF0E9] text-[#3D4F38] text-[11px] font-bold mb-1.5">
            <Sparkles size={12} className="text-[#60735A]" />
            <span>مرحباً بك في CV Tounsi 🇹🇳</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
            اصنع سيرتك الذاتية في 3 خطوات سهلة
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            دليلك السريع للحصول على سيرة ذاتية احترافية مقبولة في تونس والخارج
          </p>
        </div>

        {/* Steps Content List (Scrollable if small screen) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]/70 hover:border-[#60735A]/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#EBF0E9] text-[#60735A] flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
              <LayoutTemplate size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold text-[#0F172A]">01. اختيار النموذج المناسب</span>
                <span className="text-[10px] font-semibold text-[#60735A] bg-[#60735A]/10 px-2 py-0.5 rounded-full">
                  المرحلة الأولى
                </span>
              </div>
              <p className="text-[11.5px] text-[#475569] leading-relaxed">
                اختر بين 9 نماذج معتمدة : <strong>كندا (ATS)</strong>، <strong>أوروبا (Europass)</strong>، أو <strong>تونس والخليج</strong>، مع تحديد وضعيتك (طالب أو صاحب خبرة).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]/70 hover:border-[#60735A]/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
              <Sparkles size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold text-[#0F172A]">02. تعمير البيانات والذكاء الاصطناعي</span>
                <span className="text-[10px] font-semibold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                  صياغة فورية
                </span>
              </div>
              <p className="text-[11.5px] text-[#475569] leading-relaxed">
                أدخل تجاربك ودراستك بسهولة. استعمل ميزة <strong>«تحسين بالذكاء الاصطناعي ✨»</strong> ليكتبلك فقرات قوية ومقنعة للمشغّل في ثوانٍ.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]/70 hover:border-[#60735A]/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
              <Eye size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold text-[#0F172A]">03. المعاينة المباشرة وتحميل PDF</span>
                <span className="text-[10px] font-semibold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full">
                  النتيجة النهائية
                </span>
              </div>
              <p className="text-[11.5px] text-[#475569] leading-relaxed">
                انزل في أي وقت على زر <strong>«معاينة الـ CV مباشرة»</strong> لتشاهد النتيجة، ثم حمّل نسختك الرسمية بجودة عالية <strong>PDF A4</strong> جاهزة للطباعة والإرسال.
              </p>
            </div>
          </div>

          {/* Live Support Note */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px]">
            <MessageCircle size={15} className="shrink-0 text-[#059669]" />
            <span className="leading-snug">
              <strong>فريق الدعم معك ديما :</strong> زر الواتساب الأخضر في الأسفل متوفر لمساعدتك في أي لحظة.
            </span>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 pt-2 border-t border-[#F1F5F9] bg-[#FAFBF9] flex flex-col gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-5 rounded-xl bg-[#60735A] hover:bg-[#4d5c48] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-[#60735A]/20 transition-all flex items-center justify-center gap-2"
          >
            <span>ابدأ الآن — اصنع الـ CV متاعك</span>
            <ArrowLeft size={16} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] font-semibold text-center transition-colors"
          >
            تخطي الدليل والمتابعة ✕
          </button>
        </div>
      </div>
    </div>
  );
}
