# Architecture

ระบบ Maitri ออกแบบให้:
- **Multi-tenant** — รองรับโรงแรมหลายแห่งใน DB เดียว
- **Real-time** — ข้อความ, การจอง update ทันที
- **API-first** — ทุก feature เข้าถึงได้ผ่าน API
- **Composable** — channel/payment/accounting เป็น adapter pattern

---

## High-Level Diagram

```
┌────────────────────────────────────────────────────────────┐
│                      External World                         │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────────────┐  │
│  │  Guests  │ │   OTAs   │ │ Banks  │ │  Gov't (RD)    │  │
│  │ (LINE,WA)│ │(Bk,Agoda)│ │ (Omise)│ │  (TM30, etax)  │  │
│  └────┬─────┘ └────┬─────┘ └────┬───┘ └────────┬───────┘  │
└───────┼────────────┼─────────────┼──────────────┼──────────┘
        │ Webhooks   │ HTTP/XML    │ Webhooks     │ HTTPS
        ▼            ▼             ▼              ▼
┌────────────────────────────────────────────────────────────┐
│              Next.js 15 App (Vercel Edge)                  │
│                                                             │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────┐│
│  │ Public Pages   │  │ Dashboard       │  │ API Routes  ││
│  │ - Landing      │  │ - Inbox         │  │ - REST      ││
│  │ - Booking      │  │ - Reservations  │  │ - Webhooks  ││
│  │   Engine       │  │ - Rooms, etc.   │  │ - AI calls  ││
│  └────────────────┘  └─────────────────┘  └─────────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                   Service Layer (lib/)                │ │
│  │  ┌─────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐│ │
│  │  │ AI  │ │Channel │ │Payment │ │Compliance│ │ Acc. ││ │
│  │  │     │ │Adapters│ │Adapters│ │  Service │ │Adapt.││ │
│  │  └─────┘ └────────┘ └────────┘ └─────────┘ └──────┘│ │
│  └──────────────────────────────────────────────────────┘ │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             ▼
┌────────────────────────────────────────────────────────────┐
│              Supabase (Postgres + Auth + Realtime)          │
│  40+ tables · RLS per organization · Realtime subscriptions │
└────────────────────────────────────────────────────────────┘
```

---

## Multi-tenancy

### How It Works

ทุก row มี `organization_id` เป็น foreign key:

```sql
SELECT * FROM hotels WHERE organization_id = 'org-a';

SELECT * FROM reservations
WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = 'org-a');
```

### Row Level Security (RLS)

Postgres enforce automatically:

```sql
CREATE POLICY "Users see only their org's hotels"
ON hotels FOR SELECT
USING (organization_id = auth.user_organization_id());
```

ผลลัพธ์: แม้ developer query ผิด, user A ก็เห็นได้แค่ data ของ org A เท่านั้น

### User Roles

| Role | Permissions |
|---|---|
| `owner` | ทุกอย่าง + billing |
| `admin` | ทุกอย่างยกเว้น billing |
| `manager` | จัดการ ops, การเงิน, รายงาน |
| `front_desk` | จัดการ reservations, inbox, check-in/out |
| `housekeeping` | งานแม่บ้านเท่านั้น |
| `staff` | View-only ส่วนใหญ่ |

---

## Data Model

### Core Entities

```
organizations
    └── hotels (1-many)
         ├── room_types (1-many)
         │    └── rooms (1-many)
         ├── reservations (1-many)
         │    ├── guest (many-1)
         │    ├── folio (1-1)
         │    │    └── folio_items (1-many)
         │    └── payments (1-many)
         ├── conversations (1-many)
         │    └── messages (1-many)
         ├── housekeeping_tasks (1-many)
         ├── invoices (1-many)
         └── tm30_reports (1-many)
```

### Key Design Choices

#### Generated columns
```sql
nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED
balance DECIMAL GENERATED ALWAYS AS (total_charges - paid_amount) STORED
```

#### JSONB for flexibility
```sql
amenities JSONB        -- ["wifi", "pool", "spa"]
preferences JSONB      -- guest preferences
metadata JSONB         -- channel-specific data
```

#### Soft delete
```sql
deleted_at TIMESTAMPTZ
```
ไม่ลบจริง — เก็บไว้สำหรับ audit + recovery

---

## Communication Flow

### Inbound Message (LINE example)

```
1. Guest sends LINE message
       ↓
2. LINE → POST /api/webhooks/line
       ↓
3. Verify HMAC-SHA256 signature
       ↓
4. Parse event → message text + sender
       ↓
5. Find/create conversation
       ↓
6. AI translate (if non-Thai)
       ↓
7. Save message to DB
       ↓
8. Supabase Realtime → push to staff inbox
       ↓
9. Inbox UI shows new message + unread badge
```

### Outbound Message

```
1. Staff types reply in Thai
       ↓
2. (Optional) Click ✨ → /api/ai/suggest-reply
   ├─ Read conversation history
   ├─ Read hotel knowledge base
   ├─ Claude generates reply
   └─ Translate if needed
       ↓
3. Click Send → /api/ai/send-message
   ├─ Translate Thai → guest language (with cultural tone)
   ├─ Channel adapter sends to LINE
   └─ Save outbound message
       ↓
4. LINE delivers to guest
```

