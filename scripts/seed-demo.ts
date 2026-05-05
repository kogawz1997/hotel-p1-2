/**
 * Demo data seeder
 * Run: npx tsx scripts/seed-demo.ts
 *
 * This populates a hotel with demo room types, rooms, and a few reservations
 * for development and demo purposes.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🌱 Seeding demo data...');

  // Find first hotel (must already exist via signup)
  const { data: hotels } = await supabase.from('hotels').select('id, name').limit(1);
  if (!hotels?.[0]) {
    console.error('❌ No hotel found. Sign up first to create a hotel.');
    process.exit(1);
  }
  const hotelId = hotels[0].id;
  console.log(`✓ Using hotel: ${hotels[0].name}`);

  // Room types
  const { data: rt } = await supabase.from('room_types').upsert([
    { hotel_id: hotelId, name: 'Deluxe Room', code: 'DLX', max_occupancy: 2, base_rate: 2500, bed_type: 'queen', size_sqm: 32 },
    { hotel_id: hotelId, name: 'Premier Suite', code: 'STE', max_occupancy: 3, base_rate: 4500, bed_type: 'king', size_sqm: 52 },
    { hotel_id: hotelId, name: 'Pool Villa', code: 'POOL', max_occupancy: 4, base_rate: 8500, bed_type: 'king', size_sqm: 90 },
  ], { onConflict: 'hotel_id,code' }).select();
  console.log(`✓ Created ${rt?.length} room types`);

  // Rooms
  const rooms: any[] = [];
  rt?.forEach((type, i) => {
    const count = i === 0 ? 8 : i === 1 ? 4 : 2;
    for (let n = 1; n <= count; n++) {
      rooms.push({
        hotel_id: hotelId,
        room_type_id: type.id,
        room_number: `${i + 1}0${n}`,
        floor: i + 1,
        status: ['available', 'occupied', 'cleaning'][Math.floor(Math.random() * 3)],
      });
    }
  });
  await supabase.from('rooms').upsert(rooms, { onConflict: 'hotel_id,room_number' });
  console.log(`✓ Created ${rooms.length} rooms`);

  // Demo guests
  const guests = [
    { hotel_id: hotelId, first_name: 'John', last_name: 'Smith', email: 'john@example.com', nationality: 'British', total_stays: 2, total_revenue: 12000 },
    { hotel_id: hotelId, first_name: '田中', last_name: '美咲', email: 'tanaka@example.com', nationality: 'Japanese', total_stays: 1, total_revenue: 8500 },
    { hotel_id: hotelId, first_name: 'สมชาย', last_name: 'ใจดี', email: 'somchai@example.com', nationality: 'Thai', total_stays: 5, total_revenue: 35000, vip_status: true, loyalty_tier: 'gold' },
  ];
  await supabase.from('guests').upsert(guests, { onConflict: 'hotel_id,email' });
  console.log(`✓ Created ${guests.length} demo guests`);

  console.log('\n🎉 Demo data seeded successfully!');
  console.log('Visit http://localhost:3000/dashboard to see your data.');
}

main().catch(console.error);
