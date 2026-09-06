/**
 * CV Tounsi — Client Service pour le Scanner de CV & Notation ATS par IA
 */
import type { CvData } from "@/pages/Home";

export interface CvScanFeedback {
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface CvScanResult {
  rating: number;
  atsScore: number;
  feedback: CvScanFeedback;
  extractedCv: Partial<CvData>;
}

const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5 MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

/**
 * Convertit un fichier en chaîne Base64 (Data URI)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Valide le fichier uploadé (taille et format)
 */
export function validateCvFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "الرجاء اختيار ملف السيرة الذاتية." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `حجم الملف (${sizeMb} ميغابايت) يتجاوز الحد المسموح به (4.5 ميغابايت). الرجاء ضغط الملف أو اختيار ملف أصغر.`,
    };
  }

  const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
  const isAllowedExt = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx", ".txt"].includes(fileExt);
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type) || isAllowedExt;

  if (!isAllowedMime) {
    return {
      valid: false,
      error: "صيغة الملف غير مدعومة. الصيغ المقبولة هي: PDF, DOCX, DOC, JPG, PNG.",
    };
  }

  return { valid: true };
}

/**
 * Envoie le fichier au serveur pour scan multimodal, rating ATS et extraction complète
 */
export async function scanAndRateCv(file: File): Promise<CvScanResult> {
  const validation = validateCvFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const base64Data = await fileToBase64(file);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("cv_tounsi_client_token") : null;
    if (token) {
      headers["x-activation-token"] = token;
    }
  } catch {
    // ignore
  }

  const response = await fetch("/api/ai/parse-and-rate-cv", {
    method: "POST",
    headers,
    body: JSON.stringify({
      fileBase64: base64Data,
      mimeType: file.type || "application/pdf",
      fileName: file.name,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "تم بلوغ الحد الأقصى من الفحص المجاني بالساعة. حاول مجدداً لاحقاً.");
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `خطأ أثناء فحص السيرة الذاتية (${response.status})`);
  }

  const result: CvScanResult = await response.json();

  if (!result || typeof result.rating !== "number" || !result.extractedCv) {
    throw new Error("لم يتمكن الذكاء الاصطناعي من قراءة بيانات السيرة الذاتية بشكل صحيح.");
  }

  return result;
}
