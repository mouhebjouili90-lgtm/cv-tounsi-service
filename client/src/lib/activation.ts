/**
 * Helpers d'affichage et de suggestion pour CV Tounsi (Côté Client)
 * 
 * Note de Sécurité SaaS :
 * Aucune logique de validation ni liste de codes n'est présente côté client.
 * Toute validation de code s'effectue exclusivement et strictement sur le serveur via POST /api/validate-code.
 */

/**
 * Nettoie une chaîne en retirant accents, caractères spéciaux et espaces
 */
export function normalizeCodeString(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""); // Garde uniquement lettres et chiffres
}

/**
 * Génère le code mémorisable recommandé pour un candidat
 * Ex: "Mohamed Ben Ali" -> "MOHAMED13" (1 Mois - 12.9 DT) ou "MOHAMED30" (1 An - 29.9 DT)
 */
export function generateSuggestedCode(fullName: string, plan: "month" | "year" | "student" | "pro" = "month"): string {
  const words = (fullName || "")
    .trim()
    .split(/\s+/)
    .map((w) => normalizeCodeString(w))
    .filter((w) => w.length > 0);

  const firstName = words[0] || "TN";
  const isYear = plan === "year" || plan === "pro";
  const suffix = isYear ? "30" : "13";
  return `${firstName}${suffix}`;
}

export interface SubscriptionInfo {
  isUnlocked: boolean;
  plan: "month" | "year";
  daysRemaining: number;
  expiresAtFormatted: string;
  isExpired: boolean;
  badgeLabel: string;
  fullDetails: string;
}

/**
 * Calcule les jours restants et la date exacte d'expiration de l'abonnement
 */
export function getSubscriptionStatus(
  isUnlocked: boolean,
  plan: "month" | "year" | "student" | "pro" = "month",
  storedTimestamp?: number | null
): SubscriptionInfo {
  const normalizedPlan: "month" | "year" = plan === "year" || plan === "pro" ? "year" : "month";

  if (!isUnlocked) {
    return {
      isUnlocked: false,
      plan: normalizedPlan,
      daysRemaining: 0,
      expiresAtFormatted: "",
      isExpired: true,
      badgeLabel: "Version Démo",
      fullDetails: "Version d'essai (HD verrouillée)",
    };
  }

  const durationDays = normalizedPlan === "year" ? 365 : 30;
  let activationTime = storedTimestamp;

  if (!activationTime && typeof window !== "undefined") {
    const savedTime = localStorage.getItem("cv_tounsi_activation_date");
    if (savedTime) {
      activationTime = Number(savedTime);
    } else {
      const token = localStorage.getItem("cv_tounsi_client_token");
      if (token) {
        try {
          const payloadStr = token.split(".")[0];
          if (payloadStr) {
            const payload = JSON.parse(atob(payloadStr.replace(/-/g, "+").replace(/_/g, "/")));
            if (payload.timestamp) {
              activationTime = Number(payload.timestamp);
              localStorage.setItem("cv_tounsi_activation_date", String(activationTime));
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  if (!activationTime || isNaN(activationTime)) {
    activationTime = Date.now();
    if (typeof window !== "undefined") {
      localStorage.setItem("cv_tounsi_activation_date", String(activationTime));
    }
  }

  const expiresAtMs = activationTime + durationDays * 24 * 60 * 60 * 1000;
  const remainingMs = expiresAtMs - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  const isExpired = remainingMs <= 0;

  const expiresAtFormatted = new Date(expiresAtMs).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const badgeLabel = normalizedPlan === "year"
    ? `👑 Pass 1 An (${daysRemaining}j restants)`
    : `⭐ Pass 1 Mois (${daysRemaining}j restants)`;

  const fullDetails = `Valide jusqu'au ${expiresAtFormatted} (${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${daysRemaining > 1 ? "s" : ""})`;

  return {
    isUnlocked,
    plan: normalizedPlan,
    daysRemaining,
    expiresAtFormatted,
    isExpired,
    badgeLabel,
    fullDetails,
  };
}
