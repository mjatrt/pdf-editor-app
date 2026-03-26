import { PDFDocument } from "pdf-lib";

export interface SplitRange {
  start: number; // 0-indexed
  end: number; // 0-indexed, inclusive
}

export async function splitPdf(
  pdfBuffer: ArrayBuffer,
  ranges: SplitRange[]
): Promise<Uint8Array[]> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const results: Uint8Array[] = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const pageIndices: number[] = [];
    for (let i = range.start; i <= range.end; i++) {
      pageIndices.push(i);
    }
    const pages = await newPdf.copyPages(sourcePdf, pageIndices);
    for (const page of pages) {
      newPdf.addPage(page);
    }
    results.push(await newPdf.save());
  }

  return results;
}

export async function extractPages(
  pdfBuffer: ArrayBuffer,
  pageIndices: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);
  for (const page of pages) {
    newPdf.addPage(page);
  }
  return newPdf.save();
}
