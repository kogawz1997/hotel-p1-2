import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Vercel Cron -- runs every day at 08:00 ICT (01:00 UTC)

type Hotel = {
  id: string;
  name: string;
  organization_id: string;
};

type RevenueRow = {
  amount: number | string | null;
};

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: hotels, error: hotelsError } = await admin
      .from('hotels')
      .select('id, name, organization_id');

    if (hotelsError) {
      return NextResponse.json(
        { error: hotelsError.message },
        { status: 500 }
      );
    }

    const summaries = await Promise.all(
      ((hotels || []) as Hotel[]).map(async (hotel: Hotel) => {
        const [
          { count: arrivals },
          { count: departures },
          { data: revenue },
        ] = await Promise.all([
          admin
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotel.id)
            .eq('check_in', today),

          admin
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotel.id)
            .eq('check_out', today),

          admin
            .from('payments')
            .select('amount')
            .eq('hotel_id', hotel.id)
            .eq('payment_date', today)
            .eq('status', 'completed'),
        ]);

        const revenueRows = (revenue || []) as RevenueRow[];

        const totalRevenue = revenueRows.reduce(
          (sum: number, payment: RevenueRow) =>
            sum + Number(payment.amount || 0),
          0
        );

        return {
          hotelId: hotel.id,
          hotelName: hotel.name,
          arrivals: arrivals || 0,
          departures: departures || 0,
          revenue: totalRevenue,
        };
      })
    );

    console.log(
      `[Cron Daily] Generated ${summaries.length} hotel summaries for ${today}`
    );

    return NextResponse.json({ date: today, summaries });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}