---

## AI Layer

### Models Used

| Use Case | Model | Why |
|---|---|---|
| Translation | Claude 3.5 Sonnet | Cultural tone adaptation |
| Reply generation | Claude 3.5 Sonnet | Complex reasoning |
| Sentiment | Claude 3.5 Haiku | Fast + cheap |
| Dynamic pricing | Claude 3.5 Sonnet | Multi-factor analysis |

### Prompt Strategy

Translation example:
```
You are a hotel concierge translator.
Translate this {SOURCE_LANG} message to {TARGET_LANG}.
Adjust tone for cultural appropriateness:
- Japanese: keigo (polite form)
- Chinese: warm but respectful
- German: precise and direct
- Thai: ใช้ "ครับ/ค่ะ" + ความเกรงใจ

Original: {MESSAGE}

Output: just the translation, no explanation.
```

### Cost Optimization

- **Cache common phrases**: "Check-in time", "Wifi password"
- **Use Haiku for sentiment**: 6x cheaper than Sonnet
- **Batch translations**: หลาย messages → 1 API call
- **Skip if same language**: Thai → Thai = no translation

Estimated cost: **฿43,000/mo** สำหรับ 50 hotels (5,000 messages/day)

---

## Channel Adapter Pattern

ทุก communication channel implements interface เดียวกัน:

```typescript
interface ChannelAdapter {
  channelType: 'line' | 'whatsapp' | 'wechat' | 'email';
  verifyWebhook(headers: Headers, body: string): boolean;
  parseEvent(rawEvent: any): InboundMessage[];
  sendMessage(params: SendMessageParams): Promise<SendResult>;
  sendTemplate?(params: TemplateParams): Promise<SendResult>;
  uploadMedia?(file: Buffer): Promise<string>;
}
```

ตอน add channel ใหม่ (เช่น Telegram):
1. สร้าง `src/lib/channels/telegram.ts` implements interface
2. Register ใน `src/lib/channels/index.ts`
3. สร้าง webhook handler ที่ `src/app/api/webhooks/telegram/route.ts`

ส่วนอื่นของระบบไม่ต้องเปลี่ยน

---

## Security

### Authentication
- Supabase Auth (email/password, magic link, OAuth)
- JWT tokens, auto-refresh
- HttpOnly cookies for SSR

### Authorization
- RLS at Postgres level (defense in depth)
- Role-based checks in API routes

### Webhook Security
| Channel | Method |
|---|---|
| LINE | HMAC-SHA256 |
| WhatsApp | SHA-256 + verify token |
| Omise | Signature header |
| Booking.com | IP whitelist + auth |

### Secrets Management
- Development: `.env.local` (gitignored)
- Production: Vercel Environment Variables
- High-sensitivity (e-Tax cert): AWS Secrets Manager

### PDPA Compliance
- Data residency: Singapore (closest to Thailand)
- Encryption at rest: Supabase default
- Encryption in transit: HTTPS everywhere
- Right to delete: soft-delete + 30-day purge

---

## Performance

### Caching Strategy
| Data | Strategy |
|---|---|
| Hotel info, room types | Server cache 5 min |
| Translations (common) | KV store (Vercel KV) |
| AI responses | Log + reuse 24h |
| Channel API responses | Short TTL (10s) |

### Database Optimization
- Indexes: `hotel_id`, `check_in`, `status`, `created_at`
- Connection pooling: Supabase pgBouncer
- Read replicas: Pro plan (when scaling)

### Realtime Subscriptions
- Subscribe only to active conversation
- Unsubscribe on tab close
- Throttle reconnects

---

## Scaling Path

### 0–100 hotels (Year 1)
- Single Supabase Pro instance
- Vercel Pro
- ~$200/mo infrastructure

### 100–1,000 hotels (Year 2)
- Add read replicas
- Move AI calls to background queue (BullMQ + Redis)
- CDN for static assets
- ~$2,000/mo

### 1,000–10,000 hotels (Year 3+)
- Shard by region (Thailand, Vietnam, Indonesia)
- Multiple Supabase projects per region
- ~$15,000+/mo

---

## Decisions & Tradeoffs

### Why Next.js 15?
✅ Server Components → less JS shipped
✅ Full-stack in one codebase
✅ Vercel-native deploy
❌ Cold starts on serverless
→ Mitigation: ใช้ Edge runtime where possible

### Why Supabase (not Firebase / RDS)?
✅ Postgres = relational integrity
✅ Built-in auth, realtime, storage
✅ SQL = familiar to most devs
✅ Open source = no vendor lock
❌ Less mature than Firebase for some features
→ Mitigation: write good docs, test edge cases

### Why Claude (not GPT-4)?
✅ Better at non-English (especially Thai, Japanese)
✅ More instructable for cultural nuance
✅ Anthropic's safety alignment
❌ More expensive than open models
→ Mitigation: cache + batch + use Haiku where possible

### Why Adapter Pattern (vs SDK direct)?
✅ Test with mocks
✅ Swap providers easily (Omise → 2C2P)
✅ Add new channels without touching core
❌ Extra abstraction layer
→ Acceptable: stable interface > tight coupling
