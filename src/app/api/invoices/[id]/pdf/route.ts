import { NextResponse } from 'next/server';
import { assertReservationAccess, requireUser } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';

/** Generates a self-contained HTML receipt/invoice — no PDF lib needed.
 *  Browsers can print-to-PDF this directly.
 *  For true PDF bytes, swap the return for puppeteer/playwright in a job queue.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  if (!ctx.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: invoice, error } = await admin
    .from('invoices')
    .select('*, invoice_items(*), hotels(name, address, city, phone, email, tax_id, vat_rate), reservations(reservation_code, check_in, check_out)')
    .eq('id', id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Verify org ownership
  const { data: hotel } = await admin
    .from('hotels')
    .select('organization_id')
    .eq('id', invoice.hotel_id)
    .single();

  if (!hotel || hotel.organization_id !== ctx.profile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const h = invoice.hotels;
  const items: any[] = invoice.invoice_items || [];
  const typeLabel = invoice.invoice_type === 'tax_invoice' ? 'ใบกำกับภาษี' : 'ใบเสร็จรับเงิน';
  const vatRate = Number(h?.vat_rate || 0.07);

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<title>${typeLabel} ${invoice.invoice_number}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sarabun', 'TH SarabunPSK', sans-serif; font-size: 14px; color: #2A2522; background: #fff; padding: 0; }
  .page { max-width: 740px; margin: 0 auto; padding: 48px 48px 80px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #2A2522; }
  .logo-text { font-size: 28px; font-weight: 600; letter-spacing: -1px; }
  .hotel-name { font-size: 13px; color: #666; margin-top: 4px; }
  .doc-type { text-align: right; }
  .doc-type h1 { font-size: 20px; font-weight: 600; color: #C66A30; }
  .doc-number { font-size: 13px; color: #666; margin-top: 4px; font-family: monospace; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
  .meta-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
  .meta-section p { font-size: 14px; line-height: 1.6; }
  .meta-section .muted { color: #666; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #2A2522; color: #FAF7F2; }
  thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 500; letter-spacing: 0.5px; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #eee; }
  tbody tr:last-child { border-bottom: none; }
  tbody td { padding: 12px 14px; font-size: 14px; }
  tbody td:last-child { text-align: right; font-feature-settings: 'tnum'; }
  .totals { margin-left: auto; width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .totals-row.total { padding-top: 12px; margin-top: 8px; border-top: 2px solid #2A2522; font-weight: 600; font-size: 16px; }
  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-note { font-size: 12px; color: #999; line-height: 1.6; max-width: 340px; }
  .stamp { text-align: right; font-size: 12px; color: #ccc; }
  @media print {
    body { padding: 0; }
    .page { padding: 24px 32px; max-width: 100%; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="no-print" style="background:#f5f5f5;padding:12px 24px;border-bottom:1px solid #ddd;display:flex;justify-content:space-between;align-items:center;">
  <span style="font-size:13px;color:#666;">ดูตัวอย่าง ${typeLabel}</span>
  <button onclick="window.print()" style="background:#2A2522;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:13px;cursor:pointer;">🖨️ พิมพ์ / บันทึก PDF</button>
</div>
<div class="page">
  <div class="header">
    <div>
      <div class="logo-text">Maitri</div>
      <div class="hotel-name">${h?.name || ''}</div>
      ${h?.address ? `<div class="hotel-name">${h.address}${h.city ? ', ' + h.city : ''}</div>` : ''}
      ${h?.phone ? `<div class="hotel-name">โทร ${h.phone}</div>` : ''}
      ${h?.tax_id ? `<div class="hotel-name">เลขผู้เสียภาษี ${h.tax_id}</div>` : ''}
    </div>
    <div class="doc-type">
      <h1>${typeLabel}</h1>
      <div class="doc-number">${invoice.invoice_number}</div>
      <div class="muted" style="margin-top:4px;font-size:13px;color:#666;">
        วันที่ออก: ${new Date(invoice.issue_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-section">
      <h3>ออกให้กับ (Bill To)</h3>
      <p>${invoice.buyer_name || '—'}</p>
      ${invoice.buyer_tax_id ? `<p class="muted">เลขผู้เสียภาษี: ${invoice.buyer_tax_id}</p>` : ''}
      ${invoice.buyer_address ? `<p class="muted">${invoice.buyer_address}</p>` : ''}
    </div>
    <div class="meta-section">
      <h3>รายละเอียดการจอง</h3>
      ${invoice.reservations ? `
        <p>รหัสจอง: <span style="font-family:monospace">${invoice.reservations.reservation_code}</span></p>
        <p class="muted">เช็คอิน: ${invoice.reservations.check_in} → ${invoice.reservations.check_out}</p>
      ` : ''}
      <p class="muted">สถานะ: ${invoice.status}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>รายการ</th>
        <th style="text-align:right">จำนวน</th>
        <th style="text-align:right">ราคาต่อหน่วย</th>
        <th style="text-align:right">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${items.length > 0 ? items.map((item: any) => `
        <tr>
          <td>${item.description}</td>
          <td style="text-align:right">${item.quantity}</td>
          <td style="text-align:right">${formatCurrency(item.unit_price)}</td>
          <td style="text-align:right">${formatCurrency(item.amount)}</td>
        </tr>
      `).join('') : `
        <tr>
          <td colspan="4" style="text-align:center;color:#999;padding:24px;">ไม่มีรายการ</td>
        </tr>
      `}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>ราคาก่อน VAT</span>
      <span>${formatCurrency(invoice.subtotal)}</span>
    </div>
    <div class="totals-row">
      <span>VAT ${Math.round(vatRate * 100)}%</span>
      <span>${formatCurrency(invoice.vat_amount)}</span>
    </div>
    <div class="totals-row total">
      <span>รวมทั้งสิ้น</span>
      <span>${formatCurrency(invoice.total_amount)}</span>
    </div>
  </div>

  <div class="footer">
    <div class="footer-note">
      <strong>หมายเหตุ</strong><br/>
      ใบเสร็จนี้ออกโดยระบบ Maitri PMS<br/>
      ${invoice.is_etax ? 'เอกสารนี้เป็น e-Tax Invoice ที่ผ่านการรับรอง' : 'กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน'}
    </div>
    <div class="stamp">
      <div style="border:1px solid #ccc;padding:20px 32px;border-radius:8px;text-align:center;">
        <div style="font-size:11px;margin-bottom:8px;">ผู้รับเงิน / Received by</div>
        <div style="border-top:1px solid #ccc;margin-top:28px;padding-top:8px;font-size:11px;color:#999;">${h?.name || ''}</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
