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
