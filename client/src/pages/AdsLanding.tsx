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
import { trackEvent } from "@/lib/analytics";

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
    setLocation("/");
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased selection:bg-[#60735A] selection:text-white pb-20 sm:pb-12">
      {/* ── Top Alert Banner ── */}
      <div className="bg-[#60735A] text-white py-2 px-4 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm">
        <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Offre Spéciale 2026
        </span>
        <span>Créez votre CV conforme aux normes Tunisie, Canada & Europe <strong>dès 12.900 TND</strong></span>
      </div>

      {/* ── Navigation Header (Minimaliste sans fuite de trafic) ── */}
      <header className="border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#60735A] text-white flex items-center justify-center font-bold font-serif text-lg">
              C
            </span>
            <span className="text-xl font-bold font-serif text-[#0F172A]">
              CV <span className="text-[#60735A]">Tounsi</span>
            </span>
          </div>

          <button
            onClick={() => handleStartNow("header_btn")}
            className="inline-flex items-center gap-2 bg-[#60735A] hover:bg-[#4d5c48] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl shadow-sm transition-all transform active:scale-95"
          >
            <span>Créer mon CV</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="pt-8 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBF0E9] text-[#43523e] text-xs sm:text-sm font-semibold mb-6 border border-[#60735A]/20 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#60735A]" />
          <span>N°1 de la création de CV assistée par l'IA en Tunisie</span>
        </div>

        <h1
          className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif text-[#0F172A] leading-[1.22] tracking-tight max-w-3xl mx-auto mb-6 text-center"
          style={{ textWrap: "balance" }}
        >
          Décrochez plus d'entretiens avec un CV{" "}
          <span className="text-[#60735A] font-serif">
            professionnel et percutant
          </span>
        </h1>

        <p
          className="text-base sm:text-lg lg:text-xl text-[#475569] max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed text-center"
          style={{ textWrap: "balance" }}
        >
          Générez un CV conforme aux formats <strong>Tunisiens</strong>, <strong>Canadiens (IRCC)</strong> et <strong>Européens (Europass)</strong>. L'intelligence artificielle sublime vos phrases en 1 clic.
        </p>

        {/* Hero CTA Box */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto mb-8">
          <button
            onClick={() => handleStartNow("hero_primary")}
            className="w-full bg-[#60735A] hover:bg-[#4d5c48] text-white text-base sm:text-lg font-bold px-8 py-4 rounded-2xl shadow-lg shadow-[#60735A]/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Créer mon CV maintenant</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Trust Points */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-[#64748B] max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#60735A]" />
            <span>Essai & Aperçu 100% gratuit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#60735A]" />
            <span>Téléchargement PDF A4 net</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#60735A]" />
            <span>Dès 12.900 TND sans abonnement</span>
          </div>
        </div>

        {/* Social Proof Stars */}
        <div className="mt-8 pt-6 border-t border-[#E2E8F0] w-full max-w-xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm text-[#475569]">
          <div className="flex text-[#D97706]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span><strong>4.9 / 5</strong> basé sur plus de 2 500 CVs créés en Tunisie</span>
        </div>
      </section>

      {/* ── Avant vs Après (Comparatif Visuel Percutant) ── */}
      <section className="py-12 sm:py-16 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#60735A] bg-[#60735A]/10 px-3 py-1 rounded-full">
              Pourquoi changer de méthode ?
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#0F172A] mt-3">
              Votre CV actuel vous fait-il perdre des opportunités ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Ancien CV */}
            <div className="rounded-2xl p-6 sm:p-8 bg-[#FEF2F2] border border-[#FECACA]/60">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EF4444] text-white">
                  ❌ CV Classique (Word / Canva)
                </span>
              </div>
              <ul className="space-y-3.5 text-sm text-[#7F1D1D]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#EF4444] font-bold">✕</span>
                  <span>Mise en page décalée à l'exportation ou à l'impression.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#EF4444] font-bold">✕</span>
                  <span>Phrases basiques sans verbes d'action ni chiffres concrets.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#EF4444] font-bold">✕</span>
                  <span>Rejeté par les logiciels de recrutement automatique (ATS).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#EF4444] font-bold">✕</span>
                  <span>Non adapté aux normes spécifiques (Canada / Union Européenne).</span>
                </li>
              </ul>
            </div>

            {/* CV Tounsi */}
            <div className="rounded-2xl p-6 sm:p-8 bg-[#F0FDF4] border-2 border-[#60735A]/40 shadow-sm relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#60735A] text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> CV Tounsi Optimisé
                </span>
                <span className="text-xs font-bold text-[#60735A]">100% Recommandé</span>
              </div>
              <ul className="space-y-3.5 text-sm text-[#14532D]">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 font-bold" />
                  <span><strong>Design A4 millimétré :</strong> Présentation irréprochable et aérée.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 font-bold" />
                  <span><strong>Assistance IA :</strong> Valorise vos missions en réalisations percutantes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 font-bold" />
                  <span><strong>3 Modèles certifiés :</strong> Tunisie, Format Canadien & Europass.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5 font-bold" />
                  <span><strong>Profils Dédiés :</strong> Mode Spécial Étudiants (PFE/Stages) & Professionnels.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Formats Stratégiques ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#0F172A]">
            Choisissez le format adapté à votre objectif
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-2">
            Tous les modèles sont inclus sans supplément dans votre accès
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#EBF0E9] text-[#60735A] flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">CV Professionnel Tunisien</h3>
            <p className="text-xs text-[#60735A] font-semibold mb-3">Idéal pour les entreprises en Tunisie & Multinationales</p>
            <p className="text-sm text-[#475569] leading-relaxed">
              Mise en page classique, élégante et percutante. Met en avant vos compétences clés et votre parcours.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#D97706]/40 shadow-sm hover:shadow-md transition-all relative">
            <span className="absolute -top-3 right-4 bg-[#D97706] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Très Demandé
            </span>
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">Format Canadien (IRCC)</h3>
            <p className="text-xs text-[#D97706] font-semibold mb-3">Immigration, Permis de Travail & Entrée Express</p>
            <p className="text-sm text-[#475569] leading-relaxed">
              Strictement conforme aux critères canadiens (sans photo, sans âge, centré sur les compétences mesurables).
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">Format Europass (UE)</h3>
            <p className="text-xs text-[#4F46E5] font-semibold mb-3">France, Allemagne, Italie, Belgique</p>
            <p className="text-sm text-[#475569] leading-relaxed">
              Standard européen reconnu par les universités et employeurs de l'Union Européenne.
            </p>
          </div>
        </div>
      </section>

      {/* ── Témoignages Clients ── */}
      <section className="py-12 sm:py-16 bg-[#F4EFE6] border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A]">
              Ce que disent nos utilisateurs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
              <div className="flex text-[#D97706] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#334155] italic mb-4 leading-relaxed">
                « J'ai postulé à plus de 15 offres sans aucune réponse. Après avoir refait mon CV sur CV Tounsi avec l'IA, j'ai décroché 3 entretiens la même semaine ! »
              </p>
              <div className="text-xs">
                <strong className="text-[#0F172A] block">Amine K.</strong>
                <span className="text-[#64748B]">Ingénieur Logiciel — Tunis</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
              <div className="flex text-[#D97706] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#334155] italic mb-4 leading-relaxed">
                « Le mode étudiant est une pépite pour trouver son PFE. L'IA m'a aidée à décrire mes projets universitaires comme de vraies réalisations pro. »
              </p>
              <div className="text-xs">
                <strong className="text-[#0F172A] block">Sarra M.</strong>
                <span className="text-[#64748B]">Étudiante en Finance — Sfax</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
              <div className="flex text-[#D97706] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#334155] italic mb-4 leading-relaxed">
                « Le modèle Canadien sans photo m'a fait gagner un temps précieux pour mon dossier d'immigration. Débloqué en 2 minutes sur WhatsApp. »
              </p>
              <div className="text-xs">
                <strong className="text-[#0F172A] block">Youssef B.</strong>
                <span className="text-[#64748B]">Candidat Entrée Express Canada</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tarification Claire & Garantie ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-xl mx-auto text-center">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#60735A] shadow-xl shadow-[#60735A]/10">
          <span className="bg-[#60735A]/10 text-[#60735A] font-bold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider">
            Accès Complet Illimité
          </span>

          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#0F172A] mt-4 mb-2">
            Dès 12.900 TND <span className="text-sm font-sans font-normal text-[#64748B]">(Pass Étudiant)</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#16A34A] font-semibold mb-6">
            Paiement unique · Aucun abonnement caché · Assistance 7j/7
          </p>

          <ul className="space-y-3 text-sm text-[#334155] text-left max-w-sm mx-auto mb-8">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Accès aux 3 modèles (Tunisie, Canada, Europass)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Amélioration rédactionnelle par l'IA illimitée</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Export PDF A4 Haute Définition sans filigrane</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Paiement facile : D17, Virement, Flouci ou WhatsApp</span>
            </li>
          </ul>

          <button
            onClick={() => handleStartNow("pricing_box")}
            className="w-full bg-[#60735A] hover:bg-[#4d5c48] text-white text-base sm:text-lg font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Créer mon CV Maintenant</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A] text-center mb-8">
          Questions Fréquentes
        </h2>

        <div className="space-y-3">
          {[
            {
              q: "Puis-je essayer et prévisualiser mon CV gratuitement ?",
              a: "Oui, à 100% ! Vous pouvez remplir toutes vos informations, tester l'amélioration par IA et visualiser le rendu de votre CV en temps réel sans débourser un millime.",
            },
            {
              q: "Comment fonctionne le déblocage du PDF net ?",
              a: "Pour exporter votre PDF A4 Haute Définition sans flou, vous choisissez votre formule (Pass Étudiant 12.9 DT ou Pass Pro 24.9 DT). Vous recevez votre code en 1 clic via WhatsApp (+216 92 067 554) ou par D17 / Flouci.",
            },
            {
              q: "Mon CV est-il adapté pour postuler au Canada ou en France ?",
              a: "Absolument. CV Tounsi intègre le format officiel canadien (IRCC sans photo pour respecter les lois anti-discrimination) et le format européen Europass.",
            },
            {
              q: "Je n'ai pas encore d'expérience (Étudiant / PFE), est-ce adapté ?",
              a: "Oui ! Le mode Étudiant adapte la structure du CV pour mettre en valeur vos formations, certifications, projets académiques et compétences pratiques.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 text-left font-semibold text-sm sm:text-base flex items-center justify-between text-[#0F172A]"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] transition-transform ${
                    openFaq === idx ? "rotate-180 text-[#60735A]" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 px-4 text-center text-xs text-[#64748B]">
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

      {/* ── Sticky Mobile Bottom CTA Bar (Indispensable pour le trafic mobile Meta Ads) ── */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] sm:hidden z-50 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-[#64748B] block">Tarif</span>
          <strong className="text-base text-[#0F172A] font-bold">Dès 12.9 DT</strong>
        </div>
        <button
          onClick={() => handleStartNow("sticky_mobile_cta")}
          className="flex-1 bg-[#60735A] hover:bg-[#4d5c48] text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <span>Créer mon CV</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
