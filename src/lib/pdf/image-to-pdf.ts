import { PDFDocument } from "pdf-lib";

export interface ImageToPdfOptions {
  fitToA4: boolean;
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const A4_MARGIN = 20;

export async function imagesToPdf(
  images: { data: ArrayBuffer; type: string }[],
  options: ImageToPdfOptions = { fitToA4: true }
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const img of images) {
    const embedded =
      img.type === "image/png"
        ? await pdf.embedPng(img.data)
        : await pdf.embedJpg(img.data);

    let width = embedded.width;
    let height = embedded.height;

    if (options.fitToA4) {
      const maxW = A4_WIDTH - A4_MARGIN * 2;
      const maxH = A4_HEIGHT - A4_MARGIN * 2;
      const scale = Math.min(maxW / width, maxH / height, 1);
      width *= scale;
      height *= scale;

      const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
      page.drawImage(embedded, {
        x: (A4_WIDTH - width) / 2,
        y: (A4_HEIGHT - height) / 2,
        width,
        height,
      });
    } else {
      const page = pdf.addPage([width, height]);
      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }
  }

  return pdf.save();
}
