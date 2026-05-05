# e-Tax Invoice Integration

ใบกำกับภาษีอิเล็กทรอนิกส์ — บังคับสำหรับนิติบุคคลที่มียอดขายเกิน 30 ล้านบาท/ปี (2026)
แต่แนะนำใช้ตั้งแต่เริ่ม เพราะลูกค้าธุรกิจ (B2B) ต้องการ

## 📊 Service Provider Comparison

ต้องผ่าน **Service Provider ที่กรมสรรพากรอนุมัติ** เท่านั้น — ไม่สามารถส่งตรงเอง:

| Provider | ราคา/เดือน | ใบ/เดือน | API Quality | แนะนำสำหรับ |
|---|---|---|---|---|
| **INET** | ฿3,000-15,000 | 100-3,000 | ⭐⭐⭐⭐⭐ | โรงแรมขนาดกลาง+ |
| **Frank.co.th** | ฿1,500-8,000 | 100-1,500 | ⭐⭐⭐⭐ | SME, เริ่มต้น |
| **Leceipt** | ฿990-5,990 | 100-2,000 | ⭐⭐⭐ | ราคาประหยัด |
| **Thaiepay** | ฿2,500-10,000 | 100-2,000 | ⭐⭐⭐⭐ | medium |

**Maitri's default integration: INET** (มี documentation ภาษาอังกฤษดีที่สุด)

---

## ขั้นตอน

### 1. เลือก Service Provider

แนะนำ **INET** เพราะ:
- API เสถียร
- Documentation ภาษาอังกฤษ
- Support 24/7
- ครอบคลุมทั้ง e-Tax Invoice + e-Receipt

