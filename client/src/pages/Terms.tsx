import { Link } from "wouter";
import { ArrowLeft, Scale, CheckCircle2, AlertCircle, Phone } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 sm:p-10">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E2E8F0]">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#60735A] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/icon.jpg" alt="CV Tounsi" className="w-7 h-7 rounded-lg object-cover border border-[#60735A]/20 transition-transform group-hover:scale-105" />
            <span className="font-serif font-bold text-sm text-[#0F172A]">CV <span className="text-[#60735A]">Tounsi</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-3.5 mb-6">
          <img src="/icon.jpg" alt="CV Tounsi Logo" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#0F172A]">Conditions Générales d'Utilisation</h1>
            <p className="text-xs sm:text-sm text-[#64748B]">Dernière mise à jour : 23 Août 2026 — CV Tounsi</p>
          </div>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-[#334155]">
          <section>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#60735A]" /> 1. Objet du Service
            </h2>
            <p>
              CV Tounsi est une plateforme numérique d'assistance à la création, à la mise en page et à l'optimisation par IA de Curriculum Vitae adaptés aux normes tunisiennes, canadiennes et européennes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#60735A]" /> 2. Modalités d'Accès et Tarifs
            </h2>
            <p>
              L'édition, la prévisualisation et l'essai sont accessibles à tous les utilisateurs. Le déblocage de la version Haute Définition (sans filigrane / flou) avec téléchargement illimité du PDF A4 et accès à l'ensemble des 9 modèles et de l'IA est proposé à <strong>12.900 TND (Pass 1 Mois)</strong> ou <strong>29.900 TND (Pass 1 An)</strong> payable par les moyens indiqués (D17 / Flouci / Virement / WhatsApp).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#60735A]" /> 3. Responsabilité de l'Utilisateur
            </h2>
            <p>
              L'utilisateur garantit l'exactitude des informations professionnelles et personnelles fournies dans son CV. CV Tounsi fournit des suggestions d'amélioration assistées par intelligence artificielle, mais la responsabilité finale du contenu incombe au candidat.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#60735A]" /> 4. Service Client & Réclamations
            </h2>
            <p>
              Pour toute assistance ou demande relative à votre code d'activation ou votre téléchargement, notre service client est joignable 7j/7 au <strong>+216 92 067 554</strong>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <img src="/icon.jpg" alt="CV Tounsi" className="w-5 h-5 rounded-md object-cover border border-[#60735A]/20" />
            <span className="font-serif font-bold text-stone-700">CV <span className="text-[#60735A]">Tounsi</span></span>
          </div>
          <span>© {new Date().getFullYear()} CV Tounsi. Tous droits réservés.</span>
        </div>
      </div>
    </div>
  );
}
