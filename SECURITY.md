# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, email **security@maitri.co** with:

- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Any potential fix you've identified

We'll acknowledge receipt within 48 hours and provide regular updates on our progress. We aim to release fixes within 7-30 days depending on severity.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

## Bug Bounty

We don't have a formal bug bounty program yet, but we'll publicly thank security researchers (with permission) and may offer Maitri credits for responsible disclosure.

## Security Best Practices for Operators

If you're self-hosting Maitri:

- [ ] Enable 2FA on Supabase, Vercel, Anthropic, and all integrated services
- [ ] Rotate API keys every 6 months
- [ ] Never commit `.env.local` to git
- [ ] Use environment-specific Supabase projects (dev / staging / prod)
- [ ] Monitor Sentry for unusual error patterns
- [ ] Keep dependencies updated (`npm audit fix` regularly)
- [ ] Enable Supabase point-in-time recovery
- [ ] Configure rate limiting at edge (Cloudflare / Vercel)

## Known Security Considerations

- **Webhook endpoints** verify HMAC signatures but require correct setup. See `docs/API_INTEGRATIONS.md`.
- **Service role key** must never be exposed client-side. Only use in server components and API routes.
- **PDPA compliance** requires legal review specific to your jurisdiction.
