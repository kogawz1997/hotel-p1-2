# Accounting Software Integration

เชื่อม Maitri กับโปรแกรมบัญชี — auto-export ใบกำกับ ค่าใช้จ่าย และ payment ไปยังระบบบัญชี

## 📊 Comparison

| Software | Web | Mobile | API | ราคา/เดือน | แนะนำสำหรับ |
|---|---|---|---|---|---|
| **FlowAccount** | ✅ | ✅ | ✅ Public API | ฿199-1,499 | SME ทั่วไป ✨ |
| **PEAK** | ✅ | ✅ | ⚠️ ติดต่อ support | ฿1,290-3,990 | กลางถึงใหญ่ |
| **Express** | ✅ | ❌ | ⚠️ Manual export | ฿890-2,500 | บัญชีคลาสสิก |
| **Xero** | ✅ | ✅ | ✅ Excellent API | $13-70 | International chains |

---

## 🥇 FlowAccount (แนะนำ)

### ทำไมเลือก FlowAccount
- API public + documentation ภาษาอังกฤษดี
- มี webhook
- ราคาถูก (เริ่ม ฿199)
- รองรับ e-Tax invoice ในตัว (แต่ของ FlowAccount เอง)

### Setup

#### 1. สมัคร FlowAccount

1. [flowaccount.com](https://flowaccount.com) → **เริ่มต้นใช้งานฟรี**
2. ทดลองฟรี 30 วัน
3. กรอกข้อมูลบริษัท + Tax ID

#### 2. Subscribe Plan ที่มี API

API access ต้อง **Pro Plan ขึ้นไป** (฿599/mo):
- Pro: 1,000 invoices/mo
- Pro+: 5,000 invoices/mo

#### 3. Get API Token

1. FlowAccount → **Setting** → **API**
2. **Generate Access Token**
3. Copy Token (เก็บไว้ดี - ดูซ้ำไม่ได้)

```bash
# .env.local
ACCOUNTING_PROVIDER=flowaccount
FLOWACCOUNT_API_KEY=fa_xxx
FLOWACCOUNT_COMPANY_ID=xxx  # จาก URL ใน FA dashboard
```

#### 4. Setup Mapping

Maitri → FlowAccount mapping:

| Maitri | FlowAccount |
|---|---|
| `invoices` | Sales Invoice |
| `payments` | Payment Voucher |
| Folio items (extras) | Sales line items |
| `housekeeping_tasks` (cost) | — (อยู่ฝั่ง expense) |

#### 5. Sync Configuration

Maitri dashboard → **Settings** → **Integrations** → **FlowAccount** → Configure:

```typescript
// Auto-sync triggers
- ✅ ทุก 5 นาที check invoices ใหม่
- ✅ Real-time push เมื่อสร้าง invoice
- ✅ Push payment เมื่อ status = completed
- ⚠️ Pull customer list (manual)
```

#### 6. ทดสอบ

1. สร้าง test invoice ใน Maitri
2. รอ 1-5 นาที → ตรวจ FlowAccount ควรเห็น invoice เดียวกัน
3. ตรวจ tax breakdown ตรง
4. ตรวจ customer info match

---

## 🥈 PEAK Account

PEAK API ไม่ public — ต้องติดต่อ support

### Setup

#### 1. สมัคร PEAK
[peakaccount.com](https://peakaccount.com) → ทดลองฟรี

#### 2. Request API Access
- ส่งอีเมลไปที่ support@peakaccount.com
- Subject: "API Integration Request - [ชื่อบริษัท]"
- Body: อธิบายว่าเชื่อมกับระบบไหน, expected volume
- รอ 1-2 สัปดาห์

#### 3. PEAK ให้ API Key + Documentation
```bash
PEAK_API_KEY=peak_xxx
PEAK_COMPANY_ID=xxx
```

#### 4. Configure Maitri
ใน `src/lib/accounting/peak.ts` — adapter พร้อมแล้ว

---

## 🥉 Express

Express ไม่มี modern API — ใช้ **CSV Export/Import** แทน

### Workflow

#### Daily Routine
1. Maitri → **บัญชี → Export Express** → Download CSV
2. เปิด Express → **Import → Sales Invoice**
3. Map columns:
   - Date → `วันที่`
   - Invoice # → `เลขที่`
   - Customer → `ลูกค้า`
   - Amount → `ยอดรวม`
   - VAT → `ภาษี`

#### Limitations
- Manual ทำทุกวัน (ตั้ง cron แค่ export ได้ — import ทำเองใน Express)
- ไม่ real-time
- เสี่ยง human error

แนะนำ: **migrate จาก Express → FlowAccount** ถ้าต้องการ automation

---

## 💼 Xero (สำหรับ international)

### Setup

#### 1. Xero account
[xero.com](https://xero.com) → Subscribe (Starter $13/mo)

#### 2. Create Xero App
1. [developer.xero.com](https://developer.xero.com)
2. **My Apps** → **New app**:
   - Type: **Web app** หรือ **Custom Connection**
   - OAuth 2.0
3. Get Client ID + Secret

```bash
XERO_CLIENT_ID=xxx
XERO_CLIENT_SECRET=xxx
XERO_TENANT_ID=xxx  # ได้หลัง connect
```

#### 3. OAuth Connect
ใน Maitri → **Settings → Integrations → Connect Xero**
- Redirect to Xero auth
- Authorize
- Callback บันทึก tenant_id

#### 4. Configure Mapping
- Account codes (กำหนดใน Xero ก่อน): Sales: `200`, COGS: `300`
- Tax rates: VAT 7% = `OUTPUT-7`

---

## 📋 Daily Sync Checklist

### What to Sync
- ✅ Invoices (sales)
- ✅ Payments received
- ✅ Refunds
- ✅ Customer info (B2B)
- ⚠️ Skip: F&B internal transfers, housekeeping costs

### Frequency
- **Real-time**: Critical events (new invoice, payment)
- **Every 5 min**: Bulk updates
- **Daily**: Customer list, reconciliation
- **Monthly**: P&L, balance sheet (manual review)

---

## 🔄 Reconciliation

### Monthly Check
1. Maitri **Reports** → **Revenue This Month**
2. Accounting **Sales Report** → **Same Month**
3. Compare:

| Metric | Should Match |
|---|---|
| Total invoices | ✅ |
| Total revenue | ✅ |
| VAT collected | ✅ |
| Refunds | ✅ |
| Payment methods breakdown | ⚠️ (อาจต่างเล็กน้อยจาก timing) |

### ถ้ามีต่าง
- ตรวจ invoice ที่หายไป (เกิดใน Maitri แต่ไม่ได้ sync)
- ตรวจ duplicate (sync 2 ครั้ง)
- ตรวจ status: cancelled ใน Maitri แต่ยังอยู่ใน accounting

---

## 🐛 Troubleshooting

### "Token expired"
- FlowAccount: token อายุ 1 ปี — re-generate
- Xero: refresh token auto-renew (ตรวจ logs)
- PEAK: contact support

### "Customer not found in accounting"
- เปิด auto-create customer ใน config
- หรือ pre-create ใน accounting แล้ว map ID

### "Tax rate mismatch"
- Maitri default 7% VAT
- ตรวจ accounting tax rate config ตรงกัน
- ถ้าโรงแรม non-VAT (รายได้น้อยกว่า 1.8M/yr) → set vat_rate = 0

### "Sync stuck pending"
1. Check API quota (FlowAccount มี limit ต่อนาที)
2. Retry queue: `accounting_sync_queue` table
3. Manual force sync: API → **Resync All**

---

## 💡 Best Practices

1. **Same Tax ID**: Maitri → accounting ใช้ Tax ID เดียวกัน
2. **VAT registration**: ลงทะเบียน VAT ก่อน (ภ.พ. 01) ถึงเริ่ม invoice
3. **Chart of accounts**: ตั้งให้ตรง revenue category
   - Room revenue
   - F&B revenue
   - Spa revenue
   - Other income
4. **Year-end**: Export full year data ให้ผู้สอบบัญชี
5. **Audit trail**: เก็บ Maitri data 5 ปี (ตามกฎหมายภาษี)

---

## ✅ Production Checklist

- [ ] เลือก accounting software
- [ ] API credentials configured
- [ ] Mapping config: revenue accounts, tax rates
- [ ] Test sync 5 invoices ผ่าน
- [ ] Real-time sync working
- [ ] Daily reconciliation report set up
- [ ] Train accountant ใช้ระบบใหม่
- [ ] Backup: monthly CSV export เผื่อ
- [ ] Monitor sync queue daily
