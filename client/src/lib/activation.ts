/**
 * Système de Codes d'Activation Dynamiques et Mémorisables pour CV Tounsi (19 TND)
 *
 * Principes clés :
 * 1. Mémorisable : basé sur le prénom/nom du candidat (ex: SARRA19, MOHAMED19, TRABELSI19)
 * 2. Dynamique : calculé automatiquement et unique à chaque candidat
 * 3. Tolérant : insensible à la casse, aux espaces, aux tirets et aux accents
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
 * Ex: "Sarra Ben Salem" -> "SARRA19"
 */
export function generateSuggestedCode(fullName: string): string {
  const words = (fullName || "")
    .trim()
    .split(/\s+/)
    .map((w) => normalizeCodeString(w))
    .filter((w) => w.length > 0);

  const firstName = words[0] || "TN";
  return `${firstName}19`;
}

/**
 * Vérifie si le code saisi par le client est un code dynamique mémorisable valide
 */
export function validateDynamicActivationCode(inputCode: string, fullName: string): boolean {
  if (!inputCode) return false;

  const cleanInput = normalizeCodeString(inputCode);
  if (cleanInput.length < 3) return false;

  // 1. Codes permanents standards & mémorisables universels
  const standardCodes = [
    "TN19",
    "CV19",
    "TOUNSI19",
    "TOUNSI2026",
    "CVTOUNSI",
    "CVTOUNSI19",
    "PASS19",
    "PRO19",
    "VIP19",
    "PAID19",
    "19TND",
    "95669209",
    "9566920919",
    "ADMINPRO",
  ];

  if (standardCodes.includes(cleanInput)) {
    return true;
  }

  // 2. Codes dynamiques temporels (ex: TN + jour du mois "TN2219", TN + mois "TN0819", "TN2026")
  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, "0");
  const monthStr = String(now.getMonth() + 1).padStart(2, "0");
  const yearStr = String(now.getFullYear());

  const dateCodes = [
    `TN${dayStr}`,
    `TN${dayStr}19`,
    `TN${monthStr}19`,
    `TN${yearStr}`,
    `CV${yearStr}`,
    `CV${monthStr}19`,
  ];

  if (dateCodes.includes(cleanInput)) {
    return true;
  }

  // 3. Codes dynamiques personnalisés basés sur le nom / prénom du candidat
  if (fullName && fullName.trim().length > 0) {
    const rawWords = fullName
      .trim()
      .split(/\s+/)
      .map((w) => normalizeCodeString(w))
      .filter((w) => w.length >= 2);

    for (const word of rawWords) {
      // Ex: SARRA19, SARRA2026, TNSARRA, SARRA, TNSARRA19, SARRA19TND
      const candidateValidVariants = [
        `${word}19`,
        `${word}26`,
        `${word}${yearStr}`,
        `TN${word}`,
        `TN${word}19`,
        `CV${word}`,
        `CV${word}19`,
        `${word}`,
      ];

      if (candidateValidVariants.includes(cleanInput)) {
        return true;
      }
    }

    // Nom complet combiné (ex: SARRA BEN SALEM -> SARRABENSALEM19)
    const fullCombined = rawWords.join("");
    if (
      cleanInput === `${fullCombined}19` ||
      cleanInput === `TN${fullCombined}` ||
      cleanInput === `TN${fullCombined}19` ||
      cleanInput === `${fullCombined}${yearStr}`
    ) {
      return true;
    }
  }

  // 4. Tout code structuré transmis avec préfixe officiel TN- / CV- / PRO- ou suffixe 19
  if (
    cleanInput.startsWith("TN") ||
    cleanInput.startsWith("CV") ||
    cleanInput.startsWith("PRO") ||
    cleanInput.startsWith("VIP") ||
    cleanInput.endsWith("19")
  ) {
    if (cleanInput.length >= 4) {
      return true;
    }
  }

  return false;
}
