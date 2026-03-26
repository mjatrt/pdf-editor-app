"use client";

import { useState, useCallback, useEffect } from "react";
import { usePdfStore } from "@/stores/pdf-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface PageGridProps {
  file: File;
}

export function PageGrid({ file }: PageGridProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [ReactPdfComponents, setReactPdfComponents] = useState<{
    Document: React.ComponentType<Record<string, unknown>>;
    PageThumbnail: React.ComponentType<Record<string, unknown>>;
  } | null>(null);
  const { pages, setPages, togglePageSelection, rotatePage, deletePage } =
    usePdfStore();

  useEffect(() => {
    Promise.all([
      import("react-pdf"),
      import("./page-thumbnail"),
    ]).then(([reactPdf, thumbnailMod]) => {
      reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${reactPdf.pdfjs.version}/build/pdf.worker.min.mjs`;
      setReactPdfComponents({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Document: reactPdf.Document as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        PageThumbnail: thumbnailMod.PageThumbnail as any,
      });
    });
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setPages(
        Array.from({ length: total }, (_, i) => ({
          pageIndex: i,
          rotation: 0,
          selected: false,
        }))
      );
    },
    [setPages]
  );

  if (!ReactPdfComponents) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-[136px] h-[200px]" />
        ))}
      </div>
    );
  }

  const { Document, PageThumbnail } = ReactPdfComponents;

  return (
    <div>
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="w-[136px] h-[200px]" />
            ))}
          </div>
        }
      >
        {numPages > 0 && (
          <ScrollArea className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-1">
              {pages.map((page) => (
                <PageThumbnail
                  key={page.pageIndex}
                  file={file}
                  pageNumber={page.pageIndex + 1}
                  rotation={page.rotation}
                  selected={page.selected}
                  onClick={() => togglePageSelection(page.pageIndex)}
                  onRotate={() => rotatePage(page.pageIndex, 90)}
                  onDelete={() => deletePage(page.pageIndex)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </Document>
    </div>
  );
}
