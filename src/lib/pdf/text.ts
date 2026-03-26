import { PDFDocument, rgb } from "pdf-lib";
import type { PDFFont } from "pdf-lib";
import { loadFont, registerFontkit } from "./font";
import type { FontKey } from "./font";
import type { TextAnnotation, TextEdit } from "@/types/pdf";

async function embedFonts(
  pdf: PDFDocument,
  items: { fontKey?: string }[]
): Promise<Map<string, PDFFont>> {
  registerFontkit(pdf);
  const keys = new Set<FontKey>();
  for (const item of items) {
    keys.add((item.fontKey as FontKey) || "noto-sans");
  }
  const fontMap = new Map<string, PDFFont>();
  for (const key of keys) {
    const bytes = await loadFont(key);
    const font = await pdf.embedFont(bytes);
    fontMap.set(key, font);
  }
  return fontMap;
}

function getFont(fontMap: Map<string, PDFFont>, fontKey?: string): PDFFont {
  return fontMap.get(fontKey || "noto-sans") || fontMap.values().next().value!;
}

export async function addTexts(
  pdfBuffer: ArrayBuffer,
  annotations: TextAnnotation[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const fontMap = await embedFonts(pdf, annotations);
  const pages = pdf.getPages();

  for (const annotation of annotations) {
    const pageIndex = annotation.pageIndex;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { height } = page.getSize();
    const pdfY = height - annotation.y - annotation.fontSize;

    page.drawText(annotation.text, {
      x: annotation.x,
      y: pdfY,
      size: annotation.fontSize,
      font: getFont(fontMap, annotation.fontKey),
      color: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
    });
  }

  return pdf.save();
}

export async function applyTextEdits(
  pdfBuffer: ArrayBuffer,
  edits: TextEdit[],
  annotations: TextAnnotation[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const allItems = [...edits, ...annotations];
  const fontMap = await embedFonts(pdf, allItems);
  const pages = pdf.getPages();

  for (const edit of edits) {
    if (edit.pageIndex < 0 || edit.pageIndex >= pages.length) continue;
    const page = pages[edit.pageIndex];

    page.drawRectangle({
      x: edit.coverRect.x,
      y: edit.coverRect.y,
      width: edit.coverRect.width,
      height: edit.coverRect.height,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    });

    page.drawText(edit.newText, {
      x: edit.x,
      y: edit.y,
      size: edit.fontSize,
      font: getFont(fontMap, edit.fontKey),
      color: rgb(edit.color.r, edit.color.g, edit.color.b),
    });
  }

  for (const annotation of annotations) {
    if (annotation.pageIndex < 0 || annotation.pageIndex >= pages.length)
      continue;
    const page = pages[annotation.pageIndex];
    const { height } = page.getSize();
    const pdfY = height - annotation.y - annotation.fontSize;

    page.drawText(annotation.text, {
      x: annotation.x,
      y: pdfY,
      size: annotation.fontSize,
      font: getFont(fontMap, annotation.fontKey),
      color: rgb(
        annotation.color.r,
        annotation.color.g,
        annotation.color.b
      ),
    });
  }

  return pdf.save();
}
