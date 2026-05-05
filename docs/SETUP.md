# Setup — Master Checklist

ทุกอย่างที่ต้อง setup เพื่อให้ Maitri ทำงานครบทุกฟีเจอร์

> 💡 ไม่ต้องทำทั้งหมด — เริ่มจากสำคัญที่สุดก่อน แล้วค่อยเพิ่มทีหลัง

---

## 🎯 Tier 1: Required Minimum (สำหรับ Launch)

ใช้เวลารวม ~1 ชั่วโมง

| Service | Time | Cost | Guide |
|---|---|---|---|
| ✅ Supabase | 5 min | Free | [QUICK_START](QUICK_START.md#2️⃣-supabase-setup-5-นาที) |
| ✅ Anthropic | 3 min | $5 free credit | [QUICK_START](QUICK_START.md#3️⃣-anthropic-api-key-3-นาที) |
| ✅ Vercel | 10 min | Free tier | [DEPLOYMENT](DEPLOYMENT.md) |
| ✅ Domain | 15 min | ~฿400/ปี | Register ที่ Cloudflare/Namecheap |

หลังขั้นนี้ — ระบบทำงานได้ แต่ยังไม่ connect external services

---

## 🌟 Tier 2: Communication (สำคัญสำหรับใช้งานจริง)

| Service | Time | Cost | Guide |
|---|---|---|---|
| LINE OA | 30 min + 5 วันรอ verify | ฿0-1,200/mo | [LINE.md](integrations/LINE.md) |
| Email (SendGrid) | 15 min | ฟรี 100/วัน | ดูด้านล่าง |
| WhatsApp | 1-2 ชม. + 3-5 วันรอ verify | $0-100/mo | [WHATSAPP.md](integrations/WHATSAPP.md) |

### SendGrid (Email)

```bash
1. ไป https://sendgrid.com → Sign up (ฟรี)
2. Settings → Sender Authentication → Authenticate domain
3. Settings → API Keys → Create API Key
   Permission: Mail Send (Full Access)
4. Copy → ใส่ .env.local SENDGRID_API_KEY
5. Set sender email: SENDGRID_FROM_EMAIL=noreply@yourhotel.com
```

---

## 💰 Tier 3: Payment

| Service | Time | Cost | Guide |
|---|---|---|---|
| Omise | 30 min + 1-3 สัปดาห์รอ verify | 3.65% + ฿10/transaction | [OMISE.md](integrations/OMISE.md) |
| Stripe (international) | 30 min | 3.65% + ฿10 | ดูด้านล่าง |

> 💡 Omise = ดีกว่าสำหรับลูกค้าไทย (PromptPay, Internet Banking)
> Stripe = ดีกว่าสำหรับลูกค้าต่างชาติ (Apple Pay, Google Pay)

---

## 🌐 Tier 4: Channel Manager

ทางเลือก:

### Option A: HotelRunner (ใช้เร็ว)
```
1. https://hotelrunner.com → Sign up
2. Subscribe ($50-100/mo)
3. Connect channels: Booking.com, Agoda, Airbnb, Expedia
4. Get API key → ใส่ HOTELRUNNER_API_KEY
```

ใช้เวลา 2-7 วัน

### Option B: Direct API (ลด commission)
ดู [CHANNEL_MANAGER.md](integrations/CHANNEL_MANAGER.md) — ใช้เวลา 4-16 สัปดาห์

---

## 🇹🇭 Tier 5: Thai Compliance

| Service | Time | Cost | Guide |
|---|---|---|---|
| ทร.30 setup | 1-2 ชั่วโมง | ฿0 | [TM30.md](integrations/TM30.md) |
| e-Tax Invoice | 2 สัปดาห์ | ฿3,000-10,000/mo | [ETAX.md](integrations/ETAX.md) |
| PDPA Compliance | ปรึกษาทนาย | ฿5,000-20,000 setup | ดูด้านล่าง |

### PDPA (Personal Data Protection Act)

**สำคัญ** — ละเมิด PDPA ปรับสูงสุด 5 ล้านบาท

#### Required:
- [ ] Privacy Policy (ภาษาไทย + อังกฤษ)
- [ ] Terms of Service
- [ ] Cookie Consent banner
- [ ] Data Processing Agreement กับ vendors (Supabase, Anthropic, ฯลฯ)
- [ ] Data Protection Officer (DPO)
- [ ] Data Retention Policy (เก็บข้อมูลแขกไม่เกิน 5 ปีหลังเข้าพัก)
- [ ] Right to Erasure (function ลบข้อมูลตามคำขอ)

#### Templates พื้นฐาน:
- [Privacy Policy template](https://www.dataprotection.or.th)
- ปรึกษาทนาย: ค่าใช้จ่าย ~฿10,000-30,000

---

## 📊 Tier 6: Accounting Integration

| Service | Time | Cost | Guide |
|---|---|---|---|
| FlowAccount | 30 min | API ฟรี (มี subscription) | [ACCOUNTING.md](integrations/ACCOUNTING.md) |
| PEAK Account | 1 สัปดาห์ (ติดต่อ support) | ฿650-1,650/mo | [ACCOUNTING.md](integrations/ACCOUNTING.md) |
| Express | Manual export | (มี subscription) | CSV export |

---

## 🛠 Tier 7: Production Hardening

หลัง launch สักพัก:

### Monitoring
- [ ] **Sentry** — Error tracking (Free tier)
- [ ] **PostHog** — Product analytics (ฟรี 1M events/mo)
- [ ] **UptimeRobot** — Uptime monitoring (ฟรี)
- [ ] **Vercel Analytics** — Web vitals (Pro plan)

### Security
- [ ] Enable 2FA ทุก account (Vercel, Supabase, ฯลฯ)
- [ ] API key rotation policy (90 วัน)
- [ ] Backup strategy (Supabase Pro + manual exports)
- [ ] Penetration testing (annual)

### Performance
- [ ] Image optimization (Next.js Image component)
- [ ] Database indexes review (ดู `EXPLAIN ANALYZE` queries)
- [ ] CDN for static assets (Cloudflare)
- [ ] Edge functions for low latency (ถ้า expand SEA)

---

## 📅 Recommended Timeline

### สัปดาห์ 1-2: MVP Launch
✅ Tier 1 (Supabase, Anthropic, Vercel, Domain)
✅ Tier 2 (LINE OA, Email)

→ **เริ่มหาลูกค้า pilot ได้แล้ว** (ใช้ manual workaround สำหรับฟีเจอร์ที่ยังไม่พร้อม)

### สัปดาห์ 3-6: Core Features
✅ Omise (Payment)
✅ HotelRunner (Channel Manager)
✅ FlowAccount (Accounting)

→ **Onboard ลูกค้าจริง ~5 ราย**

### เดือน 2-4: Compliance
✅ e-Tax Invoice
✅ ทร.30 setup
✅ PDPA implementation

### เดือน 4-12: Scale
✅ Direct OTA APIs
✅ WhatsApp Business
✅ Marketing automation
✅ Phase 2 features (F&B, Spa, Loyalty)

---

## 💡 Tips จากประสบการณ์

### 1. อย่าทำทุกอย่างพร้อมกัน
เลือก 3 ฟีเจอร์ที่สำคัญที่สุด → launch → ฟัง feedback → expand

### 2. Channel Manager เป็น bottleneck
- เริ่ม apply Direct API ตั้งแต่วันแรก (ใช้เวลา)
- ใช้ HotelRunner ระหว่างรอ
- 80% ของลูกค้าเริ่มต้นไม่ต้องการ direct API

### 3. e-Tax = ค่าใช้จ่ายสูง
- Budget ~฿5,000-10,000/mo
- ถ้าโรงแรมเล็กไม่จำเป็น (output ใบกำกับ manual ได้)
- เปิดใช้งานเมื่อพร้อม scale

### 4. PDPA — ปรึกษาทนายแต่เนิ่นๆ
- กฎหมายซับซ้อน, ค่าปรับสูง
- ใช้ template + ปรับให้เหมาะ
- Re-review ทุก 6 เดือน

### 5. AI Cost Management
- Anthropic Claude — แพงกว่าคิด
- Cache common translations
- Use Haiku สำหรับ simple tasks
- Monitor usage daily

---

## 🆘 Stuck somewhere?

1. ดู [Troubleshooting](QUICK_START.md#-troubleshooting)
2. เปิด [GitHub issue](https://github.com/yourusername/maitri/issues)
3. Email support: hello@maitri.app
