const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OMISE_SECRET_KEY',
  'OMISE_WEBHOOK_SECRET',
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing production env: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('Production environment looks configured.');
