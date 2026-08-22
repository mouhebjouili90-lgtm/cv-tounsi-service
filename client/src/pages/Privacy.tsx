import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#60735A] hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#60735A]/10 flex items-center justify-center text-[#60735A]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A]">Politique de Confidentialité</h1>
            <p className="text-xs sm:text-sm text-[#64748B]">Dernière mise à jour : 23 Août 2026 — CV Tounsi</p>
          </div>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-[#334155]">
          <section>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#60735A]" /> 1. Données collectées
            </h2>
            <p>
              CV Tounsi collecte uniquement les informations que vous saisissez volontairement dans le formulaire de création de CV (nom, prénom, coordonnées, parcours académique, expériences professionnelles, compétences).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#60735A]" /> 2. Utilisation et Confidentialité
            </h2>
            <p>
              Vos données personnelles servent exclusivement à la génération et au formatage de votre CV et à l'assistance rédactionnelle par intelligence artificielle. Nous ne vendons, ne louons et ne transmettons aucune donnée personnelle à des tiers à des fins publicitaires.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#60735A]" /> 3. Stockage et Sécurité
            </h2>
            <p>
              Vos informations sont traitées dans votre session sécurisée. Les données transmises aux modèles d'intelligence artificielle pour l'amélioration rédactionnelle sont anonymisées et ne sont pas conservées pour l'entraînement des modèles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">4. Vos Droits</h2>
            <p>
              Conformément à la réglementation sur la protection des données personnelles, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour toute demande, contactez notre support via WhatsApp au <strong>+216 95 669 209</strong>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E2E8F0] text-center text-xs text-[#94A3B8]">
          © {new Date().getFullYear()} CV Tounsi. Tous droits réservés.
        </div>
      </div>
    </div>
  );
}
