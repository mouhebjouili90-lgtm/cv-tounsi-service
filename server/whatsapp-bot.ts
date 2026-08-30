import { callGemini } from "./gemini.js";

/**
 * Mots-clés directs pour identifier immédiatement un message destiné à CV Tounsi
 */
const CV_TOUNSI_KEYWORDS = [
  "cv",
  "tounsi",
  "cvtounsi",
  "pass",
  "d17",
  "12.9",
  "29.9",
  "12.900",
  "29.900",
  "13 dt",
  "30 dt",
  "débloquer",
  "debloquer",
  "activer",
  "modèle",
  "modele",
  "canada",
  "europass",
  "ats",
  "سيرة",
  "تفعيل",
  "اشتراك",
  "سيرة ذاتية",
  "كود",
  "خلاص",
  "بريد",
];

const BOT_SYSTEM_PROMPT = `
Tu es l'assistant commercial officiel et bienveillant de la plateforme "CV Tounsi" (https://cvtounsi.com).
Tu réponds aux candidats tunisiens sur WhatsApp en arabe tunisien poli, chaleureux et professionnel (اللهجة التونسية المهذبة أو العربية الفصحى المبسطة) avec des emojis pertinents.

Voici les règles absolues et informations officielles que tu dois connaître :
1. Présentation : CV Tounsi est la 1ère plateforme intelligente en Tunisie pour créer un CV professionnel certifié (formats Tunisie, Canada ATS, Europe Europass) avec l'IA.
2. Gratuité : La création et la prévisualisation du CV sont 100% gratuites sur https://cvtounsi.com.
3. Tarifs de déblocage HD (PDF A4 300 DPI sans filigrane + IA illimitée + 9 modèles) :
   - 🎓 Pass 1 Mois : 12.900 DT (accès complet 30 jours)
   - 👑 Pass 1 An VIP : 29.900 DT (accès illimité 12 mois)
4. Modalités de paiement en Tunisie :
   - D17 (La Poste Tunisienne) sur le numéro : 92 067 554
   - Flouci ou Virement bancaire sur demande.
5. Procédure d'activation :
   - Dès que le candidat effectue le paiement par D17, il lui suffit d'envoyer la capture d'écran du reçu D17 sur cette même discussion WhatsApp.
   - Son code d'activation certifié lui est envoyé immédiatement dans la minute pour télécharger son CV HD.
6. Style de réponse :
   - Sois court, clair, accueillant et direct (maximum 3 à 5 phrases par message).
   - Termine toujours par une question engageante pour l'aider à finaliser (ex: "تحب نعطيك رقم الـ D17 باش تاخو الكود متاعك توّة؟ 😊").
`;

/**
 * Détermine si le message concerne CV Tounsi (pour protéger les autres activités de l'utilisateur)
 */
export async function isCvTounsiMessage(messageText: string): Promise<boolean> {
  if (!messageText || typeof messageText !== "string") return false;

  const lower = messageText.toLowerCase().trim();

  // 1. Vérification rapide par mots-clés
  const hasKeyword = CV_TOUNSI_KEYWORDS.some((kw) => lower.includes(kw));
  if (hasKeyword) return true;

  // 2. Si ambigu, confirmation via Gemini Flash
  try {
    const classificationPrompt = `
Analyse ce message WhatsApp reçu par une entreprise :
"${messageText}"

Ce message concerne-t-il la rédaction de CV, la recherche d'emploi, un paiement de CV, ou le service CV Tounsi ?
Réponds UNIQUEMENT par le mot "OUI" ou le mot "NON".
`;
    const result = await callGemini({ prompt: classificationPrompt });
    return result.trim().toUpperCase().includes("OUI");
  } catch {
    return false;
  }
}

/**
 * Génère la réponse commerciale automatique en Arabe via Gemini Flash
 */
export async function generateArabicBotReply(incomingMessage: string, senderName?: string): Promise<string> {
  const userPrompt = `
Message reçu du client :
"${incomingMessage}"
${senderName ? `Nom du client : ${senderName}` : ""}

Rédige la réponse parfaite en arabe tunisien (ou arabe professionnel) selon les consignes officielles de CV Tounsi.
`;

  try {
    const reply = await callGemini({
      prompt: userPrompt,
      systemInstruction: BOT_SYSTEM_PROMPT,
    });
    return reply.trim();
  } catch (error) {
    console.error("[WhatsApp Bot] Erreur génération Gemini:", error);
    // Réponse de secours en Arabe
    return `أهلاً وسهلاً بيك في CV Tounsi ! 🇹🇳✨

منصتنا تمكنك من صناعة CV احترافي مطابق للمعايير التونسية، الكندية والأوروبية بالذكاء الاصطناعي على : https://cvtounsi.com

لتحميل الـ CV بجودة عالية HD بدون علامة مائية :
🎓 باقة شهر : 12.900 د.ت
👑 باقة سنة VIP : 29.900 د.ت

الخلاص ساهل عبر D17 على الرقم : 92 067 554
بعد التحويل، ابعثلنا لقطة شاشة للوصل هنا باش نبعثولك كود التفعيل في دقيقة ! 😊`;
  }
}

