import { redirect } from 'next/navigation';
import { OnboardingClient } from './onboarding-client';
import { bootstrapOrganizationFromUser, getOnboardingStatus } from '@/lib/onboarding/status';

export default async function OnboardingPage() {
  let status = await getOnboardingStatus();
  if (!status) redirect('/auth/login');

  if (!status.profile?.organization_id) {
    status = await bootstrapOrganizationFromUser();
  }

  if (!status) redirect('/auth/login');
  if (status.isComplete) redirect('/dashboard');

  return (
    <OnboardingClient
      user={{ id: status.userId, email: status.email || '' }}
      organizationId={status.profile?.organization_id || ''}
      existingHotel={status.hotel || null}
      hasRoomTypes={status.roomTypeCount > 0}
    />
  );
}
