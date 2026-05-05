import crypto from 'crypto';

export function timingSafeEqualText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function verifyBearerOrHeaderToken(token: string | null | undefined, expected: string | undefined) {
  if (!expected || !token) return false;
  return timingSafeEqualText(token, expected);
}

export function readWebhookToken(request: Request) {
  return request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-maitri-webhook-token') || '';
}
