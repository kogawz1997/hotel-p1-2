import { NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/security/rate-limit';

// Generates a professional HTML receipt/invoice that renders perfectly in browser
// and can be printed/saved as PDF via window.print()
// No external PDF library needed — browser does the PDF rendering

export async function GET(request: Request) {
  const limited = rateLimit(request, 'invoices.pdf', 20, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const reservationId = searchParams.get('reservationId');
  if (!reservationId) return NextResponse.json({ error: 'reservationId required' }, { status: 400 });

  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;
  if (!ctx.hotelId) {
    return NextResponse.json({ error: 'Hotel access denied' }, { status: 403 });
  }

  const { data: reservation, error } = await ctx.supabase
    .from('reservations')
    .select(`
      *,
      guests(first_name, last_name, email, phone, nationality, passport_number, id_card_number),
      room_types(name, base_rate),
      rooms(room_number),
      folios(*, folio_items(*)),
      hotels(name, address, city, phone, email, tax_id, vat_rate, currency, check_in_time, check_out_time)
    `)
    .eq('id', reservationId)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  const hotel = reservation.hotels as any;
  const guest = reservation.guests as any;
  const folio = Array.isArray(reservation.folios) ? reservation.folios[0] : reservation.folios as any;
  const folioItems: any[] = folio?.folio_items || [];

  const vatRate = Number(hotel?.vat_rate || 0.07);
  const totalAmount = Number(reservation.total_amount || 0);
  const subtotal = totalAmount / (1 + vatRate);
  const vatAmount = totalAmount - subtotal;

  const formatThaiDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${parseInt(day)} ${months[parseInt(m) - 1]} ${parseInt(y) + 543}`;
  };

  const formatTHB = (n: number) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const invoiceNumber = `INV-${reservation.reservation_code}-${new Date().getFullYear()}`;
  const issueDate = new Date().toISOString().slice(0, 10);

  const lineItems = folioItems.length > 0
    ? folioItems.map((item: any) => ({
        description: item.description || 'ค่าห้องพัก',
        qty: item.quantity || 1,
        unit: Number(item.unit_price || item.amount || 0),
        total: Number(item.amount || 0),
      }))
    : [{
        description: `ค่าห้องพัก ${reservation.room_types?.name || ''} (${reservation.nights} คืน)`,
        qty: reservation.nights || 1,
        unit: subtotal / (reservation.nights || 1),
        total: subtotal,
      }];

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ใบเสร็จ ${invoiceNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Sarabun', sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    background: #f5f5f5;
    line-height: 1.6;
  }

  .page {
    max-width: 794px;
    margin: 24px auto;
    background: white;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border-radius: 4px;
    overflow: hidden;
  }

  .header {
    background: #2A2522;
    color: white;
    padding: 36px 48px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .hotel-name {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .hotel-info { font-size: 11px; opacity: 0.7; line-height: 1.8; }

  .invoice-meta { text-align: right; }
  .invoice-label {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.5;
    margin-bottom: 4px;
  }
  .invoice-number {
    font-size: 20px;
    font-weight: 700;
    font-family: monospace;
    letter-spacing: 0.05em;
    color: #C66A30;
  }
  .invoice-date { font-size: 12px; opacity: 0.7; margin-top: 6px; }

  .body { padding: 36px 48px; }

  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }

  .party-label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 8px;
    font-weight: 600;
  }
  .party-name { font-size: 15px; font-weight: 600; margin-bottom: 3px; }
  .party-info { font-size: 11px; color: #666; line-height: 1.8; }

  .stay-info {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    background: #FAF7F2;
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 32px;
    border: 1px solid #F0E8DC;
  }
  .stay-cell-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #999;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .stay-cell-value { font-size: 14px; font-weight: 600; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #FAF7F2; border-bottom: 2px solid #E8DDD0; }
  thead th {
    padding: 10px 14px;
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    font-weight: 600;
  }
  thead th:last-child, thead th:nth-child(2), thead th:nth-child(3) { text-align: right; }

  tbody tr { border-bottom: 1px solid #F0EDE8; }
  tbody tr:last-child { border-bottom: none; }
  tbody td { padding: 12px 14px; font-size: 13px; }
  tbody td:last-child, tbody td:nth-child(2), tbody td:nth-child(3) { text-align: right; }

  .totals {
    margin-left: auto;
    width: 280px;
    border-top: 2px solid #E8DDD0;
    padding-top: 16px;
  }
  .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .total-row.grand {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 2px solid #2A2522;
    font-size: 17px;
    font-weight: 700;
  }
  .total-row.grand .amount { color: #C66A30; }

  .payment-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    margin-top: 20px;
  }
  .status-paid { background: #ECFDF5; color: #065F46; border: 1px solid #6EE7B7; }
  .status-partial { background: #FFFBEB; color: #92400E; border: 1px solid #FCD34D; }
  .status-unpaid { background: #FEF2F2; color: #991B1B; border: 1px solid #FCA5A5; }

  .footer {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #EEE;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .thank-you { font-size: 13px; color: #888; }
  .tax-note { font-size: 11px; color: #AAA; text-align: right; }

  @media print {
    body { background: white; }
    .page { margin: 0; box-shadow: none; border-radius: 0; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 0; }
  }

  .print-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2A2522;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Sarabun', sans-serif;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    z-index: 100;
  }
  .print-btn:hover { background: #C66A30; }
</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">
  🖨️ พิมพ์ / บันทึก PDF
</button>

<div class="page">
  <div class="header">
    <div>
      <div class="hotel-name">${hotel?.name || 'Hotel'}</div>
      <div class="hotel-info">
        ${hotel?.address ? hotel.address + '<br>' : ''}
        ${hotel?.city ? hotel.city + ', Thailand<br>' : ''}
        ${hotel?.phone ? 'Tel: ' + hotel.phone + '<br>' : ''}
        ${hotel?.email ? hotel.email + '<br>' : ''}
        ${hotel?.tax_id ? 'เลขผู้เสียภาษี: ' + hotel.tax_id : ''}
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-label">ใบเสร็จรับเงิน / Receipt</div>
      <div class="invoice-number">${invoiceNumber}</div>
      <div class="invoice-date">วันที่ ${formatThaiDate(issueDate)}</div>
    </div>
  </div>

  <div class="body">
    <div class="parties">
      <div>
        <div class="party-label">ผู้ออกใบเสร็จ</div>
        <div class="party-name">${hotel?.name || ''}</div>
        <div class="party-info">
          ${hotel?.address || ''}<br>
          ${hotel?.tax_id ? `เลขผู้เสียภาษี: ${hotel.tax_id}` : ''}
        </div>
      </div>
      <div>
        <div class="party-label">ผู้รับบริการ / Bill To</div>
        <div class="party-name">${guest?.first_name || ''} ${guest?.last_name || ''}</div>
        <div class="party-info">
          ${guest?.email ? guest.email + '<br>' : ''}
          ${guest?.phone ? 'Tel: ' + guest.phone + '<br>' : ''}
          ${guest?.passport_number ? 'Passport: ' + guest.passport_number + '<br>' : ''}
          ${guest?.nationality ? guest.nationality : ''}
        </div>
      </div>
    </div>

    <div class="stay-info">
      <div>
        <div class="stay-cell-label">เลขที่การจอง</div>
        <div class="stay-cell-value" style="font-family:monospace;font-size:12px">${reservation.reservation_code}</div>
      </div>
      <div>
        <div class="stay-cell-label">เช็คอิน</div>
        <div class="stay-cell-value">${formatThaiDate(reservation.check_in)}</div>
      </div>
      <div>
        <div class="stay-cell-label">เช็คเอาท์</div>
        <div class="stay-cell-value">${formatThaiDate(reservation.check_out)}</div>
      </div>
      <div>
        <div class="stay-cell-label">จำนวนคืน</div>
        <div class="stay-cell-value">${reservation.nights} คืน</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>รายการ</th>
          <th>จำนวน</th>
          <th>ราคา/หน่วย</th>
          <th>รวม</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map((item: any) => `
        <tr>
          <td>${item.description}</td>
          <td style="text-align:right">${item.qty}</td>
          <td style="text-align:right">฿${formatTHB(item.unit)}</td>
          <td style="text-align:right">฿${formatTHB(item.total)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div style="display:flex;justify-content:flex-end">
      <div class="totals">
        <div class="total-row">
          <span>ราคาก่อน VAT</span>
          <span>฿${formatTHB(subtotal)}</span>
        </div>
        <div class="total-row">
          <span>VAT ${Math.round(vatRate * 100)}%</span>
          <span>฿${formatTHB(vatAmount)}</span>
        </div>
        <div class="total-row grand">
          <span>รวมทั้งสิ้น</span>
          <span class="amount">฿${formatTHB(totalAmount)}</span>
        </div>

        ${Number(reservation.paid_amount) >= totalAmount
          ? `<div><span class="payment-status status-paid">✓ ชำระครบแล้ว</span></div>`
          : Number(reservation.paid_amount) > 0
            ? `<div>
                <span class="payment-status status-partial">⚠ ชำระบางส่วน</span>
                <div style="font-size:11px;color:#888;margin-top:6px">
                  ชำระแล้ว: ฿${formatTHB(Number(reservation.paid_amount))}<br>
                  ค้างชำระ: ฿${formatTHB(Number(reservation.balance_amount || 0))}
                </div>
              </div>`
            : `<div><span class="payment-status status-unpaid">✕ ยังไม่ได้ชำระ</span></div>`
        }
      </div>
    </div>

    <div class="footer">
      <div class="thank-you">
        ขอบคุณที่ใช้บริการ<br>
        <span style="color:#C66A30;font-weight:600">${hotel?.name || ''}</span>
      </div>
      <div class="tax-note">
        เอกสารนี้ออกโดยระบบ Maitri PMS<br>
        ${new Date().toLocaleString('th-TH')}
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
