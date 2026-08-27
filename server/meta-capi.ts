/**
 * CV Tounsi — Meta Conversions API (CAPI) Server-Side Tracking
 * 
 * Complète le Pixel Meta côté serveur pour contourner les bloqueurs de pub (AdBlock),
 * les restrictions iOS 14.5+ et les pannes réseau.
 * 
 * Spécification : Meta Graph API v22.0
 * Pixel ID : 1409240591423153
 */

import crypto from "node:crypto";
import type { Request } from "express";

export const META_PIXEL_ID = process.env.META_PIXEL_ID || "1409240591423153";
export const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || "";
export const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "";

export interface CAPIUserData {
  em?: string[]; // Email hashé SHA256 (lowercase, sans espaces)
  ph?: string[]; // Téléphone hashé SHA256 (format E.164 sans espaces)
  fn?: string[]; // Prénom hashé SHA256
  ln?: string[]; // Nom hashé SHA256
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook Click ID (cookie _fbc ou paramètre fbclid)
  fbp?: string; // Facebook Browser ID (cookie _fbp)
  country?: string[]; // Code pays 'tn' hashé SHA256
}

export interface CAPICustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
  order_id?: string;
  status?: string;
}

export interface CAPIEvent {
  event_name:
    | "Purchase"
    | "InitiateCheckout"
    | "Lead"
    | "CompleteRegistration"
    | "Contact"
    | "ViewContent"
    | "CustomizeProduct"
    | "PageView";
  event_time: number; // Unix timestamp en secondes
  event_id: string; // ID unique partagé avec le browser Pixel pour la déduplication
  event_source_url: string;
  action_source: "website";
  user_data: CAPIUserData;
  custom_data?: CAPICustomData;
}

/* ── Hash string helper for Meta compliance (SHA-256 lowercase) ── */
export function hashForCAPI(value?: string | null): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash("sha256").update(clean).digest("hex");
}

/* ── Extract Client IP securely (handles proxies, Cloudflare, Vercel) ── */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string" && cfIp) return cfIp;

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp) return realIp;

  return req.socket.remoteAddress || "127.0.0.1";
}

/* ── Extract cookie by name from Cookie header ── */
export function getCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const matches = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

/* ── Extract and hash user details from request ── */
export function buildUserData(
  req: Request,
  overrides?: {
    email?: string | null;
    fullName?: string | null;
    phone?: string | null;
    fbp?: string | null;
    fbc?: string | null;
  }
): CAPIUserData {
  const cookieHeader = req.headers.cookie;
  const fbp = overrides?.fbp || getCookieValue(cookieHeader, "_fbp");
  const fbc = overrides?.fbc || getCookieValue(cookieHeader, "_fbc");

  const userData: CAPIUserData = {
    client_ip_address: getClientIp(req),
    client_user_agent: (req.headers["user-agent"] as string) || "",
    country: [hashForCAPI("tn")!],
  };

  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  // Email
  if (overrides?.email) {
    const hashedEmail = hashForCAPI(overrides.email);
    if (hashedEmail) userData.em = [hashedEmail];
  }

  // Full Name split into fn and ln
  if (overrides?.fullName) {
    const parts = overrides.fullName.trim().split(/\s+/);
    if (parts.length > 0 && parts[0]) {
      const fnHashed = hashForCAPI(parts[0]);
      if (fnHashed) userData.fn = [fnHashed];
    }
    if (parts.length > 1) {
      const lnHashed = hashForCAPI(parts.slice(1).join(" "));
      if (lnHashed) userData.ln = [lnHashed];
    }
  }

  // Phone number (clean up non-digits, ensure country code)
  if (overrides?.phone) {
    let cleanPhone = overrides.phone.replace(/[^0-9+]/g, "");
    if (!cleanPhone.startsWith("+") && !cleanPhone.startsWith("216") && cleanPhone.length === 8) {
      cleanPhone = `216${cleanPhone}`;
    }
    cleanPhone = cleanPhone.replace("+", "");
    const hashedPhone = hashForCAPI(cleanPhone);
    if (hashedPhone) userData.ph = [hashedPhone];
  }

  return userData;
}

