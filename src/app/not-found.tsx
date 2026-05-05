import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <div className="text-center">
        <p className="text-8xl font-display font-bold text-muted-foreground/20 mb-4">404</p>
        <h2 className="font-display text-2xl font-medium mb-2">ไม่พบหน้านี้</h2>
        <p className="text-sm text-muted-foreground">หน้าที่คุณกำลังมองหาอาจถูกย้ายหรือลบออกแล้ว</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">กลับหน้าหลัก</Link>
      </Button>
    </div>
  );
}
