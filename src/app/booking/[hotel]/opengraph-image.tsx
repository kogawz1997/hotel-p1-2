import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: Promise<{ hotel: string }> }) {
  const { hotel } = await params;

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', background: '#FAF7F2', color: '#2A2522', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80 }}>
      <div style={{ fontSize: 32, color: '#C66A30' }}>Maitri Booking</div>
      <div style={{ fontSize: 72, fontWeight: 700, marginTop: 20 }}>Secure direct booking</div>
      <div style={{ fontSize: 32, opacity: .7, marginTop: 18 }}>{hotel}</div>
    </div>,
    size,
  );
}
