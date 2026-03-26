import { PDFDocument } from "pdf-lib";

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  fileSize: number;
}

export async function getMetadata(
  pdfBuffer: ArrayBuffer
): Promise<PdfMetadata> {
  const pdf = await PDFDocument.load(pdfBuffer);
  return {
    title: pdf.getTitle(),
    author: pdf.getAuthor(),
    subject: pdf.getSubject(),
    keywords: pdf.getKeywords()?.split(",").map((k) => k.trim()),
    creator: pdf.getCreator(),
    producer: pdf.getProducer(),
    creationDate: pdf.getCreationDate(),
    modificationDate: pdf.getModificationDate(),
    pageCount: pdf.getPageCount(),
    fileSize: pdfBuffer.byteLength,
  };
}

export async function setMetadata(
  pdfBuffer: ArrayBuffer,
  metadata: Partial<Omit<PdfMetadata, "pageCount" | "fileSize">>
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);

  if (metadata.title !== undefined) pdf.setTitle(metadata.title);
  if (metadata.author !== undefined) pdf.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdf.setSubject(metadata.subject);
  if (metadata.keywords !== undefined)
    pdf.setKeywords(metadata.keywords);
  if (metadata.creator !== undefined) pdf.setCreator(metadata.creator);
  if (metadata.producer !== undefined) pdf.setProducer(metadata.producer);

  return pdf.save();
}
