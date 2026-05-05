'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/components/providers/theme-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { type Locale, LOCALES } from '@/lib/i18n/translations';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Sun, Moon, Monitor, Globe, Zap, Shield, Bell, Palette,
  MessageSquare, CreditCard, Globe2, BarChart3, Sparkles,
  Check, X, ChevronRight, Activity, Wifi, WifiOff, Settings2,
  Lock, Unlock, Eye, EyeOff, Copy, RefreshCw, ExternalLink,
  Image as ImageIcon, Building2, Users, FileText, Radio,
  LineChart, ShoppingBag, Heart, Megaphone, Layers,
  ToggleLeft, ToggleRight,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Feature {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  plan?: 'starter' | 'standard' | 'pro' | 'enterprise';
  badge?: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  connected: boolean;
  status: 'active' | 'error' | 'pending' | 'inactive';
  envKey: string;
  docsUrl: string;
  testable: boolean;
}

/* ─── Mock/Demo key store ────────────────────────────────────────────────── */
const DEMO_KEYS: Record<string, string> = {
  ANTHROPIC_API_KEY:            'sk-ant-demo-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  OMISE_SECRET_KEY:             'skey_test_demo_xxxxxxxxxxxxxxxxxxxxxxxx',
  OMISE_PUBLIC_KEY:             'pkey_test_demo_xxxxxxxxxxxxxxxxxxxxxxxx',
  OMISE_WEBHOOK_SECRET:         'demo_webhook_secret_omise_xxxxxxxxxxxxx',
  LINE_CHANNEL_ACCESS_TOKEN:    'demo_line_access_token_xxxxxxxxxxxxxxxx',
  LINE_CHANNEL_SECRET:          'demo_line_secret_xxxxxxxxxxxxxxxxxxxx',
  WHATSAPP_ACCESS_TOKEN:        'demo_whatsapp_access_xxxxxxxxxxxxxxxxxxx',
  WHATSAPP_PHONE_NUMBER_ID:     '1234567890123456',
  WHATSAPP_VERIFY_TOKEN:        'demo_verify_token_maitri',
  SENDGRID_API_KEY:             'SG.demo_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  BOOKING_COM_WEBHOOK_TOKEN:    'demo_booking_com_token_xxxxxxxxxxxxxxxx',
  AGODA_WEBHOOK_TOKEN:          'demo_agoda_token_xxxxxxxxxxxxxxxxxxxxxxx',
  NEXT_PUBLIC_SUPABASE_URL:     'https://demo-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.DEMO',
  SUPABASE_SERVICE_ROLE_KEY:    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SERVICE_DEMO',
  ETAX_USERNAME:                'demo@etax.example.com',
  ETAX_PASSWORD:                'demo_etax_password',
  FLOWACCOUNT_API_KEY:          'demo_flowaccount_key_xxxxxxxxxxxxxxxx',
  PEAK_API_KEY:                 'demo_peak_api_key_xxxxxxxxxxxxxxxxxxxxxx',
};

