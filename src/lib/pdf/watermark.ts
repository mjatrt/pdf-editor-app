import { PDFDocument, rgb, degrees } from "pdf-lib";
import { loadJapaneseFont, registerFontkit } from "./font";
import type { WatermarkOptions } from "@/types/pdf";

const DEFAULT_OPTIONS: WatermarkOptions = {
  text: "CONFIDENTIAL",
  fontSize: 50,
  opacity: 0.3,
  rotation: -45,
  color: { r: 0.5, g: 0.5, b: 0.5 },
};

export async function addWatermark(
  pdfBuffer: ArrayBuffer,
  options: Partial<WatermarkOptions> = {}
): Promise<Uint8Array> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pdf = await PDFDocument.load(pdfBuffer);
  registerFontkit(pdf);
  const fontBytes = await loadJapaneseFont();
  const font = await pdf.embedFont(fontBytes);
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(opts.text, opts.fontSize);
    const textHeight = font.heightAtSize(opts.fontSize);

    page.drawText(opts.text, {
      x: (width - textWidth) / 2,
      y: (height - textHeight) / 2,
      size: opts.fontSize,
      font,
      color: rgb(opts.color.r, opts.color.g, opts.color.b),
      opacity: opts.opacity,
      rotate: degrees(opts.rotation),
    });
  }

  return pdf.save();
}
