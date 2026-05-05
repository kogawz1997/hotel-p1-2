import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'prepared', message: 'Endpoint prepared. Add real provider credentials in Vercel env, redeploy, then replace placeholder calls with live provider integration.' });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ status: 'prepared', received: body, next: ['Create provider account', 'Add API keys in Vercel Environment Variables', 'Redeploy', 'Enable live mode'] }, { status: 202 });
}