/* ─── Data ───────────────────────────────────────────────────────────────── */
const FEATURES: Feature[] = [
  { id: 'ai_reply', label: 'AI ตอบข้อความ', description: 'Claude ช่วย suggest และตอบข้อความแขกอัตโนมัติ 14 ภาษา', icon: Sparkles, enabled: true, plan: 'pro', badge: 'AI' },
  { id: 'ai_pricing', label: 'Dynamic Pricing AI', description: 'ปรับราคาอัตโนมัติตาม occupancy, วันหยุด, คู่แข่ง', icon: LineChart, enabled: false, plan: 'pro', badge: 'AI' },
  { id: 'ai_sentiment', label: 'Sentiment Analysis', description: 'วิเคราะห์อารมณ์แขก ตรวจจับข้อความที่ต้องการความเร่งด่วน', icon: Heart, enabled: true, plan: 'pro', badge: 'AI' },
  { id: 'booking_engine', label: 'Public Booking Engine', description: 'หน้าจองออนไลน์ที่แชร์ได้ เชื่อมกับ rate calendar', icon: ShoppingBag, enabled: true, plan: 'standard' },
  { id: 'housekeeping', label: 'Housekeeping Board', description: 'Kanban board จัดงานแม่บ้าน อัพเดทสถานะห้องอัตโนมัติ', icon: Layers, enabled: true, plan: 'standard' },
  { id: 'loyalty', label: 'Loyalty Program', description: 'คะแนนสะสม tier ระบบสมาชิก VIP', icon: Heart, enabled: false, plan: 'pro' },
  { id: 'marketing', label: 'Marketing Campaigns', description: 'ส่ง email/LINE broadcast ตามกลุ่มเป้าหมาย', icon: Megaphone, enabled: false, plan: 'pro' },
  { id: 'fb', label: 'F&B Management', description: 'จัดการเมนู รับออเดอร์ สั่งอาหารห้อง', icon: ShoppingBag, enabled: false, plan: 'enterprise' },
  { id: 'spa', label: 'Spa Booking', description: 'จองสปา นวด นักบำบัด', icon: Heart, enabled: false, plan: 'enterprise' },
  { id: 'tm30', label: 'TM30 Auto-report', description: 'รายงานแขกต่างชาติให้ Immigration อัตโนมัติ', icon: Shield, enabled: true, plan: 'pro' },
  { id: 'etax', label: 'e-Tax Invoice', description: 'ออกใบกำกับภาษีอิเล็กทรอนิกส์ส่งกรมสรรพากร', icon: FileText, enabled: false, plan: 'pro' },
  { id: 'multi_hotel', label: 'Multi-Property', description: 'จัดการหลาย property จาก dashboard เดียว', icon: Building2, enabled: false, plan: 'enterprise' },
];

