import fontkit from "@pdf-lib/fontkit";
import type { PDFDocument } from "pdf-lib";

let cachedFont: ArrayBuffer | null = null;

export async function loadJapaneseFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  const res = await fetch("/fonts/NotoSansJP-Regular.ttf");
  if (!res.ok) throw new Error("フォントの読み込みに失敗しました");
  cachedFont = await res.arrayBuffer();
  return cachedFont;
}

export function registerFontkit(pdf: PDFDocument): void {
  pdf.registerFontkit(fontkit);
}
