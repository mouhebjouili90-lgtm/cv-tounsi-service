import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Star,
  MessageCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Globe,
  FileText,
  Zap,
  Award,
  Phone,
  User,
  Mail,
  MapPin,
  Check,
  Send,
  HelpCircle,
  Copy,
  Mic,
  FileUp,
  FileCheck,
  Upload,
  ChevronDown,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { trackServiceOrderViewed, trackServiceOrderSubmitted } from "@/lib/analytics";

interface ServicePack {
  id: string;
  title: string;
  badge?: string;
  price: number;
  originalPrice: number;
  deliveryTime: string;
  features: string[];
  popular?: boolean;
}

const SERVICE_PACKS: ServicePack[] = [
  {
    id: "essential",
    title: "الباقة الأساسية",
    badge: "سريعة واقتصادية",
    price: 29,
    originalPrice: 50,
    deliveryTime: "تسليم في 4 ساعات",
    features: [
      "1 سيرة ذاتية احترافية بصيغة PDF عالي الدقة A4",
      "نموذج واحد من اختيارك (تونسي، كندي ATS أو أوروبي)",
      "لغة واحدة من اختيارك (فرنسية، إنجليزية أو عربية)",
      "صياغة احترافية للمهام وتدقيق لغوي وبشري كامل",
      "متوافقة 100% مع أنظمة الفرز الآلي للشركات (ATS)",
      "تعديلات مجانية لمدة 48 ساعة بعد الاستلام",
    ],
  },
  {
    id: "pro_vip",
    title: "باقة المحترفين VIP",
    badge: "⭐ الأكثر طلباً (-45%)",
    price: 49,
    originalPrice: 90,
    deliveryTime: "تسليم ذو أولوية في ساعتين",
    popular: true,
    features: [
      "2 سير ذاتية (مثال: نموذج تونسي كلاسيكي + نموذج كندي ATS أو أوروبي)",
      "لغتان كاملتان (نسخة بالفرنسية + نسخة بالإنجليزية)",
      "صياغة قوية للمشاريع والإنجازات بلغة أرقام مقنعة للمشغلين",
      "تصميم حديث A4 جذاب ومطابق لمقاييس التوظيف الدولية",
      "تسليم سريع ذو أولوية قصوى على واتساب والبريد",
      "تعديلات غير محدودة حتى الرضا التام",
    ],
  },
];

