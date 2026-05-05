import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col">
        <header className="container py-6">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z" fill="currentColor"/>
              </svg>
            </div>
            <span className="font-display text-xl font-medium">Maitri</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </main>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:block relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-primary-50 to-cream" />
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />

        <div className="relative h-full flex flex-col justify-between p-12">
          <div />
          <div className="space-y-6 max-w-md">
            <p className="text-xs uppercase tracking-widest text-accent">For Thai hospitality</p>
            <blockquote className="font-display text-3xl xl:text-4xl font-medium leading-tight tracking-tight text-pretty">
              "เราจัดการ inbox 5 ภาษาได้ในคนคนเดียว ลด overtime พนักงานครึ่งหนึ่ง"
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display">
                K
              </div>
              <div>
                <div className="font-medium text-sm">คุณกรกฎ</div>
                <div className="text-xs text-muted-foreground">Boutique Hotel · เชียงใหม่</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            เข้าร่วมโรงแรม 30+ แห่งที่กำลังใช้ Maitri
          </div>
        </div>
      </div>
    </div>
  );
}
