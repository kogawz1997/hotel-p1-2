# Deployment Guide

แนะนำ deploy ผ่าน **Vercel + Supabase** — ใช้เวลา ~30 นาที สำหรับ initial deploy

## 🎯 Architecture

```
Internet → Vercel (Edge + Functions) → Supabase (Postgres + Auth)
                ↓
        External Services
        (Anthropic, LINE, Omise, ...)
```

---

## 1️⃣ Pre-deployment Checklist

ก่อนเริ่ม:
- [ ] Code อยู่ใน GitHub repo (private OK)
- [ ] Local dev ทำงานได้แล้ว (ตาม [QUICK_START.md](./QUICK_START.md))
- [ ] Supabase Pro plan ($25/mo)
- [ ] Domain (~$10/yr ที่ Cloudflare/Namecheap)
- [ ] Anthropic credit เพียงพอ ($50+ suggested)

---

## 2️⃣ Supabase Production Setup

### Upgrade to Pro
1. Supabase Dashboard → **Settings → Billing**
2. Upgrade → **Pro** ($25/mo)
3. ได้:
   - 8 GB database
   - 100 GB bandwidth
   - 7-day Point-in-Time Recovery
   - Daily backups

### Configure Auth URLs
1. **Authentication → URL Configuration**
2. **Site URL**: `https://yourdomain.com`
3. **Redirect URLs**: เพิ่ม
   - `https://yourdomain.com/**`
   - `https://staging.yourdomain.com/**`

### Run Migrations
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROD_REF
npx supabase db push
```

---

## 3️⃣ Vercel Deployment

### Connect Repository
1. ไปที่ [vercel.com](https://vercel.com) → **Sign in with GitHub**
2. **Import Project** → เลือก repo
3. Framework: **Next.js** (auto-detected)
4. Build command: `npm run build`

### Environment Variables

ใน Vercel project → **Settings → Environment Variables**:

#### Required
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
ANTHROPIC_API_KEY=sk-ant-xxx...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### Channels (when ready)
```bash
LINE_CHANNEL_ACCESS_TOKEN=eyJxxx...
LINE_CHANNEL_SECRET=abc123
WHATSAPP_ACCESS_TOKEN=EAAxxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_VERIFY_TOKEN=your_secret
SENDGRID_API_KEY=SG.xxx
```

#### Payments
```bash
OMISE_PUBLIC_KEY=pkey_live_xxx
OMISE_SECRET_KEY=skey_live_xxx
```

#### Compliance
```bash
ETAX_PROVIDER=inet
ETAX_USERNAME=xxx
ETAX_PASSWORD=xxx
ETAX_API_URL=https://etax.inet.co.th/api/v1
```

> 💡 **Tip**: Set environment per stage (Production / Preview / Development)

### Deploy
1. Click **Deploy**
2. รอ ~3-5 นาที
3. Visit `https://your-project.vercel.app`

---

## 4️⃣ Custom Domain

### Add Domain in Vercel
1. Project → **Settings → Domains**
2. **Add** → ใส่ `yourdomain.com`
3. Add `www.yourdomain.com` ด้วย → redirect to apex

### DNS Configuration

ที่ domain registrar:

#### Apex domain
```
Type: A
Name: @
Value: 76.76.21.21
```

#### WWW subdomain
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### SSL
- Vercel auto-provisions Let's Encrypt SSL
- รอ DNS propagation 5-30 นาที

---

## 5️⃣ Configure Webhooks

หลัง deploy, update webhook URLs:

| Service | Update Webhook to |
|---|---|
| LINE Developer Console | `https://yourdomain.com/api/webhooks/line` |
| Meta WhatsApp | `https://yourdomain.com/api/webhooks/whatsapp` |
| Omise Dashboard | `https://yourdomain.com/api/webhooks/omise` |
| HotelRunner | `https://yourdomain.com/api/webhooks/hotelrunner` |

---

## 6️⃣ Post-Deploy Smoke Tests

### Auth
- [ ] สมัครบัญชีใหม่ได้
- [ ] Login / logout ได้

### Core Features
- [ ] Dashboard load (no errors)
- [ ] เพิ่มห้องได้
- [ ] สร้างการจองได้
- [ ] ดู calendar ได้
- [ ] Inbox load ได้

### AI
- [ ] เปิด `/dashboard/inbox`
- [ ] กดปุ่ม ✨ → AI ตอบกลับได้

### Public Booking
- [ ] เปิด `/booking/[your-hotel-slug]`
- [ ] ค้นหาห้อง → จองได้

---

## 7️⃣ Production Hardening

### Monitoring
- **Vercel Analytics** (free with Pro): visits, performance
- **Sentry** (free tier): error tracking
- **Uptime Robot** (free): external uptime monitoring

### Security Headers
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ];
}
```

### Function Timeout
```javascript
// route.ts
export const maxDuration = 60; // for AI calls
```

---

## 8️⃣ CI/CD with GitHub Actions

`.github/workflows/ci.yml` ทำงานอยู่แล้ว — ทุก PR จะ:
- ✅ Lint
- ✅ Type check
- ✅ Build

Vercel auto-deploy:
- **main branch** → production
- **อื่นๆ** → preview deploy (มี URL unique ต่อ PR)

### Branch Protection
GitHub → **Settings → Branches → Add rule**:
- Branch name: `main`
- ✅ Require pull request before merging
- ✅ Require status checks to pass

---

## 9️⃣ Cost Monitoring

### Monthly Costs (production)
| Service | Cost |
|---|---|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Anthropic API | ~$50-300 (variable) |
| Domain | $1 |
| Sentry | $0 (free tier) |
| Uptime Robot | $0 (free) |
| **Total** | **~$96-346/mo** |

### When to Upgrade

#### Vercel Enterprise ($150+/mo)
- ถ้า traffic > 1M req/mo
- ต้องการ SLA 99.99%

#### Supabase Team ($599+/mo)
- > 100 users
- ต้องการ multi-region

---

## 🚨 Disaster Recovery

### Backup Strategy
1. **Supabase PITR**: 7 days (auto)
2. **Daily snapshot** auto-saved
3. **Manual export** monthly: `pg_dump` → S3
4. **Code**: GitHub (already)

### Recovery Time Objective (RTO)
- **Vercel down**: 0 min (rollback to last deployment)
- **Supabase down**: ~30 min (restore from backup)
- **Full disaster**: ~2 hours

---

## 🐛 Common Issues

### "500 error after deploy"
- Check Vercel **Functions** tab → see error logs
- ตรวจสอบ env vars ครบ
- ตรวจสอบ build success

### "Database connection issues"
- Supabase project paused? Resume
- Wrong env: production vs preview

### "Webhook 401"
- Webhook URL ผิด (typo, http vs https)
- Signature header verification ล้มเหลว

### "AI timeout"
- Vercel function timeout default = 10s
- เพิ่มเป็น 60s ใน route file

---

## ✅ Production Readiness Checklist

- [ ] Domain pointing correctly + SSL active
- [ ] All env vars set in Vercel (Production + Preview)
- [ ] Supabase migrations pushed
- [ ] Auth URLs configured
- [ ] Webhook URLs updated at all external services
- [ ] Test signup → dashboard works end-to-end
- [ ] Test booking flow ผ่าน
- [ ] Test AI inbox ผ่าน
- [ ] Sentry/monitoring configured
- [ ] Backup strategy verified
- [ ] First customer onboarded successfully
