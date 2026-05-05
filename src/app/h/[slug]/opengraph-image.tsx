import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export const alt = 'Maitri hotel booking';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image({ params }: { params: { slug: string } }) { return new ImageResponse(<div style={{ width: '100%', height: '100%', background: '#2A2522', color: '#FAF7F2', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80 }}><div style={{ fontSize: 32, color: '#C66A30' }}>Maitri</div><div style={{ fontSize: 76, fontWeight: 700, marginTop: 20 }}>Book your stay</div><div style={{ fontSize: 34, opacity: .8, marginTop: 18 }}>/{params.slug}</div></div>, size); }