ไปที่ [etax.inet.co.th](https://etax.inet.co.th) → **Sign Up**

### 2. ขอ Digital Certificate (สำคัญที่สุด - ใช้เวลานานสุด)

ใบกำกับ e-Tax ต้อง **sign ด้วย certificate** จาก CA (Certificate Authority)

#### CA ที่ใช้ได้:
- **TDID** (Thai Digital ID) - แนะนำ
- **CAT TDID**
- **Inet CA**

#### ขั้นตอน TDID:
1. ไปที่ [tdid.co.th](https://www.tdid.co.th) → **Subscriber Service**
2. เลือก:
   - **Type**: Organization Certificate (สำหรับนิติบุคคล)
   - **Class**: 3 (สำหรับ e-Tax)
   - **Validity**: 1 ปี / 2 ปี
3. เอกสาร:
   - หนังสือรับรองนิติบุคคล (ไม่เกิน 6 เดือน)
   - สำเนาบัตรประชาชนกรรมการ
   - หนังสือมอบอำนาจ (ถ้าให้คนอื่นมาเซ็น)
4. ค่าใช้จ่าย: ~฿2,500 (1 ปี) / ~฿4,500 (2 ปี)
5. ระยะเวลา: **3-7 วันทำการ**
6. รับ certificate file (.p12) + password

> 💡 **ห้ามทำหายเด็ดขาด** — backup ไว้ใน secure location

### 3. Submit เอกสารกับ INET (3-5 วันทำการ)

1. INET portal → **Apply for service**
2. กรอก:
   - Tax ID 13 หลัก
   - ชื่อนิติบุคคล (ตามทะเบียน)
   - ที่อยู่ (ตรงกับที่จดทะเบียน VAT)
   - ภาคีอุตสาหกรรม: **โรงแรม / ที่พัก**
3. อัพโหลด:
   - หนังสือรับรองนิติบุคคล
   - ใบ ภ.พ. 20 (ทะเบียนภาษีมูลค่าเพิ่ม)
   - Certificate (.p12) ที่ได้จาก TDID
4. รออนุมัติ — INET จะส่งอีเมลพร้อม credentials

### 4. ลงทะเบียนกับกรมสรรพากร

INET จะช่วยลงทะเบียนให้ — แต่ต้องยืนยันผ่าน:
1. กรมสรรพากร eTax portal: [etax.rd.go.th](https://etax.rd.go.th)
2. Login ด้วย Tax ID + รหัสผ่าน (จาก ภ.พ.)
3. เลือก **Service Provider**: INET
4. Confirm

ระยะเวลา: ~1-2 สัปดาห์ทั้งหมด

### 5. Get API Credentials

หลังอนุมัติ INET จะส่งให้:

```bash
# จาก INET dashboard
ETAX_PROVIDER=inet
ETAX_USERNAME=your_company_id
ETAX_PASSWORD=initial_password  # change ทันทีใน INET portal
ETAX_API_URL=https://etax.inet.co.th/api/v1
ETAX_CERT_PATH=/secure/path/to/cert.p12
ETAX_CERT_PASSWORD=cert_password_from_tdid
```

ใส่ใน `.env.local` (production server เท่านั้น)

> 🔒 **อย่าเก็บ certificate ใน git repo!** — ใช้ Vercel Secrets หรือ AWS Secrets Manager

### 6. ทดสอบ Sandbox

INET มี sandbox environment:
```
ETAX_API_URL=https://etax-sandbox.inet.co.th/api/v1
```

ทดสอบ submit invoice:
```bash
# ใน Maitri dashboard
POST /api/compliance/etax
{
  "reservationId": "uuid-here",
  "buyerName": "บริษัท ABC จำกัด",
  "buyerTaxId": "0123456789012"
}
```

ดู response → ควรได้ `etax_status: 'submitted'` + PDF URL

### 7. Production Switch

หลัง sandbox testing ผ่าน:
1. Update `.env.local`: `ETAX_API_URL=https://etax.inet.co.th/api/v1`
2. ทดสอบ 1 invoice จริง — ตรวจสอบใน eTax portal กรมสรรพากร
3. Monitor 10 invoices แรก อย่างใกล้ชิด

---

## 📄 Document Types

Maitri รองรับ 6 ประเภทเอกสาร:

| Type | Code | When to use |
|---|---|---|
| ใบกำกับภาษี | 388 | ขายห้องพักให้นิติบุคคล (B2B) |
| ใบเสร็จรับเงิน | RECEIPT | ขายให้บุคคลธรรมดา (B2C) |
| ใบกำกับภาษี/ใบเสร็จ | TAX_RECEIPT | ขายห้องพัก + รับเงินวันเดียวกัน |
| ใบลดหนี้ | 81 | คืนเงินบางส่วน |
| ใบเพิ่มหนี้ | 80 | เก็บเพิ่ม (ค่าเสียหาย) |
| ใบแจ้งหนี้ | INVOICE | เรียกเก็บก่อนชำระ |

---

## 🔁 Workflow

```
1. แขก check-out → Maitri สร้าง folio
   └─ Folio รวม: ค่าห้อง + extras + service charge + VAT

2. คลิก "ออกใบกำกับภาษี"
   └─ POST /api/compliance/etax
       └─ src/lib/compliance/index.ts:
           ├─ Build UBL 2.0 XML
           ├─ Sign with digital cert
           └─ Submit to INET API

3. INET → ส่งให้กรมสรรพากร → ส่งกลับ confirmation
   └─ etax_status: 'submitted' → 'approved'
   └─ pdfUrl: signed PDF
   └─ referenceNumber: เลขอ้างอิงกรมสรรพากร

4. Maitri:
   ├─ Email PDF ให้ลูกค้า
   └─ Save in invoices table
```

---

## 📋 Required Fields

แต่ละ invoice ต้องมี (ตาม spec กรมสรรพากร):

### ผู้ขาย (Seller)
- ชื่อนิติบุคคล: ตามทะเบียน
- เลขประจำตัวผู้เสียภาษี: 13 หลัก
- ที่อยู่: ตรงกับที่จดทะเบียน VAT
- เบอร์โทร, อีเมล (optional)

### ผู้ซื้อ (Buyer)
- **บุคคลธรรมดา**: ชื่อ-นามสกุล, ที่อยู่
- **นิติบุคคล**: ชื่อบริษัท, Tax ID 13 หลัก, ที่อยู่ (สำคัญ!)

### รายการ (Line items)
- รายละเอียด (เช่น "ค่าที่พัก 3 คืน")
- จำนวน
- ราคาต่อหน่วย
- ราคารวม
- VAT rate (7%)

### Total
- มูลค่ารวมก่อน VAT (subtotal)
- VAT amount
- มูลค่ารวมทั้งสิ้น

---

## 🐛 Troubleshooting

### "Certificate expired"
- Certificate มีอายุ 1-2 ปี — ต่ออายุก่อนหมด **30 วัน**
- TDID จะแจ้งเตือนผ่านอีเมล
- ขั้นตอนต่ออายุง่ายกว่าครั้งแรก (~1-2 วัน)

### "Invoice rejected: invalid tax ID"
- Buyer Tax ID ต้อง 13 หลัก ไม่มี dash หรือ space
- ตรวจสอบกับกรมพัฒนาธุรกิจการค้า: [datawarehouse.dbd.go.th](https://datawarehouse.dbd.go.th)

### "VAT calculation error"
ระบบเราคำนวณแบบ "VAT included" (ราคารวม VAT แล้ว):
```
subtotal = total / 1.07
vat = total - subtotal
```

ถ้าเจ้าของกิจการอยากแสดงแบบ exclusive (ราคายังไม่รวม VAT):
- แก้ใน `src/lib/compliance/index.ts` → `etaxService.submit()`
- เปลี่ยน `priceIncludesVat: false`

### "Submission timeout"
- INET API ปกติตอบ < 5 วินาที
- ถ้าช้ากว่า 30 วินาที = อาจมีปัญหา
- Retry policy: ระบบเรา retry 3 ครั้ง อัตโนมัติ
- Manual: ดู `invoices.etax_status = 'pending'` แล้วกด "Resubmit"

---

## 🎯 Compliance Tips

1. **เก็บ XML signed ทุกใบ**: เผื่อกรมสรรพากรขอตรวจสอบย้อนหลัง 5 ปี
2. **Backup certificate**: secure location + password-protected
3. **VAT registration**: ต้องลงทะเบียน VAT ก่อน (ภ.พ. 01)
4. **ภ.พ. 30 รายเดือน**: ส่งภายในวันที่ 15 ของเดือนถัดไป — ระบบเราช่วย generate
5. **ใบแก้ไข**: ถ้าออกผิด ไม่สามารถแก้ — ต้องออก "ใบลดหนี้" ทดแทน

---

## ✅ Production Checklist

- [ ] Tax ID 13 หลักถูกต้อง
- [ ] VAT registration (ภ.พ. 20) มี
- [ ] Digital certificate valid (ดูวันหมดอายุ)
- [ ] INET service active
- [ ] Sandbox tested ผ่านอย่างน้อย 5 ใบ
- [ ] Production credential ตั้งค่าใน secrets manager
- [ ] Email template สำหรับส่ง PDF ให้ลูกค้า
- [ ] Backup strategy สำหรับ certificate
- [ ] Calendar reminder: ต่ออายุ certificate -30 วัน
- [ ] Monitor INET dashboard รายสัปดาห์

---

## 💰 Cost Calculator

โรงแรม 30 ห้อง × 70% occupancy × 30 วัน = ~630 ใบ/เดือน

| Provider | Plan ที่เหมาะ | ค่าใช้จ่าย |
|---|---|---|
| INET Standard | 1,000 ใบ | ฿6,000/เดือน |
| Frank Pro | 1,500 ใบ | ฿4,500/เดือน |
| Leceipt Pro | 2,000 ใบ | ฿3,990/เดือน |

+ Certificate: ฿2,500/ปี
+ Setup fee: บางที่มี ~฿5,000 (ครั้งเดียว)

**Total Year 1: ~฿55,000-77,000**
