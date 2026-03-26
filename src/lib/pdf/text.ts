import { PDFDocument, rgb } from "pdf-lib";
import { loadJapaneseFont } from "./font";
import type { TextAnnotation, TextEdit } from "@/types/pdf";

export async function addTexts(
  pdfBuffer: ArrayBuffer,
  annotations: TextAnnotation[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const fontBytes = await loadJapaneseFont();
  const font = await pdf.embedFont(fontBytes);
  const pages = pdf.getPages();

  for (const annotation of annotations) {
    const pageIndex = annotation.pageIndex;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { height } = page.getSize();

    // Convert from canvas coordinates (top-left origin, Y down)
    // to PDF coordinates (bottom-left origin, Y up)
    const pdfY = height - annotation.y - annotation.fontSize;

    page.drawText(annotation.text, {
      x: annotation.x,
      y: pdfY,
      size: annotation.fontSize,
      font,
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
  const fontBytes = await loadJapaneseFont();
  const font = await pdf.embedFont(fontBytes);
  const pages = pdf.getPages();

  // Apply text edits (white rectangle + replacement text)
  for (const edit of edits) {
    if (edit.pageIndex < 0 || edit.pageIndex >= pages.length) continue;
    const page = pages[edit.pageIndex];

    // Draw white rectangle to cover original text
    page.drawRectangle({
      x: edit.coverRect.x,
      y: edit.coverRect.y,
      width: edit.coverRect.width,
      height: edit.coverRect.height,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    });

    // Draw replacement text
    page.drawText(edit.newText, {
      x: edit.x,
      y: edit.y,
      size: edit.fontSize,
      font,
      color: rgb(edit.color.r, edit.color.g, edit.color.b),
    });
  }

  // Apply new text annotations
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
      font,
      color: rgb(
        annotation.color.r,
        annotation.color.g,
        annotation.color.b
      ),
    });
  }

  return pdf.save();
}
