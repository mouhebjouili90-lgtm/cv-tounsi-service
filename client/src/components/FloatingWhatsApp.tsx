import { useState, useEffect } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { trackWhatsAppClicked } from "@/lib/analytics";

export function FloatingWhatsApp() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  // Automatically show tooltip prompt after 4 seconds of browsing
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasPrompted(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Do not render on Admin Dashboard
  if (location.startsWith("/admin")) {
    return null;
  }

  const handleWhatsAppClick = () => {
    trackWhatsAppClicked("ASSISTANCE", "student", "Visiteur Site");
    const message = encodeURIComponent(
      "Bonjour ! Je suis sur le site CV Tounsi et je souhaite avoir des informations / commander un Pass pour mon CV."
    );
    window.open(`https://wa.me/21692067554?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-auto select-none print:hidden">
      {/* Interactive Tooltip Bubble */}
      {hasPrompted && (
        <div className="mb-2.5 max-w-[260px] sm:max-w-[290px] bg-white rounded-2xl p-3.5 shadow-2xl border border-emerald-100 relative animate-in fade-in slide-in-from-bottom-3 duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHasPrompted(false);
            }}
            className="absolute top-2 right-2 text-stone-400 hover:text-stone-600 p-0.5"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
          
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900 leading-tight">
                💬 Besoin d'aide ou paiement ?
              </p>
              <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                Notre conseiller est en ligne sur WhatsApp (+216 92 067 554)
              </p>
              <button
                onClick={handleWhatsAppClick}
                className="mt-2 text-[11px] font-bold text-[#1b7a43] hover:underline flex items-center gap-1"
              >
                <span>Ouvrir la discussion WhatsApp</span> →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleWhatsAppClick}
        aria-label="Contacter le support WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-white focus:outline-none"
        title="Assistance WhatsApp 7j/7 (+216 92 067 554)"
      >
        {/* Pulse ring animation */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 fill-white text-[#25D366] shrink-0" />
        
        {/* Online Status Green Dot */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        </span>
      </button>
    </div>
  );
}
