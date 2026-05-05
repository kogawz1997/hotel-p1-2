'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="font-display text-xl font-medium mb-2">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          ไม่สามารถโหลดหน้านี้ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="h-4 w-4" />
        ลองใหม่
      </Button>
    </div>
  );
}
