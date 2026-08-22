/**
 * CV Tounsi — Analytics Helpers (Meta Pixel + Google Analytics 4)
 * 
 * Centralized tracking functions for conversion events.
 * IDs are configured in index.html snippets.
 */

/* ── Types ── */
interface EventParams {
  [key: string]: string | number | boolean;
}

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/* ── Meta Pixel Events ── */
function trackFbEvent(eventName: string, params?: EventParams) {
  try {
    if (typeof window !== "undefined" && window.fbq) {
      if (params) {
        window.fbq("track", eventName, params);
      } else {
        window.fbq("track", eventName);
      }
    }
  } catch {
    // Silent fail — analytics should never break the app
  }
}

/* ── Google Analytics 4 Events ── */
function trackGaEvent(eventName: string, params?: EventParams) {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, params || {});
    }
  } catch {
    // Silent fail
  }
}

/* ── Unified Track Event (fires both Meta + GA4) ── */
export function trackEvent(eventName: string, params?: EventParams) {
  trackFbEvent(eventName, params);
  trackGaEvent(eventName, params);
}

/* ── Pre-defined Conversion Events ── */

/** User started creating a CV (entered the builder) */
export function trackBuilderStarted(template: string, language: string) {
  trackEvent("BuilderStarted", { template, language });
  trackFbEvent("InitiateCheckout", { content_name: "CV Builder", content_category: template });
}

/** User clicked the WhatsApp payment link */
export function trackWhatsAppClicked(suggestedCode: string) {
  trackEvent("WhatsAppClicked", { suggested_code: suggestedCode });
  trackFbEvent("Contact", { content_name: "WhatsApp Payment" });
}

/** User successfully activated their code */
export function trackCodeActivated(method: string) {
  trackEvent("CodeActivated", { method });
  trackFbEvent("Purchase", { value: 19, currency: "TND", content_name: "CV Unlock" });
  trackGaEvent("purchase", { value: 19, currency: "TND", transaction_id: `cv_${Date.now()}` });
}

/** User downloaded the PDF */
export function trackPDFDownloaded(template: string, isUnlocked: boolean) {
  trackEvent("PDFDownloaded", { template, is_unlocked: isUnlocked });
  if (isUnlocked) {
    trackFbEvent("Lead", { content_name: "PDF HD Download" });
  }
}

/** User used the AI improvement feature */
export function trackAIUsed(step: string) {
  trackEvent("AIImproveUsed", { step });
}

/** Page view tracking */
export function trackPageView(pageName: string) {
  trackGaEvent("page_view", { page_title: pageName });
  trackFbEvent("PageView");
}
