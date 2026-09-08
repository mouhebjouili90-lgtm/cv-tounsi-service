import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  RefreshCw,
  Award,
  ShieldCheck,
  Check,
  Briefcase,
  Globe,
} from "lucide-react";
import { scanAndRateCv, type CvScanResult } from "@/lib/cvScanner";
import type { CvData } from "@/pages/Home";
import { toast } from "sonner";

interface CvScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCvData: (extractedData: Partial<CvData>) => void;
}

export function CvScannerModal({ isOpen, onClose, onApplyCvData }: CvScannerModalProps) {
  const [modalStep, setModalStep] = useState<"upload" | "scanning" | "result">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanResult, setScanResult] = useState<CvScanResult | null>(null);
  const [scanPhase, setScanPhase] = useState<1 | 2 | 3>(1);
  const [targetTemplate, setTargetTemplate] = useState<"professional_executive" | "canadian_classic" | "europass_classic">("professional_executive");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setModalStep("upload");
      setSelectedFile(null);
      setScanResult(null);
      setErrorMsg(null);
      setScanPhase(1);
      setTargetTemplate("professional_executive");
    }
  }, [isOpen]);

  // Phase animation during scanning
  useEffect(() => {
    let timer1: any;
    let timer2: any;
    if (modalStep === "scanning") {
      setScanPhase(1);
      timer1 = setTimeout(() => setScanPhase(2), 2500);
      timer2 = setTimeout(() => setScanPhase(3), 6000);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [modalStep]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setModalStep("scanning");

    try {
      const result = await scanAndRateCv(file);
      setScanResult(result);
      if (result.recommendedTemplate) {
        setTargetTemplate(result.recommendedTemplate);
      } else if (result.extractedCv?.template) {
        const t = result.extractedCv.template;
        if (t.includes("canad") || t.includes("ats")) setTargetTemplate("canadian_classic");
        else if (t.includes("euro")) setTargetTemplate("europass_classic");
        else setTargetTemplate("professional_executive");
      }
      setModalStep("result");
      toast.success("تم تحليل سيرتك الذاتية ومطابقتها مع كافة النماذج بنجاح!");
    } catch (err: any) {
      console.error("[CvScannerModal] Scan error:", err);
      setErrorMsg(err?.message || "حدث خطأ أثناء فحص السيرة الذاتية. تأكد من صحة الملف وحاول مجدداً.");
      setModalStep("upload");
      toast.error(err?.message || "تعذر إتمام الفحص.");
    }
  };

  const handleApply = () => {
    if (!scanResult?.extractedCv) return;
    onApplyCvData({
      ...scanResult.extractedCv,
      template: targetTemplate,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px] p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "var(--font-sans, inherit)" }}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
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
            <span>فحص وتقييم بالذكاء الاصطناعي 🇹🇳</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
            {modalStep === "upload" && "ارفع الـ CV الحالي متاعك واكتشف قوته"}
            {modalStep === "scanning" && "جاري فحص وتطوير سيرتك الذاتية..."}
            {modalStep === "result" && "نتيجة تقييم الـ CV بالذكاء الاصطناعي"}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {modalStep === "upload" && " ATS فورية + كشف نقاط الضعف ونقل آلي للقالب الجديد في ثوانٍ"}
            {modalStep === "scanning" && "انتظر بضع ثوانٍ بينما يحلل خبير الذكاء الاصطناعي ملفك"}
            {modalStep === "result" && "اكتشف نقاط القوة وملاحظات التحسين وانقل بياناتك إلى القالب الجديد"}
          </p>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* ══════════════════════════════════════════════
              SCREEN 1: UPLOAD DROPZONE
             ══════════════════════════════════════════════ */}
          {modalStep === "upload" && (
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileInputChange}
              />

              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${isDragging
                    ? "border-[#60735A] bg-[#EBF0E9]/50 scale-[0.99]"
                    : "border-slate-300 hover:border-[#60735A] hover:bg-slate-50/70"
                  }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#EBF0E9] text-[#60735A] flex items-center justify-center shadow-xs">
                  <UploadCloud size={28} />
                </div>

                <div>
                  <strong className="text-sm sm:text-base text-[#0F172A] block font-bold mb-1">
                    اضغط هنا لاختيار ملف الـ CV من هاتفك أو حاسوبك
                  </strong>
                  <span className="text-xs text-[#64748B]">
                    يدعم جميع الصيغ : <strong>PDF, Word (DOCX), أو صورة واضحة (JPG/PNG)</strong>
                  </span>
                </div>

                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#60735A] text-white text-xs font-bold shadow-sm hover:bg-[#4d5c48] transition-colors">
                    <FileText size={14} />
                    <span>تصفح الملفات من جهازك</span>
                  </span>
                </div>

                <span className="text-[11px] text-[#94A3B8]">
                  الحد الأقصى لحجم الملف : 4.5 ميغابايت
                </span>
              </div>

              {/* Quick Demo Test Trigger */}
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const demoCvText = `Mohamed Ben Ali\nIngénieur Logiciel Full-Stack & Cloud\nEmail: mohamed.benali@gmail.com\nTéléphone: +216 98 123 456\nTunis, Tunisie\n\nRésumé Professionnel:\nIngénieur logiciel avec 4 ans d'expérience dans le développement d'applications web scalables (React, Node.js, TypeScript) et architectures Cloud (AWS, Docker). Passionné par la performance et la qualité du code.\n\nExpériences Professionnelles:\n1. Senior Full-Stack Developer — Tech Solutions Tunisia (2022 - Présent)\n- Développement d'une plateforme SaaS B2B (+50 000 utilisateurs actifs).\n- Optimisation SQL et cache Redis (-40% temps de chargement).\n- Encadrement d'une équipe de 3 développeurs.\n\n2. Web Developer — Digital Agency Sousse (2020 - 2022)\n- Conception de dashboards interactifs avec React et Node.js.\n- Intégration de passerelles de paiement sécurisées (Konnect, Flouci).\n\nFormations et Diplômes:\n- Diplôme National d'Ingénieur en Informatique — INSAT Tunis (2015 - 2020)\n\nCompétences Techniques:\nReact, TypeScript, Node.js, PostgreSQL, Docker, AWS, Git, CI/CD\n\nLangues:\nArabe (Maternelle), Français (Courant - C1), Anglais (Courant - C1)`;
                    const blob = new Blob([demoCvText], { type: "text/plain" });
                    const file = new File([blob], "Mohamed_Ben_Ali_CV.txt", { type: "text/plain" });
                    processFile(file);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Sparkles size={14} className="text-amber-600 shrink-0" />
                  <span>⚡ ليس لديك ملف جاهز الآن؟ اضغط لتجربة الفحص بنموذج حي</span>
                </button>
              </div>

              {/* Guarantees Box */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-xs text-slate-700">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-medium leading-tight">بياناتك محمية ولا يتم مشاركتها</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-xs text-slate-700">
                  <Award size={16} className="text-amber-600 shrink-0" />
                  <span className="text-[11px] font-medium leading-tight">فحص ومطابقة لمعايير كندا وأوروبا</span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              SCREEN 2: LOADING & MULTI-STAGE ANALYSIS
             ══════════════════════════════════════════════ */}
          {modalStep === "scanning" && (
            <div className="py-8 px-2 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-18 h-18 rounded-full bg-[#EBF0E9] text-[#60735A] flex items-center justify-center animate-pulse">
                  <Sparkles size={36} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#60735A] text-white flex items-center justify-center">
                  <RefreshCw size={12} className="animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-xs mx-auto">
                <h3 className="text-base font-bold text-[#0F172A]">
                  جاري فحص السيرة الذاتية بالذكاء الاصطناعي
                </h3>
                <p className="text-xs text-[#64748B]">
                  {selectedFile ? `الملف: ${selectedFile.name}` : "يرجى الانتظار ثوانٍ معدودة..."}
                </p>
              </div>

              {/* Dynamic 3 Phases List */}
              <div className="w-full max-w-sm space-y-2.5 text-right">
                <div
                  className={`p-3 rounded-xl border transition-all flex items-center gap-3 text-xs font-semibold ${scanPhase >= 1
                      ? "bg-[#EBF0E9] border-[#60735A]/30 text-[#2D3A2A]"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                    {scanPhase > 1 ? <Check size={14} className="text-emerald-600" /> : "1"}
                  </div>
                  <span>📄 قراءة محتوى الملف واستخراج النصوص والتجارب...</span>
                </div>

                <div
                  className={`p-3 rounded-xl border transition-all flex items-center gap-3 text-xs font-semibold ${scanPhase >= 2
                      ? "bg-[#FEF3C7] border-[#D97706]/30 text-[#92400E]"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                    {scanPhase > 2 ? <Check size={14} className="text-emerald-600" /> : "2"}
                  </div>
                  <span>🧠 فحص معايير أنظمة ATS ومقارنة الكلمات المفتاحية...</span>
                </div>

                <div
                  className={`p-3 rounded-xl border transition-all flex items-center gap-3 text-xs font-semibold ${scanPhase >= 3
                      ? "bg-[#E0F2FE] border-[#0284C7]/30 text-[#0369A1]"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                    <RefreshCw size={12} className="animate-spin text-[#0284C7]" />
                  </div>
                  <span>✨ صياغة البيانات ونقلها إلى القالب الجديد...</span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              SCREEN 3: RATING & DIAGNOSTIC RESULT
             ══════════════════════════════════════════════ */}
          {modalStep === "result" && scanResult && (
            <div className="space-y-4">
              {/* Score Header Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAFBF9] via-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center gap-3.5">
                  {/* Rating Circle Badge */}
                  <div
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold shadow-sm ${
                      scanResult.rating >= 75
                        ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300"
                        : scanResult.rating >= 50
                          ? "bg-amber-100 text-amber-800 border-2 border-amber-300"
                          : "bg-red-100 text-red-800 border-2 border-red-300"
                    }`}
                  >
                    <span className="text-xl leading-none">{scanResult.rating}</span>
                    <span className="text-[10px] uppercase font-semibold">من 100</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-[#0F172A]">
                        {scanResult.rating >= 75
                          ? "سيرة ذاتية قوية وممتازة 🌟"
                          : scanResult.rating >= 50
                            ? "سيرة ذاتية متوسطة، قابلة للارتقاء الفوري ⚡"
                            : "سيرة ذاتية تحتاج إلى إعادة هيكلة وتحسين 🚨"}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#475569] leading-snug">
                      {scanResult.feedback.summary}
                    </p>
                  </div>
                </div>

                {/* 3 Market Fit Pills */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0]">
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                    <span className="text-[10px] text-slate-500 block mb-0.5">💼 احترافي (تونس والخليج)</span>
                    <strong className="text-xs font-bold text-[#2D3A2A]">
                      {scanResult.marketFit?.professional ?? 85}%
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                    <span className="text-[10px] text-slate-500 block mb-0.5">🍁 كندي (روبوتات ATS)</span>
                    <strong className="text-xs font-bold text-[#2D3A2A]">
                      {scanResult.marketFit?.canadian ?? scanResult.atsScore}%
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                    <span className="text-[10px] text-slate-500 block mb-0.5">🇪🇺 أوروبي (Europass)</span>
                    <strong className="text-xs font-bold text-[#2D3A2A]">
                      {scanResult.marketFit?.europass ?? 80}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════
                  INTERACTIVE TEMPLATE SELECTOR (3 STANDARDS)
                 ══════════════════════════════════════════════ */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#60735A]" />
                    <span>اختر القالب لنقل وتنسيق بياناتك فوراً :</span>
                  </span>
                  <span className="text-[10.5px] text-[#64748B] font-medium">
                    (انقر للاختيار)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Card 1: Professional Executive */}
                  <button
                    type="button"
                    onClick={() => setTargetTemplate("professional_executive")}
                    className={`relative p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      targetTemplate === "professional_executive"
                        ? "border-2 border-[#60735A] bg-[#F4F7F3] shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    {scanResult.recommendedTemplate === "professional_executive" && (
                      <span className="absolute -top-2 left-2 px-2 py-0.5 rounded-full bg-[#60735A] text-white text-[9px] font-bold shadow-xs">
                        موصى به لملفك 🎯
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg">💼</span>
                        <span className="text-[10px] font-bold text-[#60735A] bg-[#EBF0E9] px-1.5 py-0.5 rounded-md">
                          {scanResult.marketFit?.professional ?? 85}% ملاءمة
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#0F172A] mb-0.5">
                        احترافي تنفيذي
                      </h4>
                      <p className="text-[10.5px] text-[#64748B] leading-tight">
                        تونس، الخليج والشركات الخاصة (عمودين وبار جانبي)
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end text-[10.5px] font-semibold text-[#60735A]">
                      {targetTemplate === "professional_executive" ? "✓ تم الاختيار" : "اختيار هذا القالب"}
                    </div>
                  </button>

                  {/* Card 2: Canadian Classic ATS */}
                  <button
                    type="button"
                    onClick={() => setTargetTemplate("canadian_classic")}
                    className={`relative p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      targetTemplate === "canadian_classic"
                        ? "border-2 border-[#60735A] bg-[#F4F7F3] shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    {scanResult.recommendedTemplate === "canadian_classic" && (
                      <span className="absolute -top-2 left-2 px-2 py-0.5 rounded-full bg-[#60735A] text-white text-[9px] font-bold shadow-xs">
                        موصى به لملفك 🎯
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg">🍁</span>
                        <span className="text-[10px] font-bold text-[#60735A] bg-[#EBF0E9] px-1.5 py-0.5 rounded-md">
                          {scanResult.marketFit?.canadian ?? scanResult.atsScore}% ملاءمة
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#0F172A] mb-0.5">
                        كندي معتمد ATS
                      </h4>
                      <p className="text-[10.5px] text-[#64748B] leading-tight">
                        كندا، كيبيك وأمريكا (عمود واحد متوافق مع الروبوتات)
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end text-[10.5px] font-semibold text-[#60735A]">
                      {targetTemplate === "canadian_classic" ? "✓ تم الاختيار" : "اختيار هذا القالب"}
                    </div>
                  </button>

                  {/* Card 3: Europass Classic */}
                  <button
                    type="button"
                    onClick={() => setTargetTemplate("europass_classic")}
                    className={`relative p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      targetTemplate === "europass_classic"
                        ? "border-2 border-[#60735A] bg-[#F4F7F3] shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    {scanResult.recommendedTemplate === "europass_classic" && (
                      <span className="absolute -top-2 left-2 px-2 py-0.5 rounded-full bg-[#60735A] text-white text-[9px] font-bold shadow-xs">
                        موصى به لملفك 🎯
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg">🇪🇺</span>
                        <span className="text-[10px] font-bold text-[#60735A] bg-[#EBF0E9] px-1.5 py-0.5 rounded-md">
                          {scanResult.marketFit?.europass ?? 80}% ملاءمة
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#0F172A] mb-0.5">
                        أوروبي Europass
                      </h4>
                      <p className="text-[10.5px] text-[#64748B] leading-tight">
                        فرنسا، ألمانيا ودول الاتحاد الأوروبي (المعايير الرسمية)
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end text-[10.5px] font-semibold text-[#60735A]">
                      {targetTemplate === "europass_classic" ? "✓ تم الاختيار" : "اختيار هذا القالب"}
                    </div>
                  </button>
                </div>
              </div>

              {/* Strengths Card */}
              {scanResult.feedback.strengths?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
                  <strong className="text-emerald-900 font-bold flex items-center gap-1.5 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>نقاط القوة المكتشفة في ملفك :</span>
                  </strong>
                  <ul className="space-y-1 text-emerald-800 text-[11.5px] pr-4 list-disc">
                    {scanResult.feedback.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses Card */}
              {scanResult.feedback.weaknesses?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs">
                  <strong className="text-amber-900 font-bold flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>ملاحظات يجب تصحيحها لزيادة فرص القبول :</span>
                  </strong>
                  <ul className="space-y-1 text-amber-800 text-[11.5px] pr-4 list-disc">
                    {scanResult.feedback.weaknesses.map((weak, idx) => (
                      <li key={idx}>{weak}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Data Summary Pill */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px]">الاسم والمهنة المستخرجة</span>
                  <strong className="text-[#0F172A] font-bold text-xs">
                    {scanResult.extractedCv.fullName || "مرشح"} — {scanResult.extractedCv.targetRole || "مطلوب"}
                  </strong>
                </div>
                <div className="text-left text-[11px] font-semibold text-[#60735A] bg-[#EBF0E9] px-2.5 py-1 rounded-lg">
                  {scanResult.extractedCv.experiences?.length || 0} تجارب مسجلة
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 pt-2 border-t border-[#F1F5F9] bg-[#FAFBF9] flex flex-col gap-2">
          {modalStep === "result" ? (
            <>
              <button
                type="button"
                onClick={handleApply}
                className="w-full py-3 px-5 rounded-xl bg-[#60735A] hover:bg-[#4d5c48] active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#60735A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  🚀 صب البيانات في{" "}
                  {targetTemplate === "canadian_classic"
                    ? "النموذج الكندي ATS"
                    : targetTemplate === "europass_classic"
                      ? "النموذج الأوروبي Europass"
                      : "النموذج الاحترافي التنفيذي"}{" "}
                  وعدّل عليه
                </span>
                <ArrowLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => setModalStep("upload")}
                className="w-full py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] font-semibold text-center transition-colors cursor-pointer"
              >
                فحص ملف سيرة ذاتية آخر 🔄
              </button>
            </>
          ) : modalStep === "upload" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs text-[#64748B] hover:text-[#0F172A] font-semibold text-center transition-colors cursor-pointer"
            >
              إلغاء والمتابعة في تعمير النموذج يدوياً ✕
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
