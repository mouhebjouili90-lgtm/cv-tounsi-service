import { useState, useEffect } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { trackWhatsAppClicked } from "@/lib/analytics";

export function FloatingWhatsApp() {
  const [location] = useLocation();
  const [hasPrompted, setHasPrompted] = useState(false);

  // Automatically show tooltip prompt after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasPrompted(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // On mobile screens, auto-minimize bubble after 9 seconds so it never traps the user
  useEffect(() => {
    if (hasPrompted) {
      const autoDismissTimer = setTimeout(() => {
        // Auto-dismiss on narrow screens
        if (typeof window !== "undefined" && window.innerWidth < 640) {
          setHasPrompted(false);
        }
      }, 9000);
      return () => clearTimeout(autoDismissTimer);
    }
  }, [hasPrompted]);

  // Do not render on Admin Dashboard
  if (location.startsWith("/admin")) {
    return null;
  }

  const handleWhatsAppClick = () => {
    trackWhatsAppClicked("ASSISTANCE", "student", "Visiteur Site");
    const message = encodeURIComponent("سلام، نحب سيرة ذاتية (CV) جاهزة واحترافية 🫒");
    window.open(`https://wa.me/21692067554?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-20 right-3.5 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end pointer-events-auto select-none print:hidden transition-all duration-300">
      {/* Interactive Tooltip Bubble */}
      {hasPrompted && (
        <div
          onClick={handleWhatsAppClick}
          className="mb-2 max-w-[230px] sm:max-w-[290px] bg-white rounded-2xl p-2.5 sm:p-3.5 shadow-2xl border border-emerald-200 relative animate-in fade-in slide-in-from-bottom-3 duration-300 cursor-pointer hover:border-emerald-400 transition-all"
          dir="rtl"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHasPrompted(false);
            }}
            className="absolute top-1.5 left-1.5 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
          
          <div className="flex items-start gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5">
              <Sparkles size={15} />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-stone-900 leading-tight">
                💬 تحب CV حاضر واحترافي ؟
              </p>
              <p className="text-[10px] sm:text-[11px] text-stone-600 mt-1 leading-snug">
                فريقنا يجهّزلك سيرتك الذاتية في دقائق على WhatsApp ⚡
              </p>
              <div className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-[#1b7a43] flex items-center gap-1">
                <span>📲 اطلب الآن من خبير</span> ➔
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleWhatsAppClick}
        aria-label="Contacter le support WhatsApp"
        className="group relative flex items-center justify-center w-12 h-12 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-white focus:outline-none"
        title="Assistance WhatsApp 7j/7 (+216 92 067 554)"
      >
        {/* Pulse ring animation */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-[#25D366] shrink-0" />
        
        {/* Online Status Green Dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        </span>
      </button>
    </div>
  );
}