const INTEGRATIONS: Integration[] = [
  // AI
  { id: 'anthropic', name: 'Anthropic Claude', description: 'AI translation, reply generation, sentiment analysis', category: 'AI', icon: '🤖', color: 'from-orange-500 to-amber-600', connected: false, status: 'inactive', envKey: 'ANTHROPIC_API_KEY', docsUrl: 'https://console.anthropic.com', testable: true },
  // Payment
  { id: 'omise', name: 'Omise', description: 'PromptPay, บัตรเครดิต, QR payment', category: 'Payment', icon: '💳', color: 'from-blue-500 to-cyan-600', connected: false, status: 'inactive', envKey: 'OMISE_SECRET_KEY', docsUrl: 'https://omise.co', testable: true },
  // Messaging
  { id: 'line', name: 'LINE OA', description: 'รับ-ส่งข้อความ LINE Official Account', category: 'Messaging', icon: '💬', color: 'from-green-500 to-emerald-600', connected: false, status: 'inactive', envKey: 'LINE_CHANNEL_ACCESS_TOKEN', docsUrl: 'https://developers.line.biz', testable: true },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Meta WhatsApp Business API', category: 'Messaging', icon: '📱', color: 'from-green-600 to-teal-600', connected: false, status: 'inactive', envKey: 'WHATSAPP_ACCESS_TOKEN', docsUrl: 'https://business.facebook.com', testable: false },
  { id: 'sendgrid', name: 'SendGrid', description: 'Transactional email — confirmation, invites', category: 'Email', icon: '📧', color: 'from-blue-600 to-indigo-600', connected: false, status: 'inactive', envKey: 'SENDGRID_API_KEY', docsUrl: 'https://sendgrid.com', testable: true },
  // OTA
  { id: 'booking_com', name: 'Booking.com', description: 'Direct webhook integration (partner required)', category: 'OTA', icon: '🏨', color: 'from-sky-500 to-blue-600', connected: false, status: 'pending', envKey: 'BOOKING_COM_WEBHOOK_TOKEN', docsUrl: 'https://partner.booking.com', testable: false },
  { id: 'agoda', name: 'Agoda YCS', description: 'Agoda yield & channel system', category: 'OTA', icon: '🏯', color: 'from-red-500 to-rose-600', connected: false, status: 'pending', envKey: 'AGODA_WEBHOOK_TOKEN', docsUrl: 'https://ycs.agoda.com', testable: false },
  // Accounting
  { id: 'flowaccount', name: 'FlowAccount', description: 'Thai accounting software — invoices, payments', category: 'Accounting', icon: '📊', color: 'from-purple-500 to-violet-600', connected: false, status: 'inactive', envKey: 'FLOWACCOUNT_API_KEY', docsUrl: 'https://flowaccount.com', testable: false },
  { id: 'peak', name: 'PEAK', description: 'Thai accounting and inventory management', category: 'Accounting', icon: '📋', color: 'from-teal-500 to-cyan-600', connected: false, status: 'inactive', envKey: 'PEAK_API_KEY', docsUrl: 'https://peakaccount.com', testable: false },
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80&auto=format', // pool villa
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&auto=format', // hotel pool
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80&auto=format', // hotel room
];

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function SystemPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const [activeTab, setActiveTab] = useState<'features' | 'integrations' | 'appearance' | 'notifications' | 'security' | 'demo'>('features');
  const [features, setFeatures] = useState(FEATURES);
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [heroImg, setHeroImg] = useState(0);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('terracotta');
  const [denseMode, setDenseMode] = useState(false);
  const [animationsOn, setAnimationsOn] = useState(true);
  const [sidebarBg, setSidebarBg] = useState<'default' | 'image' | 'gradient'>('default');

  // Rotate hero image
  useEffect(() => {
    const t = setInterval(() => setHeroImg(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  function toggleFeature(id: string) {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    const feat = features.find(f => f.id === id);
    toast.success(feat?.enabled ? `ปิด ${feat.label}` : `เปิด ${feat?.label}`);
  }

  async function testIntegration(integ: Integration) {
    setTestingId(integ.id);
    await new Promise(r => setTimeout(r, 1500));
    const ok = DEMO_KEYS[integ.envKey]?.startsWith('sk-ant') || integ.id === 'line' || integ.id === 'omise' || integ.id === 'sendgrid';
    setTestingId(null);
    if (ok) {
      toast.success(`${integ.name}: เชื่อมต่อสำเร็จ ✓`);
      setIntegrations(prev => prev.map(i => i.id === integ.id ? { ...i, connected: true, status: 'active' } : i));
    } else {
      toast.error(`${integ.name}: กรุณาตั้งค่า API key ก่อน`);
    }
  }

  const TABS = [
    { id: 'features', label: 'ฟีเจอร์', icon: Zap },
    { id: 'integrations', label: 'เชื่อมต่อ', icon: Globe2 },
    { id: 'appearance', label: 'รูปแบบ', icon: Palette },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'security', label: 'ความปลอดภัย', icon: Shield },
    { id: 'demo', label: '🔑 Demo Keys', icon: Settings2 },
  ] as const;

  const enabledCount = features.filter(f => f.enabled).length;
  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero banner ── */}
      <div className="relative h-52 md:h-64 overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === heroImg ? 1 : 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-background" />
          </div>
        ))}
        <div className="absolute inset-0 flex items-end pb-6 px-6 md:px-8">
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <div className="status-dot online" />
              <span className="text-xs text-white/70 uppercase tracking-widest">System Control</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-medium text-white tracking-tight">
              {t('system.title')}
            </h1>
            <p className="text-sm text-white/70 mt-1">{t('system.subtitle')}</p>
          </div>
        </div>

        {/* Status pills */}
        <div className="absolute top-4 right-4 flex gap-2 animate-slide-right">
          <StatusPill label={`${enabledCount} features`} color="emerald" />
          <StatusPill label={`${connectedCount} connected`} color="sky" />
        </div>

        {/* Hero dot navigation */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {HERO_IMAGES.map((_, i) => (
            <button key={i} onClick={() => setHeroImg(i)}
              className={cn('h-1.5 rounded-full transition-all', i === heroImg ? 'w-6 bg-white' : 'w-1.5 bg-white/40')} />
          ))}
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex gap-0 overflow-x-auto scrollbar-thin">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all',
                    active
                      ? 'border-accent text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">

        {/* ──── FEATURES TAB ──── */}
        {activeTab === 'features' && (
          <div className="animate-fade-in">
            <SectionHeader
              title="ฟีเจอร์และโมดูล"
              subtitle="เปิด/ปิดฟีเจอร์ตามแผนการใช้งาน การเปลี่ยนแปลงมีผลทันที"
            />

            {/* Group by plan */}
            {(['starter','standard','pro','enterprise'] as const).map(plan => {
              const planFeatures = features.filter(f => (f.plan || 'starter') === plan);
              if (!planFeatures.length) return null;
              const planColors = {
                starter: 'text-muted-foreground border-border',
                standard: 'text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900',
                pro: 'text-accent border-accent/30',
                enterprise: 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
              };
              return (
                <div key={plan} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={cn('text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border', planColors[plan])}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </span>
                    <div className="hairline flex-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {planFeatures.map((feat, i) => (
                      <FeatureCard
                        key={feat.id}
                        feature={feat}
                        onToggle={() => toggleFeature(feat.id)}
                        delay={i * 50}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ──── INTEGRATIONS TAB ──── */}
        {activeTab === 'integrations' && (
          <div className="animate-fade-in">
            <SectionHeader
              title="การเชื่อมต่อแอพ"
              subtitle="เชื่อมต่อ API และบริการภายนอก กดทดสอบเพื่อตรวจสอบการเชื่อมต่อ"
            />

            {['AI','Payment','Messaging','Email','OTA','Accounting'].map(cat => {
              const catInteg = integrations.filter(i => i.category === cat);
              return (
                <div key={cat} className="mb-8">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <span>{cat}</span>
                    <div className="hairline flex-1" />
                    <span className="text-muted-foreground/60 normal-case tracking-normal font-normal">
                      {catInteg.filter(i => i.connected).length}/{catInteg.length} เชื่อมต่อ
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {catInteg.map((integ, i) => (
                      <IntegrationCard
                        key={integ.id}
                        integration={integ}
                        testing={testingId === integ.id}
                        onTest={() => testIntegration(integ)}
                        delay={i * 50}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ──── APPEARANCE TAB ──── */}
        {activeTab === 'appearance' && (
          <div className="animate-fade-in space-y-6">
            <SectionHeader title="รูปแบบและธีม" subtitle="ปรับแต่งหน้าตาให้ตรงกับ branding โรงแรมของคุณ" />

            {/* Theme */}
            <SettingCard title="โหมดสี" subtitle="เลือกธีมสว่างหรือมืดตามความต้องการ" icon={Palette}>
              <div className="flex gap-3">
                {([
                  { value: 'light', icon: Sun, label: 'สว่าง' },
                  { value: 'dark', icon: Moon, label: 'มืด' },
                  { value: 'system', icon: Monitor, label: 'ตามระบบ' },
                ] as const).map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        theme === opt.value
                          ? 'border-accent bg-accent/5 text-accent'
                          : 'border-border hover:border-accent/50 text-muted-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{opt.label}</span>
                      {theme === opt.value && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </SettingCard>

            {/* Language */}
            <SettingCard title="ภาษา Interface" subtitle="ภาษาที่ใช้แสดงในระบบ (ไม่กระทบภาษาของแขก)" icon={Globe}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.entries(LOCALES) as [Locale, typeof LOCALES[Locale]][]).map(([code, info]) => (
                  <button
                    key={code}
                    onClick={() => setLocale(code)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-sm',
                      locale === code
                        ? 'border-accent bg-accent/5 text-foreground font-medium'
                        : 'border-border hover:border-accent/50 text-muted-foreground'
                    )}
                  >
                    <span className="text-xl">{info.flag}</span>
                    <span>{info.label}</span>
                    {locale === code && <Check className="h-3 w-3 ml-auto text-accent" />}
                  </button>
                ))}
              </div>
            </SettingCard>

            {/* Accent Color */}
            <SettingCard title="สีหลัก (Accent)" subtitle="สีที่ใช้กับปุ่มและองค์ประกอบสำคัญ" icon={Palette}>
              <div className="flex gap-3 flex-wrap">
                {[
                  { id: 'terracotta', label: 'Terracotta', bg: '#C66A30' },
                  { id: 'sage', label: 'Sage', bg: '#7A8471' },
                  { id: 'gold', label: 'Gold', bg: '#B8956A' },
                  { id: 'ocean', label: 'Ocean', bg: '#2563EB' },
                  { id: 'forest', label: 'Forest', bg: '#16a34a' },
                  { id: 'rose', label: 'Rose', bg: '#e11d48' },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setAccentColor(c.id); toast.success(`เปลี่ยนสีเป็น ${c.label}`); }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium',
                      accentColor === c.id ? 'border-foreground' : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <span className="h-4 w-4 rounded-full" style={{ background: c.bg }} />
                    {c.label}
                    {accentColor === c.id && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </SettingCard>

            {/* Sidebar background */}
            <SettingCard title="พื้นหลัง Sidebar" subtitle="ปรับแต่งลักษณะของแถบนำทางด้านข้าง" icon={Layers}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'default' as const, label: 'ค่าเริ่มต้น', preview: 'bg-card border border-border', style: undefined as any },
                  { id: 'gradient' as const, label: 'Gradient', preview: 'bg-gradient-to-b from-espresso to-[#1a1410]', style: undefined as any },
                  { id: 'image' as const, label: 'รูปภาพโรงแรม', preview: 'bg-cover bg-center', style: { backgroundImage: `url(${HERO_IMAGES[0]})` } as any },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSidebarBg(opt.id); toast.success(`เปลี่ยน Sidebar เป็น ${opt.label}`); }}
                    className={cn(
                      'relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4]',
                      sidebarBg === opt.id ? 'border-accent' : 'border-border hover:border-accent/50'
                    )}
                  >
                    <div className={cn('absolute inset-0', opt.preview)} style={(opt as any).style} />
                    <div className="absolute inset-0 flex items-end p-2">
                      <span className="text-xs font-medium bg-black/50 text-white px-2 py-0.5 rounded-md backdrop-blur">
                        {opt.label}
                      </span>
                    </div>
                    {sidebarBg === opt.id && (
                      <div className="absolute top-2 right-2 h-5 w-5 bg-accent rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </SettingCard>

            {/* Display toggles */}
            <SettingCard title="การแสดงผล" subtitle="ปรับความหนาแน่นและเอฟเฟกต์" icon={Monitor}>
              <div className="space-y-4">
                <ToggleRow
                  label="โหมดกระชับ (Dense)"
                  description="แสดงข้อมูลได้มากขึ้น ลด padding"
                  enabled={denseMode}
                  onToggle={() => { setDenseMode(v => !v); toast.success(!denseMode ? 'เปิด Dense Mode' : 'ปิด Dense Mode'); }}
                />
                <ToggleRow
                  label="แอนิเมชัน"
                  description="transitions และ motion effects ทั้งหมด"
                  enabled={animationsOn}
                  onToggle={() => { setAnimationsOn(v => !v); toast.success(!animationsOn ? 'เปิดแอนิเมชัน' : 'ปิดแอนิเมชัน'); }}
                />
              </div>
            </SettingCard>

            {/* Hotel branding images */}
            <SettingCard title="รูปภาพโรงแรม" subtitle="อัปโหลดรูปภาพสำหรับใช้ใน Dashboard และ Booking Engine" icon={ImageIcon}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'โลโก้', hint: 'SVG หรือ PNG โปร่งใส', w: 200, h: 60 },
                  { label: 'ภาพหน้าแรก', hint: '1920×1080 px', w: 1920, h: 1080 },
                  { label: 'ภาพห้องพัก', hint: '800×600 px', w: 800, h: 600 },
                  { label: 'ภาพสระว่ายน้ำ', hint: '800×600 px', w: 800, h: 600 },
                  { label: 'ภาพร้านอาหาร', hint: '800×600 px', w: 800, h: 600 },
                  { label: 'ภาพ Favicon', hint: '32×32 px ICO/PNG', w: 32, h: 32 },
                ].map(img => (
                  <div key={img.label} className="border-2 border-dashed border-border hover:border-accent/50 rounded-xl p-4 text-center transition-all cursor-pointer group">
                    <div className="h-12 flex items-center justify-center mb-2">
                      <ImageIcon className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <div className="text-xs font-medium">{img.label}</div>
                    <div className="text-2xs text-muted-foreground mt-0.5">{img.hint}</div>
                  </div>
                ))}
              </div>
            </SettingCard>
          </div>
        )}

        {/* ──── NOTIFICATIONS TAB ──── */}
        {activeTab === 'notifications' && (
          <div className="animate-fade-in space-y-6">
            <SectionHeader title="การแจ้งเตือน" subtitle="ควบคุมว่าต้องการรับการแจ้งเตือนอะไรและช่องทางไหน" />

            <SettingCard title="In-App" subtitle="การแจ้งเตือนภายใน Dashboard" icon={Bell}>
              <div className="space-y-3">
                {[
                  { label: 'ข้อความใหม่จากแขก', desc: 'แสดง badge บน Inbox' },
                  { label: 'Check-in วันนี้', desc: 'แจ้งเตือน 30 นาทีก่อน' },
                  { label: 'Payment สำเร็จ', desc: 'ทุกครั้งที่รับเงินได้' },
                  { label: 'AI escalation', desc: 'เมื่อ AI ไม่สามารถตอบได้' },
                  { label: 'Housekeeping เสร็จ', desc: 'เมื่อห้องทำความสะอาดเสร็จ' },
                ].map(n => (
                  <ToggleRow key={n.label} label={n.label} description={n.desc} enabled={true} onToggle={() => toast.info(`อัพเดต: ${n.label}`)} />
                ))}
              </div>
            </SettingCard>

            <SettingCard title="Email" subtitle="การแจ้งเตือนทาง Email (ต้องตั้งค่า SendGrid)" icon={Bell}>
              <div className="space-y-3">
                {[
                  { label: 'Daily summary', desc: 'สรุปรายวัน 08:00 น.' },
                  { label: 'ยอดค้างชำระเกิน 24h', desc: 'แจ้งเตือน manager' },
                  { label: 'TM30 ที่ยังไม่ส่ง', desc: 'แจ้งเตือนทุกวัน 09:00 น.' },
                  { label: 'Security events', desc: 'Login จาก IP ใหม่' },
                ].map(n => (
                  <ToggleRow key={n.label} label={n.label} description={n.desc} enabled={false} onToggle={() => toast.info(`อัพเดต: ${n.label}`)} />
                ))}
              </div>
            </SettingCard>

            <SettingCard title="LINE (Staff Alert)" subtitle="ส่งแจ้งเตือนไปหัวหน้าทาง LINE" icon={Bell}>
              <div className="p-3 rounded-xl bg-secondary/50 text-sm text-muted-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500 shrink-0" />
                ต้องเชื่อมต่อ LINE OA ก่อน — ไปที่แท็บ &quot;เชื่อมต่อ&quot;
              </div>
            </SettingCard>
          </div>
        )}

        {/* ──── SECURITY TAB ──── */}
        {activeTab === 'security' && (
          <div className="animate-fade-in space-y-6">
            <SectionHeader title="ความปลอดภัย" subtitle="ตั้งค่าการป้องกันและการควบคุมการเข้าถึง" />

            <SettingCard title="Rate Limiting" subtitle="จำกัดจำนวน request เพื่อป้องกัน abuse" icon={Shield}>
              <div className="space-y-3">
                {[
                  { label: 'Reservation API', limit: '30 req/min', enabled: true },
                  { label: 'AI Suggest Reply', limit: '25 req/min', enabled: true },
                  { label: 'AI Send Message', limit: '40 req/min', enabled: true },
                  { label: 'Payment Charge', limit: '20 req/min', enabled: true },
                  { label: 'Team Invite', limit: '10 req/min', enabled: true },
                  { label: 'Booking Quote (public)', limit: '30 req/min', enabled: true },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <div>
                      <div className="text-sm font-medium">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.limit}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                        เปิดใช้งาน
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SettingCard>

            <SettingCard title="Security Headers" subtitle="HTTP headers ที่เปิดใช้งานใน next.config.js" icon={Lock}>
              <div className="space-y-2">
                {[
                  { header: 'X-Frame-Options', value: 'DENY', ok: true },
                  { header: 'X-Content-Type-Options', value: 'nosniff', ok: true },
                  { header: 'Strict-Transport-Security', value: 'max-age=63072000', ok: true },
                  { header: 'Referrer-Policy', value: 'strict-origin-when-cross-origin', ok: true },
                  { header: 'Permissions-Policy', value: 'camera=(), microphone=()', ok: true },
                  { header: 'Content-Security-Policy', value: '(กำลังพัฒนา)', ok: false },
                ].map(h => (
                  <div key={h.header} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50">
                    {h.ok
                      ? <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      : <X className="h-4 w-4 text-amber-500 shrink-0" />}
                    <span className="font-mono text-xs flex-1">{h.header}</span>
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">{h.value}</span>
                  </div>
                ))}
              </div>
            </SettingCard>

            <SettingCard title="Row Level Security (RLS)" subtitle="Postgres-level tenant isolation — เปิดใช้งานทุกตาราง" icon={Shield}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  'organizations','hotels','user_profiles','reservations','guests','rooms',
                  'room_types','conversations','messages','folios','payments','invoices',
                  'housekeeping_tasks','channel_connections','audit_logs','ai_logs',
                ].map(table => (
                  <div key={table} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-secondary/50">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="font-mono truncate">{table}</span>
                  </div>
                ))}
              </div>
            </SettingCard>

            <SettingCard title="Webhook Signature Verification" subtitle="ตรวจสอบ HMAC signature ก่อนประมวลผล" icon={Lock}>
              <div className="space-y-2">
                {[
                  { name: 'LINE', method: 'HMAC-SHA256', env: 'LINE_CHANNEL_SECRET', ok: true },
                  { name: 'WhatsApp', method: 'SHA-256 + verify token', env: 'WHATSAPP_APP_SECRET', ok: true },
                  { name: 'Omise', method: 'HMAC-SHA256', env: 'OMISE_WEBHOOK_SECRET', ok: true },
                  { name: 'Booking.com', method: 'Bearer token', env: 'BOOKING_COM_WEBHOOK_TOKEN', ok: true },
                  { name: 'Agoda', method: 'Bearer token', env: 'AGODA_WEBHOOK_TOKEN', ok: true },
                ].map(w => (
                  <div key={w.name} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{w.name}</div>
                      <div className="text-xs text-muted-foreground">{w.method}</div>
                    </div>
                    <span className="font-mono text-2xs text-muted-foreground/60">{w.env}</span>
                  </div>
                ))}
              </div>
            </SettingCard>
          </div>
        )}

        {/* ──── DEMO KEYS TAB ──── */}
        {activeTab === 'demo' && (
          <div className="animate-fade-in space-y-6">
            <SectionHeader
              title="🔑 Demo API Keys"
              subtitle="Keys หลอกสำหรับทดสอบ UI ว่า form และ flow ทำงานถูกต้อง ไม่ใช้กับ API จริง"
            />

            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 text-sm flex items-start gap-3">
              <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">Demo Mode — ไม่มีผลต่อระบบจริง</div>
                <div className="text-amber-700 dark:text-amber-300 text-xs">
                  Keys เหล่านี้ใช้ทดสอบ UI flow เท่านั้น เพื่อ deploy ใช้งานจริงกรุณาใส่ keys จริงใน Vercel Environment Variables
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {Object.entries(DEMO_KEYS).map(([key, value]) => (
                <DemoKeyRow key={key} envKey={key} value={value} />
              ))}
            </div>

            <SettingCard title="วิธี deploy ไป Vercel" subtitle="ขั้นตอนการตั้งค่า environment variables" icon={ExternalLink}>
              <div className="space-y-3 text-sm">
                {[
                  { step: '1', text: 'ไปที่ vercel.com → Project → Settings → Environment Variables' },
                  { step: '2', text: 'เพิ่มทุก key จาก .env.example (ใช้ค่าจริง ไม่ใช่ demo)' },
                  { step: '3', text: 'ตั้งค่า NEXT_PUBLIC_APP_URL เป็น domain จริง' },
                  { step: '4', text: 'Push to main branch → Vercel auto-deploy' },
                  { step: '5', text: 'รัน Supabase migrations ใน SQL editor' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                      {s.step}
                    </div>
                    <span className="text-muted-foreground pt-0.5">{s.text}</span>
                  </div>
                ))}
                <a
                  href="https://vercel.com/docs/concepts/deployments/environment-variables"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-accent text-xs hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Vercel Environment Variables docs
                </a>
              </div>
            </SettingCard>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function StatusPill({ label, color }: { label: string; color: 'emerald' | 'sky' }) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm',
      color === 'emerald' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-sky-900/60 text-sky-300'
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', color === 'emerald' ? 'bg-emerald-400' : 'bg-sky-400')} />
      {label}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-medium tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function SettingCard({ title, subtitle, icon: Icon, children }: {
  title: string; subtitle: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-[var(--shadow-sm)] animate-fade-in">
      <div className="flex items-start gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function FeatureCard({ feature, onToggle, delay }: {
  feature: Feature; onToggle: () => void; delay: number;
}) {
  const Icon = feature.icon;
  return (
    <div
      className={cn(
        'group relative rounded-2xl border p-4 transition-all duration-200 animate-fade-in',
        feature.enabled
          ? 'border-accent/20 bg-accent/5'
          : 'border-border bg-card hover:border-accent/30'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'h-9 w-9 rounded-xl flex items-center justify-center transition-colors',
          feature.enabled ? 'bg-accent/15' : 'bg-secondary'
        )}>
          <Icon className={cn('h-4 w-4', feature.enabled ? 'text-accent' : 'text-muted-foreground')} />
        </div>
        <button
          onClick={onToggle}
          className={cn('toggle', feature.enabled && 'on')}
          role="switch"
          aria-checked={feature.enabled}
        >
          <span className="toggle-thumb" />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium">{feature.label}</span>
        {feature.badge && (
          <span className="text-2xs px-1.5 py-0.5 rounded-md bg-accent/10 text-accent font-medium">
            {feature.badge}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
    </div>
  );
}

function IntegrationCard({ integration: i, testing, onTest, delay }: {
  integration: Integration; testing: boolean; onTest: () => void; delay: number;
}) {
  const statusConfig = {
    active: { label: 'เชื่อมต่อ', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    error:  { label: 'ข้อผิดพลาด', dot: 'bg-red-500', text: 'text-red-600' },
    pending: { label: 'รอดำเนินการ', dot: 'bg-amber-500', text: 'text-amber-600' },
    inactive: { label: 'ไม่ได้ใช้งาน', dot: 'bg-muted-foreground/40', text: 'text-muted-foreground' },
  };
  const sc = statusConfig[i.status];

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-accent/30 transition-all animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn('h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-xl shrink-0', i.color)}>
        {i.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm">{i.name}</span>
          <div className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
            <span className={cn('text-2xs', sc.text)}>{sc.label}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground truncate">{i.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-2xs text-muted-foreground/60">{i.envKey}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={i.docsUrl}
          target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="เปิดเอกสาร"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {i.testable && (
          <button
            onClick={onTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/10 hover:text-accent text-xs font-medium transition-colors disabled:opacity-50"
          >
            {testing ? (
              <><RefreshCw className="h-3 w-3 animate-spin" />ทดสอบ...</>
            ) : (
              <><Activity className="h-3 w-3" />ทดสอบ</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: {
  label: string; description: string; enabled: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        onClick={onToggle}
        className={cn('toggle shrink-0', enabled && 'on')}
        role="switch"
        aria-checked={enabled}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}

function DemoKeyRow({ envKey, value }: { envKey: string; value: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const masked = value.slice(0, 8) + '•'.repeat(Math.min(20, value.length - 8));

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs font-medium text-muted-foreground mb-1">{envKey}</div>
        <div className="font-mono text-xs text-foreground truncate">
          {visible ? value : masked}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setVisible(v => !v)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={visible ? 'ซ่อน' : 'แสดง'}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={copy}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="คัดลอก"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
