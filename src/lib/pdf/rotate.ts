import { PDFDocument, degrees } from "pdf-lib";

export async function rotatePages(
  pdfBuffer: ArrayBuffer,
  rotations: { pageIndex: number; degrees: number }[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const pages = pdf.getPages();

  for (const { pageIndex, degrees: deg } of rotations) {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + deg));
    }
  }

  return pdf.save();
}

export async function deletePages(
  pdfBuffer: ArrayBuffer,
  pageIndicesToDelete: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();
  const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => !pageIndicesToDelete.includes(i)
  );

  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, keepIndices);
  for (const page of pages) {
    newPdf.addPage(page);
  }

  return newPdf.save();
}

export async function reorderPages(
  pdfBuffer: ArrayBuffer,
  newOrder: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, newOrder);
  for (const page of pages) {
    newPdf.addPage(page);
  }
  return newPdf.save();
}
