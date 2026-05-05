# 🚀 Deploy to Vercel — Step by Step

## ขั้นตอนเชื่อม GitHub → Vercel

### 1. Fork / Push โปรเจคขึ้น GitHub
```bash
git init
git add .
git commit -m "Initial commit — Maitri PMS"
git remote add origin https://github.com/YOUR_USER/maitri.git
git push -u origin main
```

### 2. สร้าง Vercel Project
1. ไป [vercel.com/new](https://vercel.com/new)
2. "Import Git Repository" → เลือก repo ที่เพิ่ง push
3. Framework: **Next.js** (auto-detect)
4. Root Directory: `.` (ไม่ต้องเปลี่ยน)

### 3. ตั้งค่า Environment Variables ใน Vercel
ไปที่ **Project → Settings → Environment Variables** แล้วเพิ่มทีละตัว:

#### Required (ต้องมีก่อน deploy ได้)
| Key | ค่า | Environment |
|-----|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL จาก Supabase Dashboard | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key จาก Supabase | All |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | All |
| `ANTHROPIC_API_KEY` | sk-ant-... จาก console.anthropic.com | All |
| `NEXT_PUBLIC_APP_URL` | https://your-domain.vercel.app | Production |

#### Optional (เพิ่มทีหลังได้)
| Key | บริการ |
|-----|--------|
| `OMISE_SECRET_KEY` + `OMISE_PUBLIC_KEY` | Payment |
| `LINE_CHANNEL_ACCESS_TOKEN` + `LINE_CHANNEL_SECRET` | LINE OA |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp |
| `SENDGRID_API_KEY` | Email |

### 4. ตั้งค่า GitHub Actions Secrets
ไปที่ **GitHub → Repo → Settings → Secrets → Actions**:

| Secret | ค่า | วิธีได้ |
|--------|-----|---------|
| `VERCEL_TOKEN` | Token จาก Vercel | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | จาก `vercel.json` หรือ Vercel Dashboard | Project → Settings |
| `VERCEL_PROJECT_ID` | จาก Vercel Dashboard | Project → Settings → General |

### 5. Deploy!
```bash
git push origin main
# GitHub Actions จะ lint → build → deploy to Vercel อัตโนมัติ
```

## ทดสอบ Build ใน Local ก่อน

```bash
# ใช้ demo keys
cp .env.demo .env.local

npm install
npm run build   # ต้องผ่านโดยไม่มี error
npm run start   # ลองรันบน port 3000
```

## Health Check
หลัง deploy แล้ว ทดสอบที่:
```
GET https://your-domain.vercel.app/api/health
```

ถ้าได้ `{"status":"ok"}` แสดงว่าระบบทำงานปกติ

## Supabase Setup
```bash
# รัน migrations ใน Supabase SQL Editor
# คัดลอกเนื้อหาจาก:
cat supabase/migrations/00001_initial_schema.sql
cat supabase/migrations/00002_production_saas_hardening.sql  
cat supabase/migrations/00003_team_audit_improvements.sql
```
