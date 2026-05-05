import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว — Maitri',
};

const LAST_UPDATED = '1 พฤษภาคม 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-medium text-[#2A2522]">🪷 Maitri</Link>
          <Link href="/portal/login" className="text-sm text-[#C66A30] hover:underline">เข้าสู่ระบบ</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="text-xs text-[#C66A30] font-medium uppercase tracking-wider mb-2">Legal · PDPA Compliant</div>
          <h1 className="text-3xl font-bold text-[#2A2522] mb-2">นโยบายความเป็นส่วนตัว</h1>
          <p className="text-sm text-[#2A2522]/40">อัพเดตล่าสุด: {LAST_UPDATED}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-sm text-amber-800">
          <p className="font-semibold mb-1">🔒 สรุปสั้น (Plain Language Summary)</p>
          <ul className="space-y-1 text-amber-700 text-xs">
            <li>• เราเก็บข้อมูลเพื่อให้บริการจองห้องพักเท่านั้น</li>
            <li>• ไม่ขายข้อมูลของคุณให้ใคร</li>
            <li>• คุณสามารถขอดู แก้ไข หรือลบข้อมูลได้ทุกเมื่อ</li>
            <li>• เป็นไปตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 p-8 space-y-8 text-sm leading-relaxed text-[#2A2522]/70">
          <Section title="1. ผู้ควบคุมข้อมูลส่วนบุคคล">
            <p>บริษัท ไมตรี ฮอสพิทาลิตี้ เทค จำกัด ("Maitri", "เรา") ทำหน้าที่เป็นผู้ควบคุมข้อมูลส่วนบุคคล สามารถติดต่อเราได้ที่ privacy@maitri.co</p>
          </Section>

          <Section title="2. ข้อมูลที่เราเก็บรวบรวม">
            <div className="space-y-3">
              <SubSection title="2.1 ข้อมูลที่คุณให้เราโดยตรง">
                <ul className="list-disc list-inside space-y-1">
                  <li>ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์</li>
                  <li>สัญชาติ, เลขพาสปอร์ต (สำหรับ ทร.30)</li>
                  <li>ข้อมูลการจอง (วันที่, ห้องพัก, ความต้องการพิเศษ)</li>
                  <li>รีวิวและความคิดเห็น</li>
                </ul>
              </SubSection>
              <SubSection title="2.2 ข้อมูลที่เก็บโดยอัตโนมัติ">
                <ul className="list-disc list-inside space-y-1">
                  <li>IP address, ประเภทเบราว์เซอร์, ระบบปฏิบัติการ</li>
                  <li>หน้าที่เข้าชม, เวลาที่ใช้งาน</li>
                  <li>Cookies ที่จำเป็นสำหรับการใช้งาน</li>
                </ul>
              </SubSection>
            </div>
          </Section>

          <Section title="3. วัตถุประสงค์การใช้ข้อมูล">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2]">
                  <th className="text-left p-2 border border-black/5 font-semibold text-[#2A2522]">วัตถุประสงค์</th>
                  <th className="text-left p-2 border border-black/5 font-semibold text-[#2A2522]">ฐานทางกฎหมาย</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['ดำเนินการจองห้องพัก', 'สัญญา'],
                  ['ส่งอีเมลยืนยันและแจ้งเตือน', 'สัญญา'],
                  ['ส่ง ทร.30 ให้กองตรวจคนเข้าเมือง', 'หน้าที่ตามกฎหมาย'],
                  ['ออกใบกำกับภาษีอิเล็กทรอนิกส์', 'หน้าที่ตามกฎหมาย'],
                  ['ปรับปรุงบริการ', 'ประโยชน์อันชอบด้วยกฎหมาย'],
                  ['ส่งโปรโมชั่น (เมื่อได้รับความยินยอม)', 'ความยินยอม'],
                ].map(([purpose, basis]) => (
                  <tr key={purpose}>
                    <td className="p-2 border border-black/5">{purpose}</td>
                    <td className="p-2 border border-black/5">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. การเปิดเผยข้อมูลแก่บุคคลที่สาม">
            <p className="mb-2">เราไม่ขายข้อมูลส่วนบุคคลของคุณ เราอาจเปิดเผยข้อมูลให้กับ:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>โรงแรม</strong> — เพื่อดำเนินการจองของคุณ</li>
              <li><strong>ผู้ให้บริการชำระเงิน</strong> (Omise) — เพื่อประมวลผลการชำระเงิน</li>
              <li><strong>กองตรวจคนเข้าเมือง</strong> — ตามกฎหมาย ทร.30</li>
              <li><strong>กรมสรรพากร</strong> — ตามกฎหมายภาษี</li>
              <li><strong>Anthropic</strong> — ให้บริการ AI ในการตอบคำถาม</li>
            </ul>
          </Section>

          <Section title="5. ระยะเวลาในการเก็บข้อมูล">
            <ul className="list-disc list-inside space-y-1">
              <li>ข้อมูลบัญชีและการจอง: 5 ปีหลังจากการจองครั้งสุดท้าย</li>
              <li>ข้อมูลภาษีและใบกำกับ: 5 ปีตามกฎหมายภาษีไทย</li>
              <li>ข้อมูล ทร.30: ตามที่กฎหมายกำหนด</li>
              <li>Log files: 90 วัน</li>
            </ul>
          </Section>

          <Section title="6. สิทธิของเจ้าของข้อมูล (PDPA)">
            <div className="grid grid-cols-2 gap-3">
              {[
                { right: '🔍 สิทธิในการเข้าถึง', desc: 'ขอดูข้อมูลของคุณได้' },
                { right: '✏️ สิทธิในการแก้ไข', desc: 'แก้ข้อมูลที่ไม่ถูกต้อง' },
                { right: '🗑️ สิทธิในการลบ', desc: 'ขอลบข้อมูลได้' },
                { right: '📦 สิทธิในการพกพา', desc: 'ขอรับข้อมูลในรูปแบบ JSON' },
                { right: '⛔ สิทธิในการคัดค้าน', desc: 'คัดค้านการประมวลผล' },
                { right: '🔕 ถอนความยินยอม', desc: 'ยกเลิก marketing ได้ทุกเมื่อ' },
              ].map(({ right, desc }) => (
                <div key={right} className="p-2 bg-[#FAF7F2] rounded-lg">
                  <p className="font-medium text-[#2A2522] text-xs">{right}</p>
                  <p className="text-2xs text-[#2A2522]/50">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#2A2522]/50">
              ใช้สิทธิได้ผ่าน: <strong>หน้า Profile</strong> ในระบบ หรือส่งอีเมลมาที่ privacy@maitri.co
              เราจะตอบกลับภายใน 30 วัน
            </p>
          </Section>

          <Section title="7. ความปลอดภัยของข้อมูล">
            <ul className="list-disc list-inside space-y-1">
              <li>การเชื่อมต่อเข้ารหัสด้วย TLS 1.3</li>
              <li>ข้อมูลฐานข้อมูลเข้ารหัสและมีการควบคุมการเข้าถึง</li>
              <li>Row Level Security — แต่ละโรงแรมเห็นเฉพาะข้อมูลของตน</li>
              <li>รหัสผ่านถูก hash ด้วย bcrypt</li>
            </ul>
          </Section>

          <Section title="8. Cookies">
            <p className="mb-2">เราใช้ cookies 2 ประเภท:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Necessary</strong>: สำหรับ session login และ security (ปิดไม่ได้)</li>
              <li><strong>Analytics</strong>: สำหรับวิเคราะห์การใช้งาน (ปิดได้)</li>
            </ul>
          </Section>

          <Section title="9. การร้องเรียน">
            <p>หากมีข้อร้องเรียนเกี่ยวกับการใช้ข้อมูลส่วนบุคคล สามารถร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) ได้ที่ www.pdpc.or.th</p>
          </Section>

          <Section title="10. ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO)">
            <div className="p-3 bg-[#FAF7F2] rounded-lg text-xs space-y-1">
              <p>📧 privacy@maitri.co</p>
              <p>📞 02-xxx-xxxx</p>
              <p>🏢 บริษัท ไมตรี ฮอสพิทาลิตี้ เทค จำกัด กรุงเทพฯ</p>
            </div>
          </Section>
        </div>

        <div className="flex gap-4 mt-6 text-sm">
          <Link href="/terms" className="text-[#C66A30] hover:underline">เงื่อนไขการใช้งาน →</Link>
          <Link href="/" className="text-[#2A2522]/40 hover:text-[#2A2522]">กลับหน้าหลัก</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-[#2A2522] mb-3">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-[#2A2522]/80 mb-1">{title}</p>
      {children}
    </div>
  );
}
