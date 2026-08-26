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
 * Ex: "Mohamed Ben Ali" -> "MOHAMED13" (Étudiant) ou "MOHAMED25" (Pro)
 */
export function generateSuggestedCode(fullName: string, plan: "student" | "pro" = "student"): string {
  const words = (fullName || "")
    .trim()
    .split(/\s+/)
    .map((w) => normalizeCodeString(w))
    .filter((w) => w.length > 0);

  const firstName = words[0] || "TN";
  const suffix = plan === "pro" ? "25" : "13";
  return `${firstName}${suffix}`;
}
