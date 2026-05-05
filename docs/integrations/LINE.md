# LINE Official Account Integration

LINE คือช่องทางหลักของลูกค้าไทย — guide นี้จะพาคุณ setup ให้เสร็จใน ~30 นาที

## 📊 Pricing Overview

| Plan | ราคา/เดือน | Free messages | เหมาะกับ |
|---|---|---|---|
| Free | ฿0 | 200/เดือน | ทดสอบ |
| Light | ฿1,200 | 5,000 | โรงแรมเล็ก-กลาง |
| Standard | ฿4,000 | 25,000 | โรงแรมที่ active |

> 💡 Reply messages (ตอบกลับใน 1 ชั่วโมงหลังแขกส่ง) — **ฟรีทุกแพลน** ใช้ไม่หมด quota

---

## ขั้นตอน

### 1. สมัคร LINE Official Account (5 นาที)

1. เปิด [manager.line.biz](https://manager.line.biz) → **เริ่มสร้าง Account ฟรี**
2. Login ด้วย LINE account ของคุณ (ส่วนตัว ok)
3. กรอกข้อมูลโรงแรม:
   - **ชื่อบัญชี**: ชื่อโรงแรม (เช่น "Lanna Heritage Hotel")
   - **ประเภท**: เลือก **โรงแรม / ที่พัก**
   - **อีเมล**: ใช้อีเมลธุรกิจ
4. ตรวจสอบและยืนยัน → จะได้ **Premium ID** ที่ขึ้นต้นด้วย `@`

### 2. Verify Account (Optional แต่แนะนำ)

Verified Account จะมี ✅ สีเขียว — เพิ่มความน่าเชื่อถือ

1. Manager → **Settings** → **Account verification**
2. Submit เอกสาร:
   - ทะเบียนพาณิชย์ / ทะเบียนนิติบุคคล
   - บัตรประชาชนเจ้าของ
   - หลักฐานสถานประกอบการ
3. รออนุมัติ 5-10 วันทำการ

### 3. สมัคร LINE Developers Console (5 นาที)

LINE OA = สำหรับ marketing
LINE Developers = สำหรับ API

1. เปิด [developers.line.biz](https://developers.line.biz/console/) → Login ด้วย LINE
2. **Create new provider** → ใส่ชื่อ (เช่น "Maitri Hotel")
3. **Create new channel** → เลือก **Messaging API**
4. กรอก:
   - Channel name: ชื่อโรงแรม
   - Channel description: "Hotel guest communication"
   - Category: **Travel/Transportation/Lodging**
   - Subcategory: **Hotel/Lodging**
   - Email: ของคุณ
5. ✅ ยอมรับ ToS → **Create**

### 4. Link OA กับ Channel

ตอนนี้คุณมี 2 อย่าง: OA (จากขั้น 1) และ Channel (จากขั้น 3) — ต้องเชื่อมกัน

1. ใน Developers Console → channel ที่เพิ่งสร้าง
2. Tab **Messaging API** → ลงไปที่ **LINE Official Account features**
3. คลิก **Edit** ข้าง "Auto-reply messages" → ปิด (เพื่อให้ระบบเราตอบเอง)
4. คลิก **Edit** ข้าง "Greeting messages" → ปรับข้อความต้อนรับ

### 5. Get API Credentials

ใน Developers Console → channel → **Messaging API** tab:

```bash
# LINE_CHANNEL_ACCESS_TOKEN
# กดปุ่ม "Issue" ใต้ "Channel access token (long-lived)"
LINE_CHANNEL_ACCESS_TOKEN=eyJxxx...

# LINE_CHANNEL_SECRET
# อยู่ใต้ "Basic settings" tab
LINE_CHANNEL_SECRET=abc123...
```

ใส่ลงใน `.env.local`

### 6. Setup Webhook

ตรงนี้สำคัญที่สุด — บอก LINE ให้ส่งข้อความมาที่ระบบเรา

#### Local Development (ใช้ ngrok)

ขณะ dev local, LINE servers ยังเข้า `localhost:3000` ไม่ได้ ต้องใช้ tunnel:

```bash
# Install ngrok
brew install ngrok  # หรือดาวน์โหลดจาก ngrok.com

# Run ngrok เปิด tunnel
ngrok http 3000

# จะได้ URL เช่น https://abc123.ngrok-free.app
```

#### Production
ใช้ domain จริง: `https://yourdomain.com`

#### ตั้ง Webhook ใน LINE
1. Developers Console → channel → **Messaging API** tab
2. **Webhook URL**: `https://YOUR_URL/api/webhooks/line`
3. **Verify** → ควรขึ้น "Success"
4. เปิด **Use webhook** ✅

### 7. ทดสอบ

1. Manager → **Add friend** → scan QR หรือเพิ่ม `@your_oa_id`
2. ส่งข้อความใดๆ ในแชท เช่น "สวัสดีครับ"
3. ใน Maitri dashboard → `/dashboard/inbox` → ควรเห็นข้อความขึ้นภายใน ~3 วินาที
4. ตอบกลับจาก dashboard → ดูใน LINE app ว่าได้รับ

---

## 🌐 Multi-language Strategy

ระบบจะแปลให้อัตโนมัติ:

```
แขกชาวจีน:     "可以晚一点退房吗？"
       ↓ Translate to Thai
Inbox แสดง:    "ขอ check-out สายๆ ได้ไหม?"
       ↓ พนักงานตอบเป็นภาษาไทย
       ↓ Translate to Chinese (ปรับโทนสุภาพแบบจีน)
ส่งให้แขก:     "您好,我们可以延长退房至14:00,请问您方便吗?"
```

ภาษาที่รองรับ: ไทย, อังกฤษ, จีน (กลาง), ญี่ปุ่น, เกาหลี, รัสเซีย, ฝรั่งเศส, เยอรมัน, สเปน, อาหรับ, ฮินดี, เวียดนาม, อินโดนีเซีย, มาเลย์

---

## 🔒 Security

Webhook ของเรา verify ด้วย **HMAC-SHA256 signature**:
- LINE ส่ง `x-line-signature` header
- Code ใน `src/app/api/webhooks/line/route.ts` ตรวจสอบทุก request
- ถ้า signature ไม่ตรง → reject 401

ป้องกันคนปลอม webhook ส่งข้อความ spam

---

## 📊 LINE Login (Optional - Future)

ถ้าอยากให้แขก login ด้วย LINE บน booking engine:

1. Developers Console → **Create channel** → **LINE Login**
2. Enable scopes: `profile`, `openid`
3. Callback URL: `https://yourdomain.com/auth/callback/line`
4. Add to Maitri: `LINE_LOGIN_CHANNEL_ID`, `LINE_LOGIN_CHANNEL_SECRET`

ฟีเจอร์นี้ยังไม่ได้ implement — Phase 2

---

## 🐛 Troubleshooting

### "Webhook verification failed"
- ตรวจสอบ URL ตรงเป๊ะๆ (ไม่มี trailing slash)
- ตรวจสอบ server กำลัง run อยู่
- ngrok URL เปลี่ยนทุก session — ต้องอัพเดตใหม่
- ดู ngrok web interface (http://localhost:4040) เห็น request เข้าหรือเปล่า

### "ส่งข้อความเข้ามาแล้วไม่เห็นใน inbox"
1. ตรวจสอบ Server logs: `console.log` ใน `webhooks/line/route.ts`
2. ตรวจสอบ Webhook ใน LINE Developer Console — มี "Last delivery" หรือยัง
3. ตรวจสอบ DB: ใน Supabase → `messages` table มี row ใหม่หรือไม่

### "Signature verification failed"
- `LINE_CHANNEL_SECRET` คัดมาผิด (เช่น มีช่องว่าง)
- Reset key ใน LINE Console แล้วใส่ใหม่

### "Reply ส่งกลับไม่ได้"
- ตรวจสอบ `LINE_CHANNEL_ACCESS_TOKEN` ถูกต้อง
- ใช้ long-lived token ไม่ใช่ short-lived
- Token หมดอายุ? Issue ใหม่
- ดู error message ใน console

### "Bot ตอบทุกครั้งซ้อนกัน"
- ปิด **Auto-reply** ใน LINE Manager (ขั้นที่ 4 ข้อ 3)

---

## ✅ Production Checklist

- [ ] LINE OA verified (มี ✅ สีเขียว)
- [ ] Webhook URL เป็น production domain (ไม่ใช่ ngrok)
- [ ] HTTPS enabled (Vercel auto)
- [ ] Auto-reply OFF
- [ ] Greeting message customized
- [ ] Rich menu setup (optional)
- [ ] Test กับ ผู้ใช้จริงอย่างน้อย 5 คน
- [ ] Monitor `messages` table มี data ไหลเข้า
- [ ] AI translation accuracy > 90% (ทดสอบ 14 ภาษา)