export default function ServiceOrderPage() {
  const [selectedPackId, setSelectedPackId] = useState<string>("pro_vip");
  const [selectedPayment, setSelectedPayment] = useState<"d17" | "flouci" | "virement">("d17");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "تونس",
    targetRole: "",
    educationLevel: "",
    objective: "travail_tn",
    preferredLanguage: "fr",
    preferredFormat: "canadian_tn",
    experiencesText: "",
    skillsText: "",
    notes: "",
  });

  useEffect(() => {
    trackServiceOrderViewed();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const selectedPack = SERVICE_PACKS.find((p) => p.id === selectedPackId) || SERVICE_PACKS[1];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error("حجم الملف كبير جداً. يرجى اختيار ملف أقل من 15 ميغابايت.");
        return;
      }
      setAttachedFileName(file.name);
      toast.success(`تم إرفاق الملف : ${file.name}`);
    }
  };

  const copyD17Number = () => {
    navigator.clipboard.writeText("92067554");
    toast.success("✅ تم نسخ رقم D17 (92 067 554) بنجاح !");
  };

  const generateWhatsAppMessage = () => {
    const objectiveLabels: Record<string, string> = {
      travail_tn: "بحث عن عمل في تونس",
      pfe_stage: "تربص تخرج (PFE) أو تربص صيفي",
      canada: "هجرة أو عمل في كندا (IRCC ATS)",
      europe: "عقد عمل أو دراسة في أوروبا (Europass)",
      gulf: "عمل في دول الخليج (دبي، قطر، السعودية)",
      reconversion: "تغيير المجال المهني (Reconversion)",
    };

    const languageLabels: Record<string, string> = {
      fr: "الفرنسية (Français)",
      en: "الإنجليزية (English)",
      ar: "العربية (Arabe)",
      fr_en: "نسختان: فرنسية + إنجليزية",
    };

    const paymentLabels: Record<string, string> = {
      d17: "📲 D17 البريد التونسي (92 067 554)",
      flouci: "💳 Flouci / بطاقة بنكية",
      virement: "🏦 تحويل بنكي",
    };

    const msg =
      `سلام عليكم، نحب نطلب خدمة إعداد الـ CV الجاهز من CV Tounsi 🫒\n\n` +
      `📌 *تفاصيل الطلب :*\n` +
      `• *الباقة المختارة :* ${selectedPack.title} (${selectedPack.price} دينار)\n` +
      `• *الاسم واللقب :* ${formData.fullName.trim() || "غير محدد"}\n` +
      `• *رقم الهاتف / واتساب :* ${formData.phone.trim() || "غير محدد"}\n` +
      `• *الولاية / المدينة :* ${formData.city}\n` +
      `• *المنصب أو المجال المستهدف :* ${formData.targetRole.trim() || "غير محدد"}\n` +
      `• *الهدف من السيرة الذاتية :* ${objectiveLabels[formData.objective] || formData.objective}\n` +
      `• *اللغة المطلوبة :* ${languageLabels[formData.preferredLanguage] || formData.preferredLanguage}\n` +
      `• *طريقة الدفع المختارة :* ${paymentLabels[selectedPayment]}\n` +
      (attachedFileName ? `📎 *ملف مرفق :* ${attachedFileName} (سأرسله في هذه المحادثة)\n` : "") +
      (formData.educationLevel ? `🎓 *المستوى الدراسي / الشهادة :* ${formData.educationLevel}\n` : "") +
      (formData.experiencesText ? `💼 *الخبرات والمهام :*\n${formData.experiencesText}\n\n` : "") +
      (formData.skillsText ? `⚡ *المهارات واللغات :*\n${formData.skillsText}\n\n` : "") +
      (formData.notes ? `📝 *ملاحظات إضافية :*\n${formData.notes}\n\n` : "") +
      `أرجو تأكيد استلام الطلب وتزويدي بتأكيد المعاملة للبدء في تجهيز الـ CV فوراً. شكراً لكم !`;

    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("الرجاء إدخال الاسم واللقب.");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("الرجاء إدخال رقم الهاتف أو الواتساب للتواصل.");
      return;
    }

    if (!formData.targetRole.trim()) {
      toast.error("الرجاء إدخال المنصب أو المجال المستهدف.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Dispatch analytics Lead & Contact
      trackServiceOrderSubmitted({
        packTitle: selectedPack.title,
        amount: selectedPack.price,
        fullName: formData.fullName,
        phone: formData.phone,
        paymentMethod: selectedPayment,
      });

      // 2. Save order to server proxy (if available)
      fetch("/api/track-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "Lead",
          customData: {
            packId: selectedPack.id,
            packTitle: selectedPack.title,
            amount: selectedPack.price,
            targetRole: formData.targetRole,
            paymentMethod: selectedPayment,
          },
          userData: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
          },
        }),
      }).catch(() => {});

      // 3. Store locally in browser for convenience
      localStorage.setItem(
        "cv_tounsi_last_service_order",
        JSON.stringify({
          ...formData,
          pack: selectedPack,
          date: new Date().toISOString(),
        })
      );

      // 4. Open WhatsApp directly
      const message = generateWhatsAppMessage();
      const whatsappUrl = `https://wa.me/21692067554?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      setIsSuccessModalOpen(true);
      toast.success("تم تجهيز طلبك وفتح محادثة الواتساب بنجاح !");
    } catch {
      toast.error("حدث خطأ أثناء إرسال الطلب. يرجى التواصل معنا مباشرة على 92 067 554.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderText = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ نص الطلب بنجاح ! يمكنك لصقه في واتساب.");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased selection:bg-[#60735A] selection:text-white pb-24">
      {/* ── Top Announcement Bar ── */}
      <div className="bg-[#60735A] text-white py-2 px-4 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm">
        <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          خدمة VIP
        </span>
        <span>
          ماعندكش وقت باش تصنع CV وحدك؟ <strong>خبيرنا يتكفل بكل شيء ويسلملك الـ CV جاهز في ساعات معدودة</strong>
        </span>
      </div>

      {/* ── Header ── */}
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <span className="w-8 h-8 rounded-lg bg-[#60735A] text-white flex items-center justify-center font-bold font-serif text-lg">
                C
              </span>
              <span className="text-xl font-bold font-serif text-[#0F172A]">
                CV <span className="text-[#60735A]">Tounsi</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/offre">
              <button className="text-xs sm:text-sm font-semibold text-[#475569] hover:text-[#60735A] px-3 py-2 rounded-lg transition-colors">
                اصنع بنفسك (12.9 DT)
              </button>
            </Link>
            <a
              href="https://wa.me/21692067554?text=%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D9%86%D8%AD%D8%A8%20%D9%86%D8%B3%D8%AA%D9%81%D8%B3%D8%B1%20%D8%B9%D9%84%D9%89%20%D8%AE%D8%AF%D9%85%D8%A9%20%D8%A5%D8%B9%D8%AF%D8%A7%D8%AF%20%D8%A7%D9%84%D9%80%20CV%20%D8%A7%D9%84%D8%AC%D8%A7%D9%87%D8%B2%20%F0%9F%AB%92"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>مساعدة واتساب</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="pt-8 sm:pt-14 pb-10 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBF0E9] text-[#43523e] text-xs sm:text-sm font-semibold mb-5 border border-[#60735A]/20 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#60735A]" />
          <span>خدمة إعداد وكتابة السيرة الذاتية الاحترافية للباحثين عن عمل والطلبة</span>
        </div>

        <h1
          className="text-3xl sm:text-5xl font-bold font-serif text-[#0F172A] leading-[1.3] mb-5"
          style={{ textWrap: "balance" }}
        >
          خلّي خبير التوظيف يصنعلك{" "}
          <span className="text-[#60735A] font-serif">
            سيرة ذاتية متكاملة ومقنعة
          </span>
        </h1>

        <p
          className="text-base sm:text-lg text-[#475569] max-w-2xl mx-auto mb-8 leading-relaxed"
          style={{ textWrap: "balance" }}
        >
          أعطينا فقط معلوماتك الأساسية، وخبيرنا معززاً بالذكاء الاصطناعي يتولى الصياغة المهنية، تنسيق الـ ATS، والتصميم الأنيق — واستلم ملف الـ PDF عالي الدقة على الواتساب في أقل من ساعتين.
        </p>

        {/* Value badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs sm:text-sm text-[#334155]">
          <div className="bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-[#60735A] shrink-0" />
            <span>تسليم سريع في 2-4h</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#60735A] shrink-0" />
            <span>مطابق لمعايير ATS</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-[#60735A] shrink-0" />
            <span>تعديلات مجانية مفتوحة</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-[#D97706] fill-current shrink-0" />
            <span>+2500 سيرة مقبولة</span>
          </div>
        </div>
      </section>

      {/* ── Main Order Workflow ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── STEP 1: Choose Package ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
              <span className="w-7 h-7 rounded-full bg-[#60735A] text-white text-sm font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-serif">
                اختر الباقة المناسبة لهدفك
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {SERVICE_PACKS.map((pack) => {
                const isSelected = selectedPackId === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPackId(pack.id)}
                    className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between border-2 ${
                      isSelected
                        ? "border-[#60735A] bg-[#F4F7F3] shadow-lg ring-2 ring-[#60735A]/20 transform scale-[1.02]"
                        : "border-[#E2E8F0] bg-white hover:border-[#60735A]/40 hover:shadow-md"
                    }`}
                  >
                    {pack.badge && (
                      <div
                        className={`absolute -top-3.5 right-6 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                          pack.popular
                            ? "bg-[#D97706] text-white"
                            : "bg-[#60735A] text-white"
                        }`}
                      >
                        {pack.badge}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg text-[#0F172A]">
                          {pack.title}
                        </h3>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-[#60735A] bg-[#60735A] text-white"
                              : "border-[#CBD5E1]"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2 my-3">
                        <span className="text-4xl font-bold text-[#0F172A] font-serif">
                          {pack.price}
                        </span>
                        <span className="text-sm font-bold text-[#64748B]">دينار تونسي</span>
                        <span className="text-sm text-[#94A3B8] line-through mr-1">
                          {pack.originalPrice} DT
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#43523e] bg-[#EBF0E9] px-2.5 py-1 rounded-lg mb-5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pack.deliveryTime}</span>
                      </div>

                      <ul className="space-y-2.5 text-xs sm:text-sm text-[#475569] mb-6">
                        {pack.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className={`text-center py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                        isSelected
                          ? "bg-[#60735A] text-white shadow-md shadow-[#60735A]/20"
                          : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                      }`}
                    >
                      {isSelected ? "✓ تم اختيار هذه الباقة" : "اختيار هذه الباقة"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── STEP 2: Candidate Info ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
              <span className="w-7 h-7 rounded-full bg-[#60735A] text-white text-sm font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-serif">
                معلوماتك وبيانات التواصل
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                  الاسم واللقب <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="مثال : محمد بن علي"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="w-full pr-10 pl-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/30 focus:border-[#60735A] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                  رقم الهاتف / الواتساب <span className="text-red-500">*</span> (لاستلام الـ PDF)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="مثال : 92067554 أو 21692067554"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full pr-10 pl-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/30 focus:border-[#60735A] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                  البريد الإلكتروني (اختياري)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="exemple@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full pr-10 pl-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/30 focus:border-[#60735A] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                  الولاية / المدينة
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-3.5 pointer-events-none" />
                  <select
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full pr-10 pl-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/30 focus:border-[#60735A] transition-all appearance-none"
                  >
                    {[
                      "تونس",
                      "أريانة",
                      "بن عروس",
                      "منوبة",
                      "سوسة",
                      "صفاقس",
                      "المنستير",
                      "نابل",
                      "بنزرت",
                      "قابس",
                      "المهدية",
                      "القيروان",
                      "مدنين",
                      "جندوبة",
                      "الكاف",
                      "القصرين",
                      "سيدي بوزيد",
                      "توزر",
                      "قبلي",
                      "تطاوين",
                      "باجة",
                      "سليانة",
                      "زغوان",
                      "خارج تونس (مقيم بالخارج)",
                    ].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 3: Career Details & Objective ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
              <span className="w-7 h-7 rounded-full bg-[#60735A] text-white text-sm font-bold flex items-center justify-center">
                3
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-serif">
                مسارك المهني وتفاصيل سيرتك الذاتية
              </h2>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                    المنصب أو المجال المطلوب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Développeur Web, Comptable, Commercial, Infirmier..."
                    value={formData.targetRole}
                    onChange={(e) => handleInputChange("targetRole", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/30 focus:border-[#60735A] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                    الهدف الأساسي من السيرة الذاتية
                  </label>
                  <select
                    value={formData.objective}
                    onChange={(e) => handleInputChange("objective", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/30 focus:border-[#60735A] transition-all"
                  >
                    <option value="travail_tn">بحث عن عمل في شركات بتونس</option>
                    <option value="pfe_stage">تربص تخرج (PFE) أو تربص صيفي</option>
                    <option value="canada">هجرة أو بحث عن عمل في كندا (IRCC ATS)</option>
                    <option value="europe">عقد عمل أو دراسة في فرنسا وأوروبا (Europass)</option>
                    <option value="gulf">فرص عمل في دول الخليج (دبي، قطر، السعودية)</option>
                    <option value="reconversion">تغيير المسار المهني (Reconversion)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                    اللغة المفضلة للسيرة الذاتية
                  </label>
                  <select
                    value={formData.preferredLanguage}
                    onChange={(e) => handleInputChange("preferredLanguage", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/30 focus:border-[#60735A] transition-all"
                  >
                    <option value="fr">الفرنسية (Français — الأكثر طلباً بتونس)</option>
                    <option value="en">الإنجليزية (English — لكندا والشركات الدولية)</option>
                    <option value="fr_en">نسختان: فرنسية + إنجليزية (مشمول في باقة VIP)</option>
                    <option value="ar">العربية (Arabe)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                    المستوى الدراسي والشهادات
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: Licence Informatique, Master Finance, Bac+3, BTS..."
                    value={formData.educationLevel}
                    onChange={(e) => handleInputChange("educationLevel", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/30 focus:border-[#60735A] transition-all"
                  />
                </div>
              </div>

              {/* Voice Note & Direct Input Helper */}
              <div className="bg-gradient-to-r from-[#EBF0E9] to-[#E2EBDD] border border-[#60735A]/30 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#60735A] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#20301D] mb-0.5">
                    ما عندكش وسع بال باش تكتب كل شيء ؟
                  </h4>
                  <p className="text-xs text-[#43523E] leading-relaxed">
                    يكفي تعمير المعلومات الأساسية، وتنجم تسجّل <strong>ملاحظات صوتية (Vocal)</strong> على الواتساب بعد تأكيد الطلب تحكيلنا فيها على خدمتك وقرايتك وخبيرنا يتكفل بصياغتها بالكامل !
                  </p>
                </div>
              </div>

              {/* LARGE CASE 1: Expériences professionnelles & Projets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-[#334155]">
                    💼 تفاصيل الخبرات المهنية، المهام ومشاريع التخرج (مساحة واسعة لتفاصيلك)
                  </label>
                  <span className="text-[11px] text-[#60735A] font-bold bg-[#EBF0E9] px-2 py-0.5 rounded-md">
                    اكتب بكل راحة وحرية
                  </span>
                </div>
                <textarea
                  rows={6}
                  placeholder="اكتب هنا تفاصيل تجاربك المهنية، الشركات أو المحلات التي عملت بها، المدة الزمنية، وأبرز المهام التي قمت بها...&#10;&#10;مثال :&#10;• 2022 — 2024 : مسؤول مبيعات بشركة X (إدارة فريق، استقبال الحرفاء، تحقيق أهداف المبيعات)...&#10;• 2021 : تربص تخرج PFE بشركة Y (إعداد دراسة تقنية وتطوير المشروع)...&#10;&#10;💡 يمكنك أيضاً لصق نص سيرتك الذاتية القديمة كاملاً هنا."
                  value={formData.experiencesText}
                  onChange={(e) => handleInputChange("experiencesText", e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/40 focus:border-[#60735A] transition-all resize-y min-h-[160px] leading-relaxed font-sans"
                />
                <p className="text-[11px] text-[#64748B] mt-1.5 flex items-center gap-1">
                  💡 لا تقلق بشأن الصياغة أو الأخطاء؛ خبيرنا سيعيد كتابتها وتنسيقها بمصطلحات قوية ومقنعة للمشغلين.
                </p>
              </div>

              {/* File Attachment Upload Zone */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                  📎 عندك سيرة ذاتية قديمة أو شهادة تحب ترسلها ؟ (اختياري)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#CBD5E1] hover:border-[#60735A] rounded-2xl p-4 bg-[#F8FAFC] hover:bg-[#F4F7F3] cursor-pointer transition-all flex items-center justify-between gap-3 text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] text-[#60735A] flex items-center justify-center shrink-0 shadow-sm">
                      {attachedFileName ? <FileCheck className="w-5 h-5 text-emerald-600" /> : <FileUp className="w-5 h-5" />}
                    </div>
                    <div>
                      {attachedFileName ? (
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-emerald-700 block">
                            ✓ تم إرفاق : {attachedFileName}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            اضغط لتغيير الملف أو أرسله مباشرة على واتساب
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-[#334155] block">
                            اضغط هنا لتحميل ملف السيرة القديمة أو الشهادة
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            الصيغ المقبولة : PDF, Word, JPG, PNG (أقل من 15 MB)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-bold text-[#60735A] bg-white border border-[#60735A]/30 px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    {attachedFileName ? "تغيير" : "استعراض"}
                  </button>
                </div>
              </div>

              {/* LARGE CASE 2: Compétences, Outils & Logiciels */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                  ⚡ المهارات التقنية، البرمجيات واللغات التي تتقنها
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال :&#10;• البرمجيات والأدوات : Excel, Photoshop, CRM, AutoCAD, Python, Canva...&#10;• اللغات : الفرنسية (Courant), الإنجليزية (Intermédiaire)...&#10;• مهارات شخصية : القيادة، التفاوض، العمل الجماعي..."
                  value={formData.skillsText}
                  onChange={(e) => handleInputChange("skillsText", e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/40 focus:border-[#60735A] transition-all resize-y min-h-[90px] leading-relaxed font-sans"
                />
              </div>

              {/* LARGE CASE 3: Remarques & Demandes spéciales */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#334155] mb-1.5">
                  📝 ملاحظات أو رغبات خاصة في التصميم والصياغة (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال : أريد التركيز على العمل عن بعد، تصميم عصري بدون صورة، أو تسليم مستعجل للتقديم لوظيفة محددة..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#60735A]/40 focus:border-[#60735A] transition-all resize-y min-h-[75px] leading-relaxed font-sans"
                />
              </div>
            </div>
          </div>

          {/* ── STEP 4: Payment Method & Submit ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#60735A] shadow-lg">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
              <span className="w-7 h-7 rounded-full bg-[#60735A] text-white text-sm font-bold flex items-center justify-center">
                4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-serif">
                طريقة الدفع وتأكيد الطلب
              </h2>
            </div>

            {/* Payment Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div
                onClick={() => setSelectedPayment("d17")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPayment === "d17"
                    ? "border-[#60735A] bg-[#F4F7F3] shadow-sm"
                    : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-[#0F172A]">📲 D17 البريد التونسي</span>
                  <span className="text-[10px] font-bold bg-[#EBF0E9] text-[#43523e] px-2 py-0.5 rounded-full">
                    الأسهل
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  تحويل فوري إلى رقم الهاتف <strong>92 067 554</strong> عبر تطبيق D17
                </p>
              </div>

              <div
                onClick={() => setSelectedPayment("flouci")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPayment === "flouci"
                    ? "border-[#60735A] bg-[#F4F7F3] shadow-sm"
                    : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-[#0F172A]">💳 Flouci / بطاقة بنكية</span>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    دفع فوري
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  رابط دفع إلكتروني آمن بواسطة البطاقة البنكية أو تطبيق Flouci
                </p>
              </div>

              <div
                onClick={() => setSelectedPayment("virement")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPayment === "virement"
                    ? "border-[#60735A] bg-[#F4F7F3] shadow-sm"
                    : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-[#0F172A]">🏦 تحويل بنكي / بريدي</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  إرسال الـ RIB الخاص بنا للتحويل المباشر عبر حسابك البنكي
                </p>
              </div>
            </div>

            {/* D17 Direct Guidance Box */}
            {selectedPayment === "d17" && (
              <div className="mb-6 p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm leading-relaxed">
                <div className="font-bold mb-2 flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">💡 تعليمات الدفع عبر D17 :</span>
                  <button
                    type="button"
                    onClick={copyD17Number}
                    className="inline-flex items-center gap-1 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرقم : 92067554</span>
                  </button>
                </div>
                <p>
                  1. افتح تطبيق D17 على هاتفك واختر <strong>Transfert d'argent</strong>.<br />
                  2. أدخل رقم الهاتف : <strong className="text-base text-[#B45309]">92 067 554</strong> والمبلغ : <strong>{selectedPack.price} دينار</strong>.<br />
                  3. بعد الإرسال، اضغط على زر <strong>تأكيد وإرسال الطلب</strong> بالأسفل لإرسال تفاصيلك ولقطة الشاشة على الواتساب للبدء فوراً في إعداد سيرتك الذاتية ⚡.
                </p>
              </div>
            )}

            {/* Order Summary & Submit Button */}
            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs text-[#64748B]">المجموع المستحق للدفع :</div>
                <div className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A] flex items-baseline gap-1">
                  <span>{selectedPack.price}</span>
                  <span className="text-sm font-semibold text-[#64748B]">دينار تونسي فقط</span>
                  <span className="text-xs text-[#16A34A] font-semibold mr-2">
                    ({selectedPack.title} — {selectedPack.deliveryTime})
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white text-base font-bold px-8 py-4 rounded-2xl shadow-lg shadow-[#25D366]/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>{isSubmitting ? "جاري التجهيز..." : "تأكيد وإرسال الطلب عبر واتساب"}</span>
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </div>

            {/* Guarantee Note */}
            <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex flex-wrap items-center justify-center gap-4 text-xs text-[#64748B] text-center">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> ضمان استرجاع المبلغ 100% إذا لم تكن راضياً
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#16A34A]" /> رد وتأكيد فوري في أقل من دقيقتين على الواتساب
              </span>
            </div>
          </div>
        </form>

        {/* ── Testimonials Section ── */}
        <section className="mt-16 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A]">
              آراء حرفائنا بعد استلام سيرهم الذاتية الجاهزة ⭐
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              أكثر من 2500 سيرة ذاتية جاهزة تم إعدادها وقبولها في كبرى الشركات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
              <div className="flex items-center gap-1 text-amber-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#334155] leading-relaxed mb-3">
                « طلبت باقة الـ VIP وفي ساعتين بعثولي CV كندي وفرنسي صياغة ممتازة جداً بمصطلحات تقنية قوية. عيطولي لأول إنترفيو بعد 3 أيام ! »
              </p>
              <div className="text-xs font-bold text-[#0F172A]">
                — مهدي العبيدي (Ingénieur Logiciel · تونس)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
              <div className="flex items-center gap-1 text-amber-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#334155] leading-relaxed mb-3">
                « ما كانش عندي فكرة كيفاش نكتب مهامي بالفرنسية، بعثت فوكال وحضروهولي بطريقة منظمة وواضحة برشا. خدمة راقية يعطيهم الصحة. »
              </p>
              <div className="text-xs font-bold text-[#0F172A]">
                — مريم الطرابلسي (Chargée de communication · سوسة)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
              <div className="flex items-center gap-1 text-amber-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#334155] leading-relaxed mb-3">
                « سيرة كندية مطابقة لـ ATS و IRCC للهجرة. التعامل سريع على الواتساب وخلصت بالـ D17 في دقيقة. ننصح بيهم 100%. »
              </p>
              <div className="text-xs font-bold text-[#0F172A]">
                — أنيس الماجري (Comptable · نابل)
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Accordion Section ── */}
        <section className="mt-12 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A]">
              الأسئلة الشائعة حول خدمة الـ CV الجاهز 💬
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              إجابات واضحة ومباشرة لكل استفساراتك
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {[
              {
                q: "كيفاش تخدمولي الـ CV وأنا شنوة يلزمني نعمل ؟",
                a: "ساهل برشا، تعمّر الفورمولير هذا وتبعثلنا معلوماتك (سواء تسجيل صوتي Vocal، تصويرة الـ CV القديم، أو ميساج). وخبيرنا يتكفل بالصياغة الاحترافية، التدقيق اللغوي، ونبعثولك الـ CV متاعك جاهز PDF عالي الدقة في أقل من ساعتين.",
              },
              {
                q: "قداش يقعد وقت باش يحضر الـ CV متاعي ؟",
                a: "بمجرد تأكيد الطلب، يحضر الـ CV في أقل من ساعتين إلى 4 ساعات كأقصى تقدير في نفس اليوم، ونبعثوهولك مباشرة على الواتساب جاهز للتقديم بيه.",
              },
              {
                q: "ما عندي حتى فكرة كيفاش نكتب بالفرنسية، هل تعاونوني ؟",
                a: "أكيد جداً، هذي خدمتنا ! يكفي تحكيلنا بالصوت (Vocal) أو بالميساج شنوة خدمت وقريت، وفريقنا يعاود يصيغ كل المهام بمصطلحات قوية ومقنعة للمشغّلين (Action Verbs) بالمعايير الرسمية.",
              },
              {
                q: "هل الـ CV يتقبل في كندا وفرنسا والخليج ؟",
                a: "نعم 100% ! نماذجنا مطابقة تماماً للمعايير الدولية : النموذج الكندي 1 colonne مطابق لـ IRCC و ATS، النموذج الأوروبي مطابق لـ Europass، والنماذج التنفيذية لتونس والخليج.",
              },
              {
                q: "كان حبيت نعدل فيه بعد ما يحضر، هل التعديل بلاش ؟",
                a: "بالطبيعة ! التعديلات مجانية وغير محدودة حتى تكون راضي 100% على النتيجة النهائية.",
              },
              {
                q: "ما عنديش D17، كيفاش نجم نخلّص ؟",
                a: "تنجم تخلّص عبر تطبيق Flouci، أو تحويل بنكي (Virement)، أو تطلب من أي صديق يصبلك عبر D17 على رقمنا 92067554 وتبعثلنا التوصيل.",
              },
              {
                q: "هل فلوسي ترجعلي كان ما عجبنيش ؟",
                a: "نعم، نضمنولك ضمان استرجاع الأموال 100% تحت 24 ساعة إذا واجهت أي مشكل أو ما كنتش راضي على الخدمة. راحتك وثقتك هي أولويتنا.",
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="group bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 text-right transition-all open:border-[#60735A]"
              >
                <summary className="font-bold text-sm sm:text-base text-[#0F172A] cursor-pointer list-none flex items-center justify-between gap-3">
                  <span>{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-[#64748B] transition-transform group-open:rotate-180 shrink-0" />
                </summary>
                <p className="text-xs sm:text-sm text-[#475569] mt-3 pt-3 border-t border-[#F1F5F9] leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* ── Success Modal ── */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-emerald-100 text-center relative">
            <div className="w-16 h-16 rounded-full bg-[#EBF0E9] text-[#16A34A] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-[#0F172A] font-serif mb-2">
              تم تجهيز طلبك بنجاح !
            </h3>

            <p className="text-sm text-[#475569] mb-6 leading-relaxed">
              لقد قمنا بفتح محادثة الواتساب لنقل بياناتك إلى خبير التوظيف. إذا لم تفتح نافذة الواتساب تلقائياً، يرجى الضغط على الزر أدناه لإرسال الطلب مباشرة :
            </p>

            <div className="space-y-3">
              <a
                href={`https://wa.me/21692067554?text=${encodeURIComponent(generateWhatsAppMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-6 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>فتح المحادثة في واتساب (+216 92 067 554)</span>
              </a>

              <button
                type="button"
                onClick={copyOrderText}
                className="w-full bg-white hover:bg-stone-50 text-[#475569] border border-[#E2E8F0] font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ نص الطلب كرسالة عادية</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="text-xs text-[#94A3B8] hover:text-[#475569] pt-2"
              >
                إغلاق هذه النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
