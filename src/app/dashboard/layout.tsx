import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { getOnboardingStatus } from '@/lib/onboarding/status';
import { isBillingBlocked } from '@/lib/billing/plans';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const status = await getOnboardingStatus();

  if (!status) redirect('/auth/login');
  if (!status.profile?.active) redirect('/auth/login?error=inactive');
  if (!status.isComplete) redirect(`/onboarding?step=${status.nextStep}`);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        hotelName={status.hotel?.name || 'My Hotel'}
        hotelId={status.hotel?.id}
        userName={status.profile?.full_name || undefined}
        userEmail={status.profile?.email || status.email || undefined}
        userRole={status.profile?.role}
      />
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        {isBillingBlocked(status.organization?.subscription_status) && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            Subscription needs attention: {status.organization?.subscription_status}. ไปที่ <a className="font-semibold underline" href="/dashboard/billing">Billing</a> เพื่อชำระเงินหรือเปิด customer portal. ระบบยังไม่ลบข้อมูลลูกค้า เพราะเราไม่ได้โหดร้ายขนาดนั้น
          </div>
        )}
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
