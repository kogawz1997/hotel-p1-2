# Quick Start — 30 นาที Get Online

คู่มือนี้พาคุณ launch Maitri ขั้นต่ำเพื่อทดลองใช้ ภายใน 30 นาที — ไม่ต้องรอ Channel Manager ไม่ต้องสมัคร LINE OA

## 📋 สิ่งที่ต้องเตรียม

- **คอมพิวเตอร์** ที่ติดตั้ง [Node.js 20+](https://nodejs.org) และ Git
- **อีเมล** สำหรับสมัคร services
- **บัตรเครดิต** (optional — สำหรับ production deploy)

---

## 1️⃣ Clone Repository (1 นาที)

```bash
git clone https://github.com/yourusername/maitri.git
cd maitri
npm install
```

---

## 2️⃣ Supabase Setup (5 นาที)

Supabase = Database + Auth + Storage + Realtime ในที่เดียว

### สมัคร
1. ไปที่ [supabase.com](https://supabase.com) → **Sign up with GitHub**
2. **New Project**:
   - Name: `maitri-dev`
   - Region: **Southeast Asia (Singapore)** ← สำคัญสำหรับ latency
   - Database password: ตั้งและ **save ไว้**
3. รอ provisioning ~2 นาที

### Get Credentials
จาก dashboard → **Project Settings** → **API**:

| Field | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "Project API keys" → `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | "Project API keys" → `service_role` (secret) |

> ⚠️ `service_role` มี admin access — อย่าใส่ใน frontend code

### Run Migrations
**Option A: CLI (แนะนำ)**
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

**Option B: Manual**
1. เปิด Supabase Dashboard → **SQL Editor** → **New query**
2. Copy เนื้อหาจาก `supabase/migrations/00001_initial_schema.sql`
3. Paste แล้วกด **Run**

ตรวจสอบ: ไปที่ **Table Editor** ควรเห็น 40+ tables

---

## 3️⃣ Anthropic API Key (3 นาที)

Claude คือ AI engine สำหรับแปลภาษาและตอบกลับ

1. ไปที่ [console.anthropic.com](https://console.anthropic.com) → **Sign up**
2. Workspace ของคุณจะได้ **$5 free credit** (พอใช้ ~10,000 messages)
3. **Settings** → **API Keys** → **Create Key**
4. Copy key → ใส่ใน `ANTHROPIC_API_KEY`

> 💡 เริ่มต้น $5 จะอยู่ได้นานพอสำหรับทดสอบ ถ้าใช้จริงเตรียม $20-50/เดือน

---

## 4️⃣ Configure Environment (2 นาที)

```bash
cp .env.example .env.local
```

เปิด `.env.local` แก้:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

ส่วนอื่นๆ (LINE, WhatsApp, Omise...) เว้นไว้ก่อน setup ทีหลัง

---

## 5️⃣ Run Development Server (1 นาที)

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

✅ ถ้าเห็นหน้า landing page = สำเร็จ

---

## 6️⃣ ทดลองใช้งาน (15 นาที)

### สมัครบัญชี
1. คลิก **เริ่มต้นฟรี** → กรอก:
   - ชื่อโรงแรม: `Maitri Test Hotel`
   - ชื่อ-สกุล: ของคุณ
   - อีเมล + รหัสผ่าน
2. หลัง signup → ไปยัง dashboard อัตโนมัติ

### เพิ่มห้อง
1. **ห้องพัก** → **เพิ่มประเภท**:
   - Deluxe Room, Max occupancy 2, ราคา 1,500
2. **เพิ่มห้อง**: 101, 102, 103

### ทดลองสร้างการจอง
1. **การจอง** → **จองใหม่**
2. กรอกข้อมูลแขก, วันที่ → บันทึก
3. ดู calendar → เห็น block สีฟ้าปรากฏ

### ทดลอง AI Inbox (ใน Database โดยตรง)
1. Supabase **Table Editor** → `conversations` → **Insert row**:
   - `hotel_id`: copy จาก hotels table
   - `channel`: `webchat`
   - `channel_user_id`: `test-001`
   - `guest_language`: `en`
   - `guest_name`: `Test Guest`
2. `messages` → **Insert row**:
   - `conversation_id`: จาก conversation ที่เพิ่งสร้าง
   - `direction`: `inbound`
   - `sender_type`: `guest`
   - `original_text`: `Hello, what time is check-in tomorrow?`
   - `original_language`: `en`
3. กลับไปที่ **/dashboard/inbox** → คลิก conversation → กด **✨** ให้ AI ตอบ

---

## 🎉 You're Live!

ขั้นถัดไป (เลือกตามต้องการ):

- 📡 [LINE OA](integrations/LINE.md) — รับข้อความจริงจากแขก
- 💬 [WhatsApp Business](integrations/WHATSAPP.md) — สำหรับลูกค้าต่างชาติ
- 💳 [Omise](integrations/OMISE.md) — รับ PromptPay + บัตรเครดิต
- 🌐 [Channel Manager](integrations/CHANNEL_MANAGER.md) — Sync OTA
- 📋 [e-Tax](integrations/ETAX.md) — ใบกำกับภาษีอิเล็กทรอนิกส์
- 🛂 [ทร.30](integrations/TM30.md) — รายงานชาวต่างชาติ
- ☁️ [Vercel Deployment](DEPLOYMENT.md) — push to production

---

## 🐛 Troubleshooting

### "Cannot find module 'next'"
```bash
rm -rf node_modules package-lock.json && npm install
```

### "Supabase connection error"
- ตรวจสอบ URL มี `https://` นำหน้า
- ตรวจสอบ project ไม่ paused (free tier paused หลัง inactive 7 วัน)

### "Auth not working / redirect loop"
- Supabase: **Authentication** → **URL Configuration**
- เพิ่ม `http://localhost:3000` ใน Site URL และ Redirect URLs

### "AI returns null"
- `ANTHROPIC_API_KEY` ไม่มี space/quotes
- ดู Network tab → /api/ai/* — 401 = key ผิด, 429 = rate limit
