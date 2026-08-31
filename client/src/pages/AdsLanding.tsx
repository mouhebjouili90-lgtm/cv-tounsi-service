import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Star,
  FileText,
  Globe,
  Award,
  Zap,
  ChevronDown,
  MessageCircle,
  Download,
  Flame,
  Check,
  Clock,
  ArrowUpRight,
  Laptop,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { trackEvent, trackWhatsAppClicked } from "@/lib/analytics";

export default function AdsLanding() {
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Track Landing Page View for Meta Ads
    trackEvent("ViewContent", {
      content_name: "Ads Landing Page Offer",
      content_category: "LandingPage",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleStartNow = (source: string) => {
    trackEvent("InitiateCheckout", {
      content_name: "CTA Clicked",
      content_category: source,
    });
    setLocation("/?start=true&ref=offre");
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased selection:bg-[#60735A] selection:text-white pb-20 sm:pb-12">
      {/* ── Top Alert Banner ── */}
      <div className="bg-[#60735A] text-white py-2 px-4 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm" dir="rtl">
        <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          عرض خاص 2026 🇹🇳
        </span>
        <span>سيرة ذاتية احترافية مطابقة للمواصفات التونسية، الكندية والأوروبية: <strong>12.900 دينار (شهر)</strong> أو <strong>29.900 دينار (عام)</strong></span>
      </div>

      {/* ── Navigation Header (Minimaliste sans fuite de trafic) ── */}
      <header className="border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon.jpg" alt="CV Tounsi Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
            <span className="text-xl font-bold font-serif text-[#0F172A]">
              CV <span className="text-[#60735A]">Tounsi</span>
            </span>
          </div>

          <button
            onClick={() => handleStartNow("header_btn")}
            className="inline-flex items-center gap-2 bg-[#60735A] hover:bg-[#4d5c48] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-sm transition-all transform active:scale-95"
          >
            <span>اصنع الـ CV متاعك</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="pt-8 sm:pt-14 pb-12 sm:pb-16 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        {/* Bilingual Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#EBF0E9] text-[#43523e] text-xs sm:text-sm font-semibold mb-6 border border-[#60735A]/20 shadow-sm" dir="rtl">
          <Sparkles className="w-4 h-4 text-[#60735A]" />
          <span className="font-bold text-[#2d3a2a]">رقم 1 في تونس 🇹🇳 · سيرتك الذاتية، محسّنة بالذكاء الاصطناعي ✨</span>
        </div>

        <h1
          className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif text-[#0F172A] leading-[1.28] tracking-tight max-w-3xl mx-auto mb-4 text-center"
          dir="rtl"
        >
          اضمن فرصتك في الخدمة بسيرة ذاتية{" "}
          <span className="text-[#60735A] font-serif">
            احترافية ومقنعة 🚀
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#475569] max-w-2xl mx-auto mb-8 leading-relaxed text-center" dir="rtl">
          اصنع CV مطابق للمواصفات <strong>التونسية</strong>، <strong>الكندية (ATS / IRCC)</strong> و <strong>الأوروبية (Europass)</strong>. الذكاء الاصطناعي يصلحلك ويكتبلك فقرات قوية بكليك وحدة.
        </p>

        {/* Hero CTA Box */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-lg mx-auto mb-6">
          <button
            onClick={() => handleStartNow("hero_primary")}
            className="w-full sm:w-auto flex-1 bg-[#60735A] hover:bg-[#4d5c48] text-white text-base sm:text-lg font-bold px-7 py-4 rounded-2xl shadow-lg shadow-[#60735A]/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>اصنع الـ CV متاعك الآن</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <a
            href={`https://wa.me/21692067554?text=${encodeURIComponent("نحب نفعّل CV Tounsi متاعي 🫒")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClicked("HERO_DIRECT", "student", "Hero Direct WhatsApp")}
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm sm:text-base font-bold px-5 py-4 rounded-2xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>خلاص D17 / WhatsApp 💬</span>
          </a>
        </div>

        {/* 4 Trust Points */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-3xl mx-auto text-xs text-[#334155] bg-white border border-[#E2E8F0] p-3.5 sm:p-4 rounded-2xl shadow-sm mb-6 text-center" dir="rtl">
          <div className="flex items-center justify-center gap-1.5 font-semibold">
            <span className="text-amber-500">⚡</span>
            <span>جاوبوك في أقل من دقيقتين</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 font-semibold">
            <span className="text-emerald-600">🔒</span>
            <span>+2500 CV مفعّل</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 font-semibold">
            <span className="text-blue-600">💯</span>
            <span>ضمان استرجاع 100%</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 font-semibold">
            <span className="text-purple-600">📄</span>
            <span>PDF HD 300 DPI ATS</span>
          </div>
        </div>

        {/* Social Proof Stars */}
        <div className="mt-8 pt-6 border-t border-[#E2E8F0] w-full max-w-xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm text-[#475569]" dir="rtl">
          <div className="flex text-[#D97706]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span><strong>4.9 / 5</strong> تقييم أكثر من 2,500 سيرة ذاتية تم إنشاؤها في تونس</span>
        </div>
      </section>

      {/* ── Avant vs Après (Comparatif Visuel) ── */}
      <section className="py-12 sm:py-16 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14" dir="rtl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#60735A] bg-[#60735A]/10 px-3 py-1 rounded-full">
              علاش تبدّل الطريقة القديمة ؟
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#0F172A] mt-3">
              الـ CV القديم متاعك قاعد يضيّع عليك في فرص خدمة ؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8" dir="rtl">
            {/* Ancien CV */}
            <div className="rounded-2xl p-6 sm:p-8 bg-[#FEF2F2] border border-[#FECACA]/60">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EF4444] text-white">
                  ❌ الـ CV الكلاسيكي (Word / Canva)
                </span>
              </div>
              <ul className="space-y-3.5 text-sm text-[#7F1D1D]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#EF4444] font-bold">✕</span>
                  <span>التنسيق يتبدّل ويفسد وقت الطباعة أو التيليشارجمون.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#EF4444] font-bold">✕</span>
                  <span>جمل عادية ومن غير أرقام وإنجازات واضحة للمشغّل.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#EF4444] font-bold">✕</span>
                  <span>يترفض من روبوتات التوظيف الأوتوماتيكية (ATS).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#EF4444] font-bold">✕</span>
                  <span>موش مطابق لمعايير الهجرة (كندا / أوروبا).</span>
                </li>
              </ul>
            </div>

            {/* CV Tounsi */}
            <div className="rounded-2xl p-6 sm:p-8 bg-[#F0FDF4] border-2 border-[#60735A]/40 shadow-sm relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#60735A] text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> سيرة ذاتية محسّنة مع CV Tounsi
                </span>
                <span className="text-xs font-bold text-[#60735A]">100% منصوح به</span>
              </div>
              <ul className="space-y-3.5 text-sm text-[#14532D]">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 font-bold" />
                  <span><strong>تصميم A4 بالميليمتر :</strong> تقديم نظيف ومحترف يجلب عين المشغّل.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 font-bold" />
                  <span><strong>ذكاء اصطناعي ذكي :</strong> يحوّل مهامك لإنجازات قوية تجيبلك Entretien.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 font-bold" />
                  <span><strong>3 نماذج معتمدة :</strong> تونس، كندا (ATS) و Europass.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 font-bold" />
                  <span><strong>بروفايل مخصص :</strong> وضعية خاصة بالطلبة (PFE / Stages) وأصحاب الخبرة.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Formats Stratégiques ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12" dir="rtl">
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#0F172A]">
            اختار النموذج المناسب لهدفك المهني
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-2">
            كل النماذج متاحة ومشمولة في اشتراكك بدون أي مصاريف إضافية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" dir="rtl">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#EBF0E9] text-[#60735A] flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">سيرة ذاتية للمؤسسات التونسية</h3>
            <p className="text-xs text-[#60735A] font-semibold mb-3">مثالي للشركات في تونس والشركات متعددة الجنسيات</p>
            <p className="text-sm text-[#475569] leading-relaxed">
              تصميم أنيق وكلاسيكي، يبرز خبراتك ومهاراتك الأساسية بأوضح طريقة ترتاح فيها عيون الـ Recruteur.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#D97706]/40 shadow-sm hover:shadow-md transition-all relative">
            <span className="absolute -top-3 left-4 bg-[#D97706] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              مطلوب بكثرة 🔥
            </span>
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">النموذج الكندي (IRCC / ATS)</h3>
            <p className="text-xs text-[#D97706] font-semibold mb-3">للهجرة، عقود العمل، والدخول السريع كندا</p>
            <p className="text-sm text-[#475569] leading-relaxed">
              مطابق 100% للمعايير الكندية الرسمية (بدون صورة، بدون عمر، يركز على المهارات والإنجازات بالأرقام).
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">نموذج Europass (أوروبا)</h3>
            <p className="text-xs text-[#4F46E5] font-semibold mb-3">فرنسا، ألمانيا، إيطاليا، بلجيكا والدراسة</p>
            <p className="text-sm text-[#475569] leading-relaxed">
              المعيار الأوروبي المعتمد من الجامعات والشركات في الاتحاد الأوروبي لتسهيل قبول ملفك.
            </p>
          </div>
        </div>
      </section>

      {/* ── Témoignages Clients ── */}
      <section className="py-12 sm:py-16 bg-[#F4EFE6] border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10" dir="rtl">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A]">
              شنوة قالوا مستعملي CV Tounsi في تونس ؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" dir="rtl">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
              <div className="flex text-[#D97706] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#334155] italic mb-4 leading-relaxed">
                « بعثت أكثر من 15 مطلب خدمة من غير حتى رد. كي عاودت الـ CV متاعي على CV Tounsi بالذكاء الاصطناعي، عيطولي لـ 3 Entretiens في نفس الجمعة ! »
              </p>
              <div className="text-xs">
                <strong className="text-[#0F172A] block">أمين ك.</strong>
                <span className="text-[#64748B]">مهندس برمجيات — تونس</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
              <div className="flex text-[#D97706] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#334155] italic mb-4 leading-relaxed">
                « الموديل الخاص بالطلبة عاوني برشا باش نلقى PFE. الذكاء الاصطناعي حسّنلي كتابة مشاريع القراية وولاّت تبان كخبرة حقيقية. »
              </p>
              <div className="text-xs">
                <strong className="text-[#0F172A] block">سارة م.</strong>
                <span className="text-[#64748B]">طالبة في المالية — صفاقس</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
              <div className="flex text-[#D97706] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#334155] italic mb-4 leading-relaxed">
                « الموديل الكندي من غير تصويرة ربحني برشا وقت في دوسي الهجرة لكندا. خذيت الكود في دقيقتين على الواتساب. »
              </p>
              <div className="text-xs">
                <strong className="text-[#0F172A] block">يوسف ب.</strong>
                <span className="text-[#64748B]">مترشح Entrée Express Canada</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tarification Claire & Garantie ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="mb-8" dir="rtl">
          <span className="bg-[#60735A]/10 text-[#60735A] font-bold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider">
            أسعار واضحة ومناسبة للجميع
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#0F172A] mt-3 mb-2">
            اختار الباقة اللي تناسبك
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mb-6">
            كل الميزات مشمولة في الباقتين · دفع مرة واحدة · مساعدة 7/7 أيام
          </p>

          {/* 3 Étapes de Paiement (Tâche 2) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-sm mb-8 text-right max-w-3xl mx-auto">
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A] mb-3 flex items-center gap-2">
              <span>📲 كيفاش تفعّل الـ CV متاعك في 3 خطوات ساهلة :</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-[#475569]">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                <strong className="text-[#0F172A] block mb-1">1. خلاص عبر D17 / Flouci</strong>
                <span>ابعث 12.9 د.ت (شهر) أو 29.9 د.ت (عام) عبر D17 على <strong>92 067 554</strong>.</span>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                <strong className="text-[#0F172A] block mb-1">2. إرسال الوصل</strong>
                <span>ابعث لقطة شاشة للوصل على الواتساب بكليك وحدة.</span>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                <strong className="text-[#0F172A] block mb-1">3. الكود في دقيقتين ⚡</strong>
                <span>يوصلك كود التفعيل الرسمي وتحمّل الـ CV بالـ HD من غير فلترة !</span>
              </div>
            </div>

            {/* No D17 Assistance Callout */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#92400e] bg-[#fffbeb] p-3 rounded-xl border border-amber-200">
              <span className="font-semibold text-center sm:text-right">
                💬 <strong>ما عندكش D17 ؟</strong> تواصل معنا على الواتساب نلقاولك حلّ دفع ساهل (Flouci، تحويل بنكي، أو خلاص مباشر) !
              </span>
              <a
                href={`https://wa.me/21692067554?text=${encodeURIComponent("سلام، ما عنديش D17 ونحب نخلّص الـ CV 🫒")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-[#d97706] hover:bg-[#b45309] text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
              >
                تواصل معنا
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right max-w-3xl mx-auto" dir="rtl">
          {/* Formule 1 Mois */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-[#60735A] uppercase tracking-wider bg-[#60735A]/10 px-2.5 py-1 rounded-full">
                  ⭐ دخول لمدة شهر (30 يوم)
                </span>
              </div>
              <h3 className="text-xl font-bold font-serif text-[#0F172A]">Pass شهر</h3>
              <p className="text-xs text-[#64748B] mt-1 mb-4">مثالي للتقديم السريع للوظائف وتجهيز ملفاتك فوراً</p>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl sm:text-4xl font-bold font-serif text-[#0F172A]">12.900</span>
                <span className="text-sm font-semibold text-[#64748B]">دينار</span>
                <span className="text-xs text-[#94A3B8] mr-1">/ شهر كامل</span>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[#334155] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span><strong>جميع النماذج الـ 9</strong> (تونس، كندا، أوروبا)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span><strong>تحميل PDF HD</strong> بدقة 300 DPI غير محدود</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span><strong>ذكاء اصطناعي Gemini Flash</strong> غير محدود</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span><strong>حفظ وتعديل أونلاين</strong> (PC والهاتف)</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleStartNow("pricing_month")}
                className="w-full bg-white hover:bg-stone-50 text-[#60735A] border-2 border-[#60735A] text-sm font-bold py-3.5 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span>اصنع الـ CV متاعك (Pass شهر)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={`https://wa.me/21692067554?text=${encodeURIComponent("نحب نفعّل Pass شهر CV Tounsi (12.9 DT) 🫒")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClicked("PRICING_MONTH", "student", "Pass 1 Mois Direct")}
                className="w-full py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold shadow-md transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 border border-emerald-500"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>اطلب على WhatsApp (D17 / 12.9 د.ت)</span>
              </a>
              <p className="text-[11px] text-center text-[#64748B]">يوصلك الكود فوراً بعد خلاص D17</p>
            </div>
          </div>

          {/* Formule 1 An */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#60735A] shadow-xl shadow-[#60735A]/10 relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-6 bg-[#D97706] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              ⭐ أفضل عرض (تخفيض 80%)
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-[#60735A] uppercase tracking-wider bg-[#60735A]/10 px-2.5 py-1 rounded-full">
                  Accès سنة كاملة (12 شهر)
                </span>
              </div>
              <h3 className="text-xl font-bold font-serif text-[#0F172A]">Pass سنة VIP</h3>
              <p className="text-xs text-[#64748B] mt-1 mb-4">لمتابعة عروض الشغل والتحديث المستمر طيلة سنة</p>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl sm:text-4xl font-bold font-serif text-[#0F172A]">29.900</span>
                <span className="text-sm font-semibold text-[#64748B]">دينار</span>
                <span className="text-xs text-[#94A3B8] mr-1">/ عام كامل (أي ~2.4 دت/شهر)</span>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[#334155] mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span><strong>جميع النماذج الـ 9</strong> (تونس، كندا، أوروبا)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span><strong>تحميل PDF HD</strong> بدقة 300 DPI غير محدود</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span><strong>ذكاء اصطناعي Gemini Flash</strong> غير محدود طيلة عام</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span><strong>حفظ أونلاين ودعم VIP</strong> لمدة 12 شهر</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleStartNow("pricing_year")}
                className="w-full bg-[#60735A] hover:bg-[#4d5c48] text-white text-sm font-bold py-3.5 rounded-xl shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span>اصنع الـ CV متاعك (Pass سنة VIP)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={`https://wa.me/21692067554?text=${encodeURIComponent("نحب نفعّل Pass سنة VIP CV Tounsi (29.9 DT) 👑")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClicked("PRICING_YEAR", "pro", "Pass 1 An Direct")}
                className="w-full py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold shadow-md transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 border border-emerald-500"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>اطلب على WhatsApp (D17 / 29.9 د.ت)</span>
              </a>
              <p className="text-[11px] text-center text-[#64748B]">يوصلك كود VIP فوراً بعد خلاص D17</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto" dir="rtl">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A] text-center mb-8">
          الأسئلة الشائعة
        </h2>

        <div className="space-y-3">
          {[
            {
              q: "نجم نجرّب ونشوف الـ CV متاعي بلاش ؟",
              a: "نعم، 100% مجاناً ! تنجم تعمّر كل معلوماتك، تجرّب تحسين الذكاء الاصطناعي، وتشوف شكل الـ CV متاعك مباشرة من غير ما تدفع حتى مليم.",
            },
            {
              q: "كيفاش يخدم تفعيل وتحميل الـ PDF الصافي ؟",
              a: "باش تحمّل نسختك الرسمية Haute Définition من غير فلو، تختار الباقة اللي تناسبك (Pass شهر بـ 12.9 د.ت أو Pass عام بـ 29.9 د.ت). تاخو كود التفعيل في دقيقة على الواتساب (+216 92 067 554) عبر D17 أو Flouci.",
            },
            {
              q: "الـ CV يتماشى مع التقديم لكندا أو فرنسا ؟",
              a: "أكيد. CV Tounsi يوفّر النموذج الكندي الرسمي (IRCC بدون صورة المطابق لقوانين التوظيف الكندية) ونموذج Europass المعتمد في أوروبا.",
            },
            {
              q: "ما عنديش برشا خبرة (طالب / PFE)، هل الموقع يخدمني ؟",
              a: "نعم ! وضعية الطالب تعدّل هيكل الـ CV باش تركّز على قرايتك، مشاريع التخرج (PFE/PFA)، والمهارات التقنية والأنشطة الجمعياتية.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 text-right font-semibold text-sm sm:text-base flex items-center justify-between text-[#0F172A]"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] transition-transform ${
                    openFaq === idx ? "rotate-180 text-[#60735A]" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] pt-3 text-right">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 px-4 text-center text-xs text-[#64748B]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/icon.jpg" alt="CV Tounsi Logo" className="w-6 h-6 rounded-md object-cover" />
          <span className="font-bold font-serif text-[#0F172A] text-sm">CV Tounsi</span>
        </div>
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/politique-de-confidentialite" className="hover:underline text-[#60735A]">
            Politique de Confidentialité
          </Link>
          <Link href="/conditions-utilisation" className="hover:underline text-[#60735A]">
            Conditions d'Utilisation
          </Link>
        </div>
        <p>© {new Date().getFullYear()} CV Tounsi — De Tunis, vers votre prochaine opportunité.</p>
      </footer>

      {/* ── Sticky Mobile Bottom CTA Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] sm:hidden z-50 shadow-lg flex items-center justify-between gap-3" dir="rtl">
        <div>
          <span className="text-[11px] text-[#64748B] block">السعر</span>
          <strong className="text-base text-[#0F172A] font-bold">ابتداءً من 12.9 د.ت</strong>
        </div>
        <button
          onClick={() => handleStartNow("sticky_mobile_cta")}
          className="flex-1 bg-[#60735A] hover:bg-[#4d5c48] text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <span>اصنع الـ CV متاعك</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
