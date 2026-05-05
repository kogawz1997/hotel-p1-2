# Channel Manager Integration

Channel Manager = ระบบ sync ราคา/ห้องว่าง กับ OTA (Online Travel Agencies) แบบ real-time
ป้องกัน **overbooking** และประหยัดเวลาจาก manual update

## 🎯 2 ทางเลือกหลัก

### Option A: ใช้ Aggregator (แนะนำสำหรับเริ่มต้น) ⚡
**เปิดใช้ภายใน 2-7 วัน** · ค่าใช้จ่าย $30-50/เดือน

| Aggregator | ราคา | OTA ที่รองรับ | แนะนำ |
|---|---|---|---|
| **HotelRunner** | $30-99/mo | 100+ | ⭐⭐⭐⭐⭐ |
| **MyAllocator** | $35-150/mo | 80+ | ⭐⭐⭐⭐ |
| **Cubilis** by Stardekk | $40-120/mo | 60+ | ⭐⭐⭐⭐ |
| **STAAH** | $30-80/mo | 200+ | ⭐⭐⭐⭐ |
| **eZee Centrix** | $40-100/mo | 100+ | ⭐⭐⭐ |

### Option B: Direct Integration 🔌
**ใช้เวลาอนุมัติ 4-16 สัปดาห์** · ฟรี

| OTA | Approval Time | Type | Commission |
|---|---|---|---|
| Booking.com | 4-12 สัปดาห์ | XML push | 15-18% |
| Agoda YCS | 6-16 สัปดาห์ | REST API | 15-18% |
| Airbnb | 2-4 สัปดาห์ | API | 3% + service |
| Expedia | 4-8 สัปดาห์ | XML | 15-25% |

---

## 🚀 Path A: HotelRunner Setup (แนะนำ)

### 1. สมัคร HotelRunner

