/**
 * CV Tounsi — Analytics Helpers (Meta Pixel + Meta CAPI + Google Analytics 4)
 * 
 * Centralized tracking with automatic event deduplication (event_id)
 * between client-side Meta Pixel and server-side Meta Conversions API (CAPI).
 */

/* ── Types ── */
export interface EventParams {
  [key: string]: any;
}

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/* ── Helper: Extract cookie from browser ── */
export function getBrowserCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/* ── Generate unique event ID for Pixel/CAPI deduplication ── */
export function generateEventId(prefix = "ev"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ── Dispatch server-side CAPI event via backend proxy ── */
export async function sendServerCAPI(
  eventName: string,
  customData?: EventParams,
  userData?: { email?: string; fullName?: string; phone?: string },
  eventId?: string
): Promise<string> {
  const finalEventId = eventId || generateEventId(eventName.toLowerCase());
  try {
    const fbp = getBrowserCookie("_fbp");
    const fbc = getBrowserCookie("_fbc");

    fetch("/api/track-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId: finalEventId,
        customData,
        userData: {
          ...userData,
          fbp,
          fbc,
        },
      }),
    }).catch(() => {});
  } catch {
    // Silent fail
  }
  return finalEventId;
}

/* ── Meta Pixel Events (with optional eventID for deduplication) ── */
function trackFbEvent(eventName: string, params?: EventParams, eventId?: string) {
  try {
    if (typeof window !== "undefined" && window.fbq) {
      if (eventId) {
        window.fbq("track", eventName, params || {}, { eventID: eventId });
      } else if (params) {
        window.fbq("track", eventName, params);
      } else {
        window.fbq("track", eventName);
      }
    }
  } catch {
    // Silent fail
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
  const eventId = generateEventId("init_checkout");
  trackEvent("BuilderStarted", {
    template,
    language,
    value: 12.9,
    currency: "TND",
  });
  trackFbEvent(
    "InitiateCheckout",
    { content_name: "CV Builder", content_category: template, value: 12.9, currency: "TND" },
    eventId
  );
  sendServerCAPI("InitiateCheckout", { content_name: "CV Builder", content_category: template, value: 12.9, currency: "TND" }, undefined, eventId);
}

/** User clicked the WhatsApp payment link */
export function trackWhatsAppClicked(suggestedCode: string, plan: "student" | "pro" = "student", fullName?: string) {
  const eventId = generateEventId("whatsapp_click");
  const amount = plan === "pro" ? 29.9 : 12.9;
  trackEvent("WhatsAppClicked", {
    suggested_code: suggestedCode,
    plan,
    value: amount,
    currency: "TND",
  });
  trackFbEvent("Contact", { content_name: `WhatsApp Payment (${suggestedCode})`, content_category: plan, value: amount, currency: "TND" }, eventId);
  sendServerCAPI(
    "Contact",
    { content_name: `WhatsApp Payment (${suggestedCode})`, content_category: plan, value: amount, currency: "TND" },
    { fullName },
    eventId
  );
}

/** User successfully activated their code (Purchase event) */
export function trackCodeActivated(options: {
  method?: string;
  plan?: "month" | "year" | "student" | "pro";
  amount?: number;
  eventId?: string;
  fullName?: string;
  email?: string;
}) {
  const isMonth = options.plan === "month" || options.plan === "student";
  const plan = isMonth ? "month" : "year";
  const amount = options.amount || (isMonth ? 12.9 : 29.9);
  const eventId = options.eventId || generateEventId("purchase");
  const contentName = isMonth ? "Pass 1 Mois (12.9 DT)" : "Pass 1 An (29.9 DT)";

  trackEvent("CodeActivated", { method: options.method || "code", plan, amount });

  // Browser Pixel Purchase (with eventID matching CAPI)
  trackFbEvent(
    "Purchase",
    {
      value: amount,
      currency: "TND",
      content_name: contentName,
      content_ids: [plan],
      content_type: "product",
      num_items: 1,
    },
    eventId
  );

  // Google Analytics Purchase
  trackGaEvent("purchase", {
    value: amount,
    currency: "TND",
    transaction_id: eventId,
    items: [{ item_name: contentName, item_id: plan, price: amount, quantity: 1 }],
  });
}

/** User downloaded the PDF */
export function trackPDFDownloaded(template: string, isUnlocked: boolean) {
  const eventId = generateEventId("pdf_download");
  trackEvent("PDFDownloaded", { template, is_unlocked: isUnlocked });
  if (isUnlocked) {
    trackFbEvent("Lead", { content_name: "PDF HD Download", content_category: template }, eventId);
    sendServerCAPI("Lead", { content_name: "PDF HD Download", content_category: template }, undefined, eventId);
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

