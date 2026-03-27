import fontkit from "@pdf-lib/fontkit";
import type { PDFDocument } from "pdf-lib";

export type FontKey =
  | "noto-sans"
  | "noto-serif"
  | "mplus-1p"
  | "mplus-rounded"
  | "zen-maru";

const FONT_FILES: Record<FontKey, string> = {
  "noto-sans": "/fonts/NotoSansJP-Regular.ttf",
  "noto-serif": "/fonts/NotoSerifJP-Regular.otf",
  "mplus-1p": "/fonts/MPLUS1p-Regular.ttf",
  "mplus-rounded": "/fonts/MPLUSRounded1c-Regular.ttf",
  "zen-maru": "/fonts/ZenMaruGothic-Regular.ttf",
};

export interface FontOption {
  key: FontKey;
  label: string;
  fontFamily: string;
  googleParam: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { key: "noto-sans", label: "Noto Sans JP（ゴシック）", fontFamily: "'Noto Sans JP', sans-serif", googleParam: "Noto+Sans+JP" },
  { key: "noto-serif", label: "Noto Serif JP（明朝）", fontFamily: "'Noto Serif JP', serif", googleParam: "Noto+Serif+JP" },
  { key: "mplus-1p", label: "M PLUS 1p", fontFamily: "'M PLUS 1p', sans-serif", googleParam: "M+PLUS+1p" },
  { key: "mplus-rounded", label: "M PLUS Rounded 1c（丸）", fontFamily: "'M PLUS Rounded 1c', sans-serif", googleParam: "M+PLUS+Rounded+1c" },
  { key: "zen-maru", label: "Zen Maru Gothic（丸）", fontFamily: "'Zen Maru Gothic', sans-serif", googleParam: "Zen+Maru+Gothic" },
];

const fontCache = new Map<FontKey, ArrayBuffer>();

export async function loadFont(
  key: FontKey = "noto-sans"
): Promise<ArrayBuffer> {
  const cached = fontCache.get(key);
  if (cached) return cached;
  const res = await fetch(FONT_FILES[key]);
  if (!res.ok) throw new Error(`フォント ${key} の読み込みに失敗しました`);
  const buffer = await res.arrayBuffer();
  fontCache.set(key, buffer);
  return buffer;
}

export function registerFontkit(pdf: PDFDocument): void {
  pdf.registerFontkit(fontkit);
}