/* ── Core function: Send event to Meta Graph API ── */
export async function sendCAPIEvent(
  event: CAPIEvent,
  testEventCode?: string
): Promise<{ success: boolean; data?: any; error?: any }> {
  const token = META_CAPI_TOKEN;
  const pixelId = META_PIXEL_ID;

  if (!token) {
    console.log("[Meta CAPI] ⚠️ META_CAPI_TOKEN non configuré. Événement ignoré :", event.event_name);
    return { success: false, error: "META_CAPI_TOKEN not configured" };
  }

  const payload: any = {
    data: [event],
  };

  const activeTestCode = testEventCode || META_TEST_EVENT_CODE;
  if (activeTestCode) {
    payload.test_event_code = activeTestCode;
  }

  try {
    const url = `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Meta CAPI] ❌ Erreur API Meta:", responseData);
      return { success: false, error: responseData };
    }

    console.log(`[Meta CAPI] ✅ Événement '${event.event_name}' transmis avec succès (ID: ${event.event_id}, Events Received: ${responseData.events_received})`);
    return { success: true, data: responseData };
  } catch (error: any) {
    console.error("[Meta CAPI] ❌ Erreur réseau lors de l'envoi :", error?.message || error);
    return { success: false, error: error?.message || error };
  }
}

/* ── Specialized Event Dispatchers ── */

/**
 * Purchase: Envoyé lors de l'activation d'un code (déblocage payant)
 */
export async function sendCAPIPurchase(
  req: Request,
  options: {
    eventId: string;
    amount: number;
    plan: "student" | "pro";
    fullName?: string;
    email?: string;
    phone?: string;
    testEventCode?: string;
  }
) {
  const event: CAPIEvent = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: options.eventId,
    event_source_url: (req.headers.referer as string) || "https://cvtounsi.com",
    action_source: "website",
    user_data: buildUserData(req, {
      email: options.email,
      fullName: options.fullName,
      phone: options.phone,
    }),
    custom_data: {
      value: options.amount,
      currency: "TND",
      content_name: options.plan === "student" ? "Pass Étudiant / Urgence (12.9 DT)" : "Pass Pro / Exécutif (24.9 DT)",
      content_category: "CV Monetization",
      content_ids: [options.plan],
      content_type: "product",
      num_items: 1,
    },
  };

  return sendCAPIEvent(event, options.testEventCode);
}

/**
 * InitiateCheckout: Envoyé lorsque l'utilisateur ouvre le paywall ou clique sur commander
 */
export async function sendCAPIInitiateCheckout(
  req: Request,
  options: {
    eventId: string;
    amount?: number;
    plan?: string;
    fullName?: string;
    email?: string;
    testEventCode?: string;
  }
) {
  const event: CAPIEvent = {
    event_name: "InitiateCheckout",
    event_time: Math.floor(Date.now() / 1000),
    event_id: options.eventId,
    event_source_url: (req.headers.referer as string) || "https://cvtounsi.com",
    action_source: "website",
    user_data: buildUserData(req, {
      email: options.email,
      fullName: options.fullName,
    }),
    custom_data: {
      value: options.amount || 12.9,
      currency: "TND",
      content_name: "Paywall Opened",
      content_category: options.plan || "CV Unlock",
      num_items: 1,
    },
  };

  return sendCAPIEvent(event, options.testEventCode);
}

/**
 * Contact: Envoyé lors d'un clic sur le bouton WhatsApp pour commander un code
 */
export async function sendCAPIContact(
  req: Request,
  options: {
    eventId: string;
    suggestedCode?: string;
    fullName?: string;
    plan?: string;
    testEventCode?: string;
  }
) {
  const event: CAPIEvent = {
    event_name: "Contact",
    event_time: Math.floor(Date.now() / 1000),
    event_id: options.eventId,
    event_source_url: (req.headers.referer as string) || "https://cvtounsi.com",
    action_source: "website",
    user_data: buildUserData(req, {
      fullName: options.fullName,
    }),
    custom_data: {
      content_name: `WhatsApp Payment (${options.suggestedCode || "Direct"})`,
      content_category: options.plan || "payment_inquiry",
    },
  };

  return sendCAPIEvent(event, options.testEventCode);
}

/**
 * CompleteRegistration: Envoyé lors de la création d'un compte
 */
export async function sendCAPICompleteRegistration(
  req: Request,
  options: {
    eventId: string;
    email: string;
    name?: string;
    method?: string;
    testEventCode?: string;
  }
) {
  const event: CAPIEvent = {
    event_name: "CompleteRegistration",
    event_time: Math.floor(Date.now() / 1000),
    event_id: options.eventId,
    event_source_url: (req.headers.referer as string) || "https://cvtounsi.com",
    action_source: "website",
    user_data: buildUserData(req, {
      email: options.email,
      fullName: options.name,
    }),
    custom_data: {
      status: "completed",
      content_name: `Registration (${options.method || "email"})`,
    },
  };

  return sendCAPIEvent(event, options.testEventCode);
}
