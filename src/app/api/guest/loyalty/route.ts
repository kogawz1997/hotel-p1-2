import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find guest record linked to this account
  const { data: guestAccount } = await supabase
    .from('guest_accounts').select('email').eq('id', user.id).single();
  if (!guestAccount) return NextResponse.json({ points: 0, tier: 'bronze' });

  // Get all guests with this email across hotels
  const { data: guests } = await supabase
    .from('guests').select('loyalty_points, loyalty_tier, total_stays, total_revenue')
    .eq('email', guestAccount.email);

  if (!guests?.length) return NextResponse.json({ points: 0, tier: 'bronze' });

  const totalPoints = guests.reduce((s, g) => s + (g.loyalty_points || 0), 0);
  const maxTier = ['bronze','silver','gold','platinum'].reverse()
    .find(t => guests.some(g => g.loyalty_tier === t)) || 'bronze';
  const totalStays = guests.reduce((s, g) => s + (g.total_stays || 0), 0);

  // Get recent transactions
  const { data: txs } = await supabase
    .from('loyalty_transactions')
    .select('points, description, type, created_at')
    .in('guest_id', guests.map((_, i) => i)) // simplified
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({ points: totalPoints, tier: maxTier, totalStays, transactions: txs || [] });
}
