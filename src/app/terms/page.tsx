import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เงื่อนไขการใช้งาน — Maitri',
};

const LAST_UPDATED = '1 พฤษภาคม 2026';

export default function TermsPage() {
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
          <div className="text-xs text-[#C66A30] font-medium uppercase tracking-wider mb-2">Legal</div>
          <h1 className="text-3xl font-bold text-[#2A2522] mb-2">เงื่อนไขการใช้งาน</h1>
          <p className="text-sm text-[#2A2522]/40">อัพเดตล่าสุด: {LAST_UPDATED}</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 p-8 space-y-8 text-sm leading-relaxed text-[#2A2522]/70">
          <Section title="1. การยอมรับเงื่อนไข">
            <p>การเข้าใช้งานเว็บไซต์หรือบริการของ Maitri ("บริการ") ถือว่าคุณยอมรับเงื่อนไขการใช้งานฉบับนี้ทั้งหมด หากคุณไม่ยอมรับเงื่อนไขเหล่านี้ กรุณาหยุดใช้งานบริการ</p>
          </Section>

          <Section title="2. คำอธิบายบริการ">
            <p>Maitri ให้บริการแพลตฟอร์มจองที่พักออนไลน์และระบบจัดการโรงแรม (Property Management System) สำหรับโรงแรมและที่พักในประเทศไทย ผู้ใช้แบ่งออกเป็น 2 ประเภท:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>แขกผู้เข้าพัก (Guest)</strong> — ผู้ใช้ที่ต้องการจองห้องพัก</li>
              <li><strong>ผู้ประกอบการโรงแรม (Hotel Staff)</strong> — เจ้าของหรือพนักงานที่จัดการระบบ</li>
            </ul>
          </Section>

          <Section title="3. การสมัครบัญชีและความรับผิดชอบ">
            <ul className="list-disc list-inside space-y-1">
              <li>คุณต้องมีอายุ 18 ปีบริบูรณ์หรือได้รับความยินยอมจากผู้ปกครอง</li>
              <li>ข้อมูลที่ให้ไว้ต้องเป็นความจริงและเป็นปัจจุบัน</li>
              <li>คุณรับผิดชอบในการรักษาความปลอดภัยของรหัสผ่าน</li>
              <li>ห้ามแชร์บัญชีกับบุคคลอื่น</li>
            </ul>
          </Section>

          <Section title="4. การจองและการชำระเงิน">
            <ul className="list-disc list-inside space-y-2">
              <li>การจองจะสมบูรณ์เมื่อได้รับอีเมลยืนยันพร้อมรหัสการจอง</li>
              <li>ราคาที่แสดงรวม VAT 7% แล้ว เว้นแต่ระบุไว้เป็นอย่างอื่น</li>
              <li><strong>นโยบายการยกเลิก (Flexible Rate)</strong>: ยกเลิกฟรีหากแจ้งล่วงหน้ามากกว่า 24 ชั่วโมงก่อนเช็คอิน</li>
              <li><strong>นโยบายการยกเลิก (Non-Refundable)</strong>: ไม่สามารถยกเลิกคืนเงินได้ทุกกรณี</li>
              <li>โรงแรมอาจมีนโยบายยกเลิกที่แตกต่างออกไป ให้ดูในหน้าจองของแต่ละที่พัก</li>
            </ul>
          </Section>

          <Section title="5. ความรับผิดชอบของโรงแรม">
            <p>Maitri ทำหน้าที่เป็นตัวกลางระหว่างแขกและโรงแรม โรงแรมเป็นผู้รับผิดชอบโดยตรงต่อ:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>คุณภาพห้องพักและบริการ</li>
              <li>ความถูกต้องของข้อมูลที่พักที่แสดงบนระบบ</li>
              <li>การคืนเงินตามนโยบายที่ระบุไว้</li>
            </ul>
          </Section>

          <Section title="6. การใช้งานที่ต้องห้าม">
            <ul className="list-disc list-inside space-y-1">
              <li>ห้ามใช้ระบบเพื่อการจองปลอมหรือการฉ้อโกง</li>
              <li>ห้ามรวบรวมข้อมูลผู้ใช้โดยไม่ได้รับอนุญาต</li>
              <li>ห้ามพยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต</li>
              <li>ห้ามเผยแพร่เนื้อหาที่เป็นเท็จหรือหมิ่นประมาท</li>
            </ul>
          </Section>

          <Section title="7. ทรัพย์สินทางปัญญา">
            <p>เนื้อหา โลโก้ และซอฟต์แวร์ทั้งหมดบนแพลตฟอร์มนี้เป็นทรัพย์สินของ Maitri หรือผู้อนุญาตที่เกี่ยวข้อง ห้ามทำซ้ำหรือใช้งานเชิงพาณิชย์โดยไม่ได้รับอนุญาต</p>
          </Section>

          <Section title="8. การจำกัดความรับผิด">
            <p>Maitri ไม่รับผิดชอบต่อความเสียหายทางอ้อม การสูญเสียรายได้ หรือความเสียหายอื่นใดที่เกิดจากการใช้บริการ ยกเว้นที่กฎหมายกำหนดไว้เป็นอย่างอื่น</p>
          </Section>

          <Section title="9. การเปลี่ยนแปลงเงื่อนไข">
            <p>Maitri ขอสงวนสิทธิ์ในการแก้ไขเงื่อนไขการใช้งานได้ทุกเมื่อ โดยจะแจ้งให้ทราบผ่านอีเมลหรือการแจ้งเตือนบนระบบ การใช้งานต่อเนื่องหลังจากมีการแจ้งถือว่ายอมรับเงื่อนไขใหม่</p>
          </Section>

          <Section title="10. กฎหมายที่ใช้บังคับ">
            <p>เงื่อนไขฉบับนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทให้อยู่ในเขตอำนาจของศาลไทย</p>
          </Section>

          <Section title="11. ติดต่อเรา">
            <p>หากมีคำถามเกี่ยวกับเงื่อนไขการใช้งาน ติดต่อเราได้ที่:</p>
            <div className="mt-2 p-3 bg-[#FAF7F2] rounded-lg text-xs space-y-1">
              <p>📧 legal@maitri.co</p>
              <p>🏢 บริษัท ไมตรี ฮอสพิทาลิตี้ เทค จำกัด</p>
              <p>📍 กรุงเทพมหานคร ประเทศไทย</p>
            </div>
          </Section>
        </div>

        <div className="flex gap-4 mt-6 text-sm">
          <Link href="/privacy" className="text-[#C66A30] hover:underline">นโยบายความเป็นส่วนตัว →</Link>
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
