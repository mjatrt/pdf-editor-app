export interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  thumbnail?: string;
}

export interface PageInfo {
  pageIndex: number;
  rotation: number;
  selected: boolean;
}

export type OperationType =
  | "merge"
  | "split"
  | "rotate"
  | "delete"
  | "watermark"
  | "password"
  | "compress"
  | "convert"
  | "metadata";

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: { r: number; g: number; b: number };
}

export interface SplitOptions {
  ranges: { start: number; end: number }[];
}

export interface PasswordOptions {
  action: "set" | "remove";
  password: string;
}

export interface TextAnnotation {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
  fontKey?: string;
}

export interface ExtractedTextItem {
  id: string;
  pageIndex: number;
  text: string;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  fontName: string;
  fontSize: number;
}

export interface TextEdit {
  id: string;
  pageIndex: number;
  originalText: string;
  newText: string;
  coverRect: { x: number; y: number; width: number; height: number };
  x: number;
  y: number;
  fontSize: number;
  color: { r: number; g: number; b: number };
  fontKey?: string;
}
