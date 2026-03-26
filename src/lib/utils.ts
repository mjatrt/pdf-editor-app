import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pdfToBlob(data: Uint8Array): Blob {
  return new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" });
}