1. ไปที่ [hotelrunner.com](https://hotelrunner.com) → **Get Started**
2. เลือกแพลน:
   - **Standard**: $30/mo — 1 OTA, 50 rooms
   - **Pro**: $69/mo — unlimited OTA, multi-property
3. Free trial 14 days
4. กรอกข้อมูลโรงแรม

### 2. Connect OTAs ใน HotelRunner

ใน HotelRunner dashboard → **Channels**:

#### Booking.com
1. คลิก **Connect Booking.com**
2. กรอก Booking.com Hotel ID
3. ใน Booking Extranet → **Account → Connectivity**
4. **Connect via Channel Manager** → เลือก HotelRunner
5. Confirm both sides

#### Agoda
1. **Connect Agoda**
2. Agoda Property ID
3. Agoda จะ email confirmation link ไปยังที่อยู่ที่ลงทะเบียน
4. คลิก confirm

#### Airbnb
1. Login Airbnb host account
2. Connect via OAuth
3. Select listings to sync

### 3. Get HotelRunner API Key

HotelRunner → **Settings** → **API**:
```bash
HOTELRUNNER_API_KEY=hr_xxx
HOTELRUNNER_HOTEL_ID=12345
```

### 4. Configure Maitri

```bash
# .env.local
CHANNEL_MANAGER_PROVIDER=hotelrunner
HOTELRUNNER_API_KEY=hr_xxx
HOTELRUNNER_HOTEL_ID=12345
```

### 5. Setup Webhook

HotelRunner ส่ง booking มาที่เรา + เราส่ง availability/rate updates ให้:

#### Inbound (HotelRunner → Maitri)
URL ใน HotelRunner: `https://yourdomain.com/api/webhooks/hotelrunner`

Events:
- `reservation.created` — แขกจองผ่าน OTA
- `reservation.modified`
- `reservation.cancelled`

#### Outbound (Maitri → HotelRunner)
ทำใน background job ทุก 5 นาที (หรือ on-change):
- `inventory.update` — ห้องว่าง
- `rate.update` — ราคา

### 6. Initial Sync

หลังเชื่อม HotelRunner:
1. Maitri dashboard → **Channel Manager** → **Initial Sync**
2. Push ห้องว่าง 90 วันถัดไป
3. Push ราคาทั้งหมด
4. ใช้เวลา 2-5 นาที

✅ จาก HotelRunner สิ่งที่ sync ออกไป → Booking.com, Agoda, Airbnb พร้อมๆ กัน

---

## 🔌 Path B: Direct Integration

### Booking.com Connectivity Partner

#### 1. Apply
1. ไปที่ [connect.booking.com](https://connect.booking.com)
2. **Become a Connectivity Partner**
3. เอกสาร:
   - Company registration
   - Technical proposal (อธิบายว่าระบบรองรับ XML push อะไรบ้าง)
   - Sample XML
4. **Approval timeline**: 4-12 สัปดาห์

#### 2. Develop Integration
Booking.com ใช้ **OTA XML standard** (OTA_HotelResNotifRQ format)

```xml
<?xml version="1.0"?>
<OTA_HotelAvailNotifRQ>
  <AvailStatusMessages HotelCode="12345">
    <AvailStatusMessage>
      <StatusApplicationControl 
        Start="2026-05-15" 
        End="2026-05-15"
        InvTypeCode="DLX"/>
      <BookingLimit>5</BookingLimit>
    </AvailStatusMessage>
  </AvailStatusMessages>
</OTA_HotelAvailNotifRQ>
```

Maitri มี adapter stub พร้อมใน `src/lib/channel-manager/booking-com.ts` — ต้องเติม API endpoints หลังได้ approve

#### 3. Test in Sandbox
Booking ให้ test environment + test properties
- Submit availability
- Receive test bookings
- Confirm modifications/cancellations

#### 4. Production Certification
Booking.com test 12+ scenarios:
- Single room booking
- Multiple rooms
- Modification
- Cancellation
- Refund
- Group booking

ผ่านหมด → certified → connect to live properties

### Agoda YCS

Similar process:
1. [partners.agoda.com](https://partners.agoda.com) → **YCS Integration**
2. Application + technical demo
3. **Approval timeline**: 6-16 สัปดาห์
4. Use REST API + JSON

```http
POST https://ycs.agoda.com/v2/inventory
Authorization: Bearer xxx
Content-Type: application/json

{
  "hotelId": "123",
  "roomTypeId": "DLX",
  "date": "2026-05-15",
  "rate": 1500,
  "available": 3,
  "minStay": 1
}
```

### Airbnb

ง่ายและเร็วที่สุด:
1. [airbnb.com/partner](https://www.airbnb.com/partner) — Software Partner Program
2. Apply (~2-4 weeks)
3. OAuth-based — host login ผูกกับ app เรา
4. REST API

---

## 🔁 Daily Operations

### Inventory Update Flow
```
1. แขกจอง direct → Maitri DB updated
2. Job runs every 5 minutes
3. ตรวจห้องว่างจริง vs ที่เคยส่ง
4. ถ้าต่าง → push update ทุก channel
```

### Booking Pull Flow
```
1. แขกจองผ่าน Booking.com
2. Booking → HotelRunner → webhook → Maitri
3. Maitri:
   ├─ Find/create guest
   ├─ Create reservation (source: 'booking_com')
   └─ Reserve room (status: 'confirmed')
4. Notify staff via dashboard
```

### Rate Updates
- ปรับราคาใน Maitri → auto-push to all channels
- Set "rate parity" — ราคาเท่ากันทุก OTA ตามนโยบายส่วนใหญ่
- หรือ "rate fence" — Booking ราคา X, Agoda ราคา Y (ต่างกันได้)

---

## 📊 Inventory Allocation Strategies

### Strategy 1: Pool Inventory (แนะนำ)
ห้องทั้งหมดเปิดให้ทุก channel — first come first served

```
Total rooms: 30
└─ Booking.com sees: 30
└─ Agoda sees: 30
└─ Airbnb sees: 30
└─ Direct site sees: 30
```

### Strategy 2: Allocated Inventory
แบ่งห้องเฉพาะให้แต่ละ channel

```
Total rooms: 30
├─ Booking.com: 10 (allocated)
├─ Agoda: 10 (allocated)
├─ Airbnb: 5 (allocated)
└─ Direct: 5 (reserved)
```

ดีสำหรับ chain hotels หรือเมื่ออยากกัน room สำหรับ direct

---

## 🐛 Troubleshooting

### Overbooking เกิดขึ้น
สาเหตุ:
1. Sync delay — booking 2 channels พร้อมกัน
2. Manual booking ไม่ได้ update channel
3. Channel manager บั๊ก

แก้:
- ลด sync interval (5 min → 1 min)
- Force sync หลัง direct booking ทันที
- Reduce inventory artificially (ขาย 28 จาก 30)

### Rate ไม่ sync
- ดู HotelRunner activity log
- Force push: dashboard → "Resync Rates"
- ตรวจสอบ rate restrictions (min stay, closed to arrival)

### Booking ไม่เข้า Maitri
- ดู webhook log: Settings → Webhooks → Logs
- ตรวจสอบ Maitri server `console.log` ใน /api/webhooks/hotelrunner
- HotelRunner retry 3 ครั้งภายใน 1 ชม.

---

## 💰 Economics

### โรงแรม 30 ห้อง, 70% occupancy:
- รายได้/เดือน: ~฿630,000 (จาก 630 room nights × ฿1,000)
- ถ้า 60% มาจาก OTA: ~฿378,000 จาก OTA
- Commission 17%: **~฿64,000/เดือน**

ถ้าใช้ direct booking มากขึ้น 10% → ประหยัด ~฿10,000/เดือน

**HotelRunner ($50/mo = ~฿1,800/mo) คุ้มมาก** vs commission ที่เสีย

---

## ✅ Production Checklist

### Phase 1: HotelRunner
- [ ] HotelRunner subscription active
- [ ] เชื่อมอย่างน้อย 1 OTA ทดสอบ
- [ ] Initial sync เสร็จ
- [ ] Webhook endpoints work
- [ ] Test booking ผ่าน OTA → ปรากฏใน Maitri ภายใน 5 นาที
- [ ] Inventory update from Maitri → reflect ใน OTA ภายใน 5 นาที
- [ ] Rate parity verified ทุก channel

### Phase 2: Direct Integration
- [ ] Booking.com Connectivity Partnership approved
- [ ] Agoda YCS approved
- [ ] Sandbox tested
- [ ] Production certified
- [ ] Migrate from HotelRunner → direct (gradual)
- [ ] Monitor for 30 days
- [ ] Decommission HotelRunner (ประหยัด $50/mo)
