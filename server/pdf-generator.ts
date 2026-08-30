import { verifyActivationToken } from "./activation-server.js";

export interface GeneratePdfOptions {
  html: string;
  filename?: string;
  token?: string;
  isDemo?: boolean;
}

/**
 * Validates whether the user is authorized to download a clean, non-watermarked HD PDF.
 */
export function canGenerateCleanPdf(token?: string): boolean {
  if (!token) return false;
  const result = verifyActivationToken(token);
  return result.valid;
}

/**
 * Builds a standalone, print-optimized HTML document for A4 PDF rendering.
 */
export function buildPrintHtml(rawHtml: string, isUnlocked: boolean): string {
  const watermarkCss = !isUnlocked
    ? `
      .watermark-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.4);
      }
      .watermark-text {
        transform: rotate(-35deg);
        font-size: 38px;
        font-weight: 800;
        font-family: 'DM Serif Display', serif, sans-serif;
        color: rgba(96, 115, 90, 0.35);
        border: 4px dashed rgba(96, 115, 90, 0.4);
        padding: 20px 40px;
        text-align: center;
        letter-spacing: 2px;
      }
      .blur-content {
        filter: blur(4.5px);
        user-select: none;
      }
    `
    : "";

  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>CV Tounsi — Export A4</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=DM+Serif+Display&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      width: 794px;
      min-height: 1123px;
    }
    ${watermarkCss}
  </style>
</head>
<body>
  ${!isUnlocked ? `
    <div class="watermark-overlay">
      <div class="watermark-text">
        CV TOUNSI — VERSION DÉMO<br>
        <span style="font-size: 15px; font-weight: 600; font-family: 'Inter', sans-serif; display: block; margin: 8px 0;">Tarifs : 12.900 DT (1 Mois) · 29.900 DT (1 An)</span>
        <a href="https://wa.me/21692067554?text=Bonjour,%20je%20veux%20d%C3%A9bloquer%20mon%20CV" target="_blank" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; font-family: 'Inter', sans-serif; padding: 10px 22px; border-radius: 8px; margin-top: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
          👉 Acheter & Débloquer sur WhatsApp (+216 92 067 554)
        </a>
      </div>
    </div>
  ` : ""}
  <div class="${!isUnlocked ? "blur-content" : ""}">
    ${rawHtml}
  </div>
</body>
</html>`;
}
