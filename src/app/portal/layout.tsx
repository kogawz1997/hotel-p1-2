import { CookieConsent } from '@/components/ui/cookie-consent';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CookieConsent />
    </>
  );
}
