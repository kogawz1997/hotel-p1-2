# Omise Payment Gateway Integration

Omise เป็น payment gateway ของไทย รองรับ PromptPay, บัตรเครดิต, internet banking, TrueMoney

## 📊 Pricing Overview

| Method | Fee |
|---|---|
| **PromptPay** | 0.55% (ต่ำที่สุด!) |
| **บัตรเครดิตในไทย** | 2.65% + ฿7 |
| **บัตรเครดิตต่างประเทศ** | 3.65% + ฿7 |
| **Internet Banking** | 0.95% + ฿7 |
| **TrueMoney Wallet** | 1.55% + ฿7 |
| **AliPay/WeChat Pay** | 2.55% |

ไม่มีค่า setup, ไม่มี monthly fee — pay-per-transaction

---

## ขั้นตอน

### 1. สมัคร Omise Account (10 นาที)

1. ไปที่ [omise.co](https://www.omise.co/th) → **Sign Up**
2. กรอกข้อมูล:
   - Business name: ชื่อโรงแรม
   - Business type: **Hospitality / Hotel**
   - เบอร์โทร, อีเมล
3. Verify อีเมล
4. Login เข้า [dashboard.omise.co](https://dashboard.omise.co)

### 2. Submit เอกสาร KYC (5-15 วันทำการ)

ก่อนใช้ live mode ต้อง verify business:

**สำหรับนิติบุคคล:**
- หนังสือรับรองบริษัท (ไม่เกิน 3 เดือน)
- หนังสือบริคณห์สนธิ
- สำเนาบัตรประชาชนกรรมการ
- หน้าสมุดบัญชีธนาคาร (ในนามนิติบุคคล)

**สำหรับบุคคลธรรมดา:**
- สำเนาบัตรประชาชน
- สำเนาทะเบียนพาณิชย์
- หน้าสมุดบัญชีธนาคาร

อัพโหลดที่ Dashboard → **Settings** → **Documents**

### 3. Get API Keys (Test Mode)

ระหว่างรออนุมัติ คุณใช้ **Test Mode** ก่อนได้:

1. Dashboard → **Keys** tab
2. **Test mode** keys (ใช้ทดสอบ ไม่หักเงินจริง):

```bash
OMISE_PUBLIC_KEY=pkey_test_xxx
OMISE_SECRET_KEY=skey_test_xxx
```

ใส่ใน `.env.local`

### 4. Setup Webhook

Omise จะส่ง event มาเมื่อ payment status เปลี่ยน:

1. Dashboard → **Webhooks** → **Create webhook**
2. URL: `https://yourdomain.com/api/webhooks/omise`
3. Events: เลือกทั้งหมด
   - ✅ `charge.create`
   - ✅ `charge.complete`
   - ✅ `charge.expire`
   - ✅ `refund.create`
4. Save

### 5. ทดสอบ Test Mode

#### Test Cards (Omise's official):
| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Decline |
| `4000 0000 0000 0010` | Insufficient funds |
| `5555 5555 5555 4444` | MasterCard success |

CVV: ใส่อะไรก็ได้, Expiry: any future date

#### Test PromptPay:
- ระบบจะ generate QR code (ไม่ใช่ QR จริง)
- Dashboard → **Charges** → กด **Mark as paid** เพื่อจำลองการจ่าย
- หรือใช้ Omise CLI ส่ง webhook test

### 6. Switch to Live Mode

หลัง KYC อนุมัติ:
1. Dashboard → toggle **Live mode** (มุมขวาบน)
2. Get **live keys** (`pkey_live_xxx`, `skey_live_xxx`)
3. Update `.env.local` (production):

```bash
OMISE_PUBLIC_KEY=pkey_live_xxx
OMISE_SECRET_KEY=skey_live_xxx
```

4. Update webhook URL ถ้าต่างจาก test

---

## 💰 PromptPay QR Flow

นี่คือ flow ที่นิยมที่สุดสำหรับโรงแรมไทย:

```
1. แขกจองห้อง → Maitri สร้าง charge
   └─ POST /api/payments/charge
       └─ Omise.charges.create({ amount, currency: 'THB', source: 'promptpay' })
           └─ Returns { qr_code_url }

2. ระบบแสดง QR ให้แขก scan
   └─ React component: <Image src={qr_code_url} />

3. แขก scan ด้วย mobile banking app → จ่ายเงิน

4. Bank → Omise → Webhook ของเรา
   └─ POST /api/webhooks/omise
       └─ Event: charge.complete
       └─ Update payment.status = 'completed'
       └─ Update reservation.paid_amount

5. แขกได้รับ confirmation email อัตโนมัติ
```

QR หมดอายุใน **15 นาที** ถ้าไม่จ่าย — auto-expire

---

## 🔒 Security Best Practices

1. **อย่าใส่ secret key ใน frontend** — ใช้ public key เท่านั้น
2. **Verify webhook signature** — Omise ส่ง `omise-signature` header
3. **Idempotent**: charge เดิมอย่าสร้างซ้ำ — ใช้ `idempotency_key`
4. **Log everything**: เก็บ Omise charge ID + raw response เผื่อ dispute
5. **PCI compliance**: เราไม่เก็บ card number ตรงๆ — ใช้ Omise.js tokenize

---

## 🌍 Currency Support

Omise รองรับ multi-currency:
- THB, USD, JPY, EUR, GBP, SGD, AUD, MYR

Maitri default = THB แต่สามารถปรับ per-charge ได้

---

## 🐛 Troubleshooting

### "invalid_charge: amount is too low"
- Minimum charge: ฿20
- คนน้อยกว่า 20 บาทใช้ free / mark as paid manually

### "QR code not generating"
```javascript
// ตรวจสอบ source param
{ source: 'promptpay' }  // ✅ ถูก
{ source: { type: 'promptpay' } }  // ❌ ผิด (เก่า)
```

### "Webhook delivered แต่ status ยังเป็น pending"
- Omise ส่ง webhook แค่ event แรกที่ subscribe
- ตรวจสอบ webhook subscription รวมถึง `charge.complete` แล้วยัง?
- ดู Omise dashboard → **Webhooks** → **Logs**

### "Refund failed"
- Refund ได้ภายใน 60 วันหลัง charge
- ต้องมี balance พอใน Omise account
- บัตรหมดอายุ → ไม่สามารถ refund ไปยังบัตรเดิม

### Settlement timing
- บัตรเครดิต: T+2 ถึง T+5 เข้าบัญชีธนาคาร
- PromptPay: T+1 (วันถัดไป)
- ตรวจสอบ Dashboard → **Transfers**

---

## 📊 Reconciliation

### รายเดือน
1. Dashboard → **Reports** → **Statement**
2. Download CSV
3. Match กับ Maitri's `payments` table:
   - Match by `gateway_transaction_id`
   - หาความต่าง: fees, refunds, disputes

### Real-time
- Dashboard → **Charges** → real-time list
- Filter by status, date, amount
- Export ได้ตลอด

---

## 💡 Tips for Hotels

1. **PromptPay first**: cheapest fee (0.55%) — ลูกค้าไทยส่วนใหญ่จ่ายด้วยวิธีนี้
2. **Card backup**: บัตรเครดิตสำหรับลูกค้าต่างชาติ
3. **Deposit policy**: เก็บ 30-50% ตอนจอง, ที่เหลือ check-in
4. **Auto-charge**: บันทึกบัตรไว้ (Omise tokens) แล้วเรียกเก็บค่า extras หลัง check-out
5. **No-show policy**: charge full amount จากบัตรที่บันทึกไว้

---

## ✅ Production Checklist

- [ ] KYC approved (เห็น "Verified" ใน dashboard)
- [ ] Live keys ใน production env
- [ ] Webhook ชี้ที่ production URL
- [ ] Webhook signature verification เปิด
- [ ] Bank account verified (เห็นเงินโอนเข้า)
- [ ] Test PromptPay flow ด้วยเงินจริง (฿20)
- [ ] Test refund flow
- [ ] Disable test mode ใน production
- [ ] Monitor first 10 transactions อย่างใกล้ชิด