const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || "710722723763";
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || "d9c991a8253e46289476fd563844a564dace439e516546db82";
const GREEN_API_HOST = process.env.GREEN_API_HOST || "https://7107.api.greenapi.com";

/**
 * Envoie un message WhatsApp via Green-API
 */
export async function sendWhatsAppMessage(toPhoneOrChatId: string, messageText: string): Promise<boolean> {
  const instanceId = process.env.WHATSAPP_INSTANCE_ID || GREEN_API_INSTANCE_ID;
  const token = process.env.WHATSAPP_TOKEN || GREEN_API_TOKEN;

  if (!instanceId || !token) {
    console.log(`[WhatsApp Bot] Simulation d'envoi (API non configurée) à ${toPhoneOrChatId} :\n${messageText}`);
    return true;
  }

  // Format chatId for Green-API (e.g. 21692067554@c.us)
  let chatId = toPhoneOrChatId.trim();
  if (!chatId.includes("@")) {
    const cleanPhone = chatId.replace(/[^0-9]/g, "");
    chatId = `${cleanPhone}@c.us`;
  }

  const hostsToTry = [
    GREEN_API_HOST,
    `https://${instanceId.slice(0, 4)}.api.greenapi.com`,
    "https://api.green-api.com",
    "https://7107.api.greenapi.com",
  ];

  for (const host of hostsToTry) {
    try {
      const url = `${host}/waInstance${instanceId}/sendMessage/${token}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: messageText,
        }),
      });

      if (res.ok) {
        console.log(`[WhatsApp Bot] Message envoyé avec succès à ${chatId} via Green-API (${host})`);
        return true;
      }
    } catch (err) {
      // try next host
    }
  }

  console.warn(`[WhatsApp Bot] Échec d'envoi Green-API à ${chatId}`);
  return false;
}

/**
 * Traite un Webhook entrant WhatsApp (Green-API, UltraMsg, etc.)
 */
export async function processWhatsAppWebhook(payload: any): Promise<{
  handled: boolean;
  replySent?: boolean;
  replyText?: string;
  senderPhone?: string;
  reason?: string;
}> {
  // 1. Extraction du corps du message (Compatible Green-API, UltraMsg, Meta Cloud)
  const messageBody =
    payload?.messageData?.textMessageData?.textMessage ||
    payload?.messageData?.extendedTextMessageData?.text ||
    payload?.data?.body ||
    payload?.body ||
    payload?.message?.text ||
    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
    "";

  // 2. Extraction du contact / expéditeur
  const chatId =
    payload?.senderData?.chatId ||
    payload?.senderData?.sender ||
    payload?.data?.from ||
    payload?.from ||
    payload?.sender ||
    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
    "";

  const senderName =
    payload?.senderData?.senderName ||
    payload?.senderData?.chatName ||
    payload?.data?.pushname ||
    payload?.name ||
    payload?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ||
    "";

  // Ignorer les messages envoyés par le bot lui-même ou les accusés de réception
  if (payload?.typeWebhook && payload?.typeWebhook !== "incomingMessageReceived") {
    return { handled: false, reason: `ignored_event_${payload?.typeWebhook}` };
  }

  if (!messageBody) {
    return { handled: false, reason: "no_message_body" };
  }

  // 1. Filtrage strict pour ne PAS répondre aux messages de vos autres commerces
  const isRelevant = await isCvTounsiMessage(messageBody);
  if (!isRelevant) {
    console.log(`[WhatsApp Bot] Message ignoré (ne concerne pas CV Tounsi) : "${messageBody}"`);
    return { handled: false, reason: "ignored_other_business" };
  }

  // 2. Génération de la réponse IA en Arabe
  const replyText = await generateArabicBotReply(messageBody, senderName);

  // 3. Envoi de la réponse automatique
  let replySent = false;
  const targetRecipient = chatId || senderName;
  if (targetRecipient) {
    replySent = await sendWhatsAppMessage(targetRecipient, replyText);
  }

  return {
    handled: true,
    replySent,
    replyText,
    senderPhone: targetRecipient,
  };
}
