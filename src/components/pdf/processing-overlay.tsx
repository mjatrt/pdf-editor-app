"use client";

import { usePdfStore } from "@/stores/pdf-store";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export function ProcessingOverlay() {
  const { processing, progress } = usePdfStore();

  if (!processing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium">処理中...</p>
          <p className="text-sm text-muted-foreground mt-1">
            しばらくお待ちください
          </p>
        </div>
        {progress > 0 && (
          <div className="w-64">
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground mt-1">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
