# WhatsApp Business API Integration

WhatsApp คือช่องทางหลักของลูกค้าต่างชาติ (ยุโรป, ตะวันออกกลาง, อินเดีย, อเมริกาใต้)

## 📊 Pricing Overview

WhatsApp Business API คิดค่าบริการเป็น **conversation-based**:

| Conversation Type | ราคา (ประมาณ) |
|---|---|
| Service (แขกเริ่มแชท) | **ฟรี** 1,000 conv/mo, แล้ว ~$0.005 |
| Marketing (เราเริ่มแชท) | $0.025-0.05 ต่อ conversation |
| Utility (booking confirmation, etc.) | $0.005-0.015 |

**24-hour window**: หลังแขกส่งข้อความ → คุณตอบกลับฟรี 24 ชม.

---

## ขั้นตอน

### 1. สมัคร Meta Business Account (10 นาที)

1. ไปที่ [business.facebook.com](https://business.facebook.com)
2. **Create Account** → กรอกข้อมูลธุรกิจ
3. **Business Settings** → **Business Info** → กรอกที่อยู่ + เบอร์โทรครบ

### 2. Verify Business (สำคัญ - 5-7 วัน)

ต้อง verify ก่อนถึงจะใช้ API ได้:

1. **Business Settings** → **Security Center** → **Start Verification**
2. Submit:
   - หนังสือรับรองนิติบุคคล (ภาษาอังกฤษหรือมีคำแปล)
   - ใบทะเบียนพาณิชย์
   - เอกสาร utility bill (ค่าน้ำ ค่าไฟ ที่อยู่ตรงกับที่จด)
3. รอผล 5-7 วัน — ผ่านแล้วจะมี ✅ ใน Business

### 3. สร้าง WhatsApp Business App (5 นาที)

1. [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**
2. Type: **Business**
3. Name: ใส่ชื่อ (เช่น "Maitri Hotel WhatsApp")
4. ใน app dashboard → **Add product** → **WhatsApp** → **Setup**

### 4. เพิ่ม Phone Number (10 นาที)

1. WhatsApp → **API Setup** → **Add phone number**
2. ใส่:
   - เบอร์โทร: ใช้เบอร์ที่ **ยังไม่เคยใช้บน WhatsApp** (ถ้าใช้แล้วต้อง delete WhatsApp ก่อน)
   - Display name: ชื่อโรงแรม
   - Category: Travel/Hospitality
3. Verify ผ่าน SMS หรือ phone call
4. เลือก **Display name verification** (อาจใช้เวลา 1-3 วัน)

### 5. Get Credentials

ใน WhatsApp → **API Setup**:

```bash
# WHATSAPP_ACCESS_TOKEN
# Default: temporary token 24 ชม. — สำหรับ production ต้อง create permanent token
WHATSAPP_ACCESS_TOKEN=EAAxxx...

# WHATSAPP_PHONE_NUMBER_ID
# อยู่ใน "From" dropdown ในหน้านี้
WHATSAPP_PHONE_NUMBER_ID=123456789

# WHATSAPP_BUSINESS_ACCOUNT_ID
# อยู่ใน Business Settings → WhatsApp Accounts
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321

# WHATSAPP_VERIFY_TOKEN
# คุณตั้งเอง — string ที่ Meta ใช้ verify webhook (เช่น "maitri_secret_xyz")
WHATSAPP_VERIFY_TOKEN=your_random_secret_string
```

#### สร้าง Permanent Access Token
1. **Business Settings** → **Users** → **System Users** → **Add**
2. Name: `whatsapp-bot`, Role: Admin
3. คลิก system user → **Generate new token**
4. เลือก app → permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
5. **Token expiration**: Never
6. Copy token → ใส่ใน `WHATSAPP_ACCESS_TOKEN`

### 6. Setup Webhook

1. WhatsApp → **Configuration** → **Webhook** → **Edit**
2. **Callback URL**: `https://yourdomain.com/api/webhooks/whatsapp`
3. **Verify token**: ใส่ค่าที่คุณตั้งใน `WHATSAPP_VERIFY_TOKEN`
4. **Verify and save** → Meta ส่ง GET request มาทดสอบ

### 7. Subscribe to Events

ในหน้า Webhook → **Webhook fields** → **Manage**:
- ✅ `messages` (รับข้อความเข้า)
- ✅ `message_status` (delivered, read receipts)

### 8. ทดสอบ

#### Test 1: Send Test Message
ใน WhatsApp → **API Setup** → **Send and receive messages**:
- เพิ่มเบอร์ของคุณเป็น "Test recipient"
- เลือก template **hello_world**
- **Send message** → คุณจะได้รับใน WhatsApp app

#### Test 2: Real Conversation
1. เปิด WhatsApp app บนมือถือคุณ
2. ส่งข้อความใดๆ ไปหาเบอร์ business ของคุณ
3. ใน Maitri dashboard `/dashboard/inbox` → ควรเห็นข้อความ
4. ตอบกลับ → ควรได้รับใน WhatsApp ของคุณ

---

## 📋 Message Templates (สำหรับ Marketing)

WhatsApp อนุญาตให้ส่งหา user ที่ **ไม่ได้แชทกับคุณใน 24 ชม.** เฉพาะผ่าน **approved templates** เท่านั้น

### สร้าง Template
1. **Business Manager** → **WhatsApp Manager** → **Message Templates**
2. **Create Template** → category: **Utility** หรือ **Marketing**
3. ตัวอย่าง template สำหรับโรงแรม:

#### Template: booking_confirmation
```
สวัสดีคุณ {{1}},

การจองของคุณได้รับการยืนยันแล้ว ✅

📅 Check-in: {{2}}
📅 Check-out: {{3}}
🏨 ห้อง: {{4}}
💰 ยอดรวม: {{5}}

รหัสการจอง: {{6}}

ขอบคุณที่เลือก {{7}} เราพร้อมต้อนรับคุณ
```

#### Template: pre_arrival
```
สวัสดีคุณ {{1}}

อีก 1 วันก็ถึงวัน check-in แล้ว 🎉

⏰ Check-in: 14:00 น.
🚗 ที่จอดรถฟรี
📍 {{2}}

มีอะไรอยากให้เตรียมไหมคะ? ตอบกลับได้เลย
```

4. รอ approve (1-24 ชม.) — Meta ตรวจ template

### ส่ง Template
```typescript
// ผ่าน whatsappAdapter ใน src/lib/channels/whatsapp.ts
await whatsappAdapter.sendMessage({
  channelUserId: '+66...',
  type: 'template',
  templateName: 'booking_confirmation',
  templateVariables: {
    1: 'John', 2: '2026-05-15', 3: '2026-05-17',
    4: 'Deluxe Room', 5: '฿3,000', 6: 'BK-1234', 7: 'Maitri Hotel'
  },
  text: '',
});
```

---

## 🌐 Quality Rating

WhatsApp track **คุณภาพการสนทนา**:
- **High** ✅ ส่งได้ unlimited
- **Medium** ⚠️ มี soft limit
- **Low** 🚨 อาจถูก ban

วิธีรักษา:
- ตอบเร็ว (< 5 นาที)
- ไม่สแปม template
- ลด opt-outs (ให้แขก unsubscribe ได้)
- ใช้ category ตรงกับ content

---

## 🐛 Troubleshooting

### "Webhook verification failed"
- ตรวจสอบ `WHATSAPP_VERIFY_TOKEN` ตรงกับที่ใส่ใน Meta
- Webhook URL accessible จาก internet (test ใน browser ก่อน)

### "Message ส่งไม่ได้"
```
Error: (#131030) Phone number not in allowed list
```
→ ใน dev mode ต้อง add recipient เป็น tester ก่อน
→ Production verification เสร็จแล้วถึงส่งหาใครก็ได้

### "Template rejected"
- ภาษาไทย: ใช้ category "Utility" ส่วนใหญ่ได้ผ่าน
- "Marketing" ต้องระวัง wording — Meta strict
- หลีกเลี่ยงคำเช่น "free", "guarantee", "click here"

### "Rate limit"
- Tier 1 (เริ่มต้น): 1,000 conv/วัน
- เพิ่ม tier อัตโนมัติเมื่อ quality high + volume เพิ่ม
- Tier 5: ไม่จำกัด

---

## 💡 Pro Tips

1. **WhatsApp + LINE คู่กัน**: นักท่องเที่ยวต่างชาติเดินทางในไทย ส่วนใหญ่จะใช้ WhatsApp + ติดตั้ง LINE หลังถึง — ระบบเรารองรับทั้งสอง
2. **Template approved ก่อน launch**: ใช้เวลา 24 ชม. — เตรียมให้พร้อมก่อน
3. **เบอร์โรงแรม = เบอร์ WhatsApp Business**: แขกจดเบอร์เดียวกัน
4. **ใช้ Display Name verified**: เพิ่ม trust + ลด spam complaint

---

## ✅ Production Checklist

- [ ] Business verified (✅ green check)
- [ ] Phone number verified
- [ ] Permanent access token created (ไม่ใช้ temporary)
- [ ] Webhook subscribed to `messages` + `message_status`
- [ ] At least 3 templates approved (booking_confirmation, pre_arrival, post_stay)
- [ ] Test กับ tester อย่างน้อย 5 คน
- [ ] Quality rating: Medium → High
- [ ] Monitor Meta Business Manager dashboards
