import { Link } from "wouter";
import { ArrowLeft, Scale, CheckCircle2, AlertCircle, Phone } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#60735A] hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#60735A]/10 flex items-center justify-center text-[#60735A]">
            <Scale className="w-6 h-6" />
          </div>
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
              L'édition, la prévisualisation et l'essai sont accessibles à tous les utilisateurs. Le déblocage de la version Haute Définition (sans filigrane / flou) avec téléchargement illimité du PDF A4 est soumis à un tarif unique de <strong>19 TND</strong> payable par les moyens indiqués (WhatsApp / Virement / D17 / Flouci).
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
              Pour toute assistance ou demande relative à votre code d'activation ou votre téléchargement, notre service client est joignable 7j/7 au <strong>+216 95 669 209</strong>.
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
