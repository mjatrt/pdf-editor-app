import type { ExtractedTextItem } from "@/types/pdf";

export async function extractPageTextItems(
  pdfBuffer: ArrayBuffer,
  pageIndex: number
): Promise<ExtractedTextItem[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const doc = await pdfjs.getDocument({ data: pdfBuffer }).promise;
  const page = await doc.getPage(pageIndex + 1);
  const textContent = await page.getTextContent();

  const items: ExtractedTextItem[] = [];

  for (const item of textContent.items) {
    if (!("str" in item) || !item.str.trim()) continue;

    const transform = item.transform;
    const skewX = transform[1];
    const skewY = transform[2];

    // Skip rotated text
    if (Math.abs(skewX) > 0.01 || Math.abs(skewY) > 0.01) continue;

    const fontSize = Math.abs(transform[3]) || Math.abs(transform[0]);
    if (fontSize === 0) continue;

    items.push({
      id: crypto.randomUUID(),
      pageIndex,
      text: item.str,
      pdfX: transform[4],
      pdfY: transform[5],
      pdfWidth: item.width,
      pdfHeight: fontSize * 1.2,
      fontName: item.fontName,
      fontSize,
    });
  }

  doc.destroy();
  return items;
}

export function pdfToCanvas(
  pdfX: number,
  pdfY: number,
  pdfHeight: number,
  pageHeight: number,
  scale: number
): { canvasX: number; canvasY: number } {
  const canvasX = pdfX * scale;
  const canvasY = (pageHeight - pdfY - pdfHeight) * scale;
  return { canvasX, canvasY };
}
