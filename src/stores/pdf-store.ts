import { create } from "zustand";
import type { PdfFile, PageInfo } from "@/types/pdf";

interface PdfState {
  files: PdfFile[];
  pages: PageInfo[];
  selectedFileId: string | null;
  processing: boolean;
  progress: number;

  addFiles: (files: PdfFile[]) => void;
  removeFile: (id: string) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  clearFiles: () => void;
  setSelectedFile: (id: string | null) => void;

  setPages: (pages: PageInfo[]) => void;
  togglePageSelection: (pageIndex: number) => void;
  selectAllPages: () => void;
  deselectAllPages: () => void;
  rotatePage: (pageIndex: number, degrees: number) => void;
  deletePage: (pageIndex: number) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;

  setProcessing: (processing: boolean) => void;
  setProgress: (progress: number) => void;
}

export const usePdfStore = create<PdfState>((set) => ({
  files: [],
  pages: [],
  selectedFileId: null,
  processing: false,
  progress: 0,

  addFiles: (files) =>
    set((state) => ({ files: [...state.files, ...files] })),
  removeFile: (id) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  reorderFiles: (fromIndex, toIndex) =>
    set((state) => {
      const files = [...state.files];
      const [moved] = files.splice(fromIndex, 1);
      files.splice(toIndex, 0, moved);
      return { files };
    }),
  clearFiles: () => set({ files: [], pages: [], selectedFileId: null }),
  setSelectedFile: (id) => set({ selectedFileId: id }),

  setPages: (pages) => set({ pages }),
  togglePageSelection: (pageIndex) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.pageIndex === pageIndex ? { ...p, selected: !p.selected } : p
      ),
    })),
  selectAllPages: () =>
    set((state) => ({
      pages: state.pages.map((p) => ({ ...p, selected: true })),
    })),
  deselectAllPages: () =>
    set((state) => ({
      pages: state.pages.map((p) => ({ ...p, selected: false })),
    })),
  rotatePage: (pageIndex, degrees) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.pageIndex === pageIndex
          ? { ...p, rotation: (p.rotation + degrees) % 360 }
          : p
      ),
    })),
  deletePage: (pageIndex) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.pageIndex !== pageIndex),
    })),
  reorderPages: (fromIndex, toIndex) =>
    set((state) => {
      const pages = [...state.pages];
      const [moved] = pages.splice(fromIndex, 1);
      pages.splice(toIndex, 0, moved);
      return { pages };
    }),

  setProcessing: (processing) => set({ processing }),
  setProgress: (progress) => set({ progress }),
}));
