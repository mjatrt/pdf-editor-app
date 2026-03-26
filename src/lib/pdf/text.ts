import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { TextAnnotation } from "@/types/pdf";

export async function addTexts(
  pdfBuffer: ArrayBuffer,
  annotations: TextAnnotation[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
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
