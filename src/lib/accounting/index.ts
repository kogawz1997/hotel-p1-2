// Accounting integration for Thai bookkeeping software
//
// Setup links:
// - PEAK: https://peakaccount.com/api (need API access from PEAK support)
// - FlowAccount: https://flowaccount.com - has open API
// - Express: https://www.esg.co.th - older, may need custom integration
// - Xero: https://developer.xero.com (international)

export interface AccountingInvoice {
  invoiceNumber: string;
  issueDate: string;
  customerName: string;
  customerTaxId?: string;
  items: Array<{ description: string; amount: number; vatRate: number }>;
  totalAmount: number;
}

export interface AccountingPayment {
  paymentDate: string;
  amount: number;
  invoiceNumber?: string;
  method: string;
}

export interface AccountingAdapter {
  name: string;
  syncInvoice(invoice: AccountingInvoice): Promise<{ id: string; success: boolean }>;
  syncPayment(payment: AccountingPayment): Promise<{ id: string; success: boolean }>;
  syncContact(contact: { name: string; taxId?: string; email?: string }): Promise<{ id: string }>;
}

// PEAK adapter
export class PeakAdapter implements AccountingAdapter {
  name = 'peak';
  // PEAK API documentation: contact PEAK support for API access
  
  async syncInvoice(invoice: AccountingInvoice): Promise<{ id: string; success: boolean }> {
    if (!process.env.PEAK_API_KEY) {
      console.warn('[PEAK] Not configured');
      return { id: '', success: false };
    }
    // TODO: Implement PEAK API call
    return { id: `peak-${Date.now()}`, success: true };
  }

  async syncPayment(payment: AccountingPayment): Promise<{ id: string; success: boolean }> {
    return { id: `peak-pmt-${Date.now()}`, success: true };
  }

  async syncContact(contact: any): Promise<{ id: string }> {
    return { id: `peak-contact-${Date.now()}` };
  }
}

// FlowAccount adapter (has public API)
export class FlowAccountAdapter implements AccountingAdapter {
  name = 'flowaccount';
  private apiKey: string;
  private baseUrl = 'https://api.flowaccount.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async syncInvoice(invoice: AccountingInvoice): Promise<{ id: string; success: boolean }> {
    if (!this.apiKey) return { id: '', success: false };

    try {
      const response = await fetch(`${this.baseUrl}/invoices`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          customerName: invoice.customerName,
          customerTaxId: invoice.customerTaxId,
          items: invoice.items,
        }),
      });

      const data = await response.json();
      return { id: data.id, success: response.ok };
    } catch (error) {
      console.error('[FlowAccount] Sync error:', error);
      return { id: '', success: false };
    }
  }

  async syncPayment(payment: AccountingPayment): Promise<{ id: string; success: boolean }> {
    // Implementation similar to syncInvoice
    return { id: '', success: false };
  }

  async syncContact(contact: any): Promise<{ id: string }> {
    return { id: '' };
  }
}

export function getAccountingAdapter(provider: string): AccountingAdapter {
  switch (provider) {
    case 'peak':
      return new PeakAdapter();
    case 'flowaccount':
      return new FlowAccountAdapter(process.env.FLOWACCOUNT_API_KEY || '');
    default:
      throw new Error(`Unsupported accounting provider: ${provider}`);
  }
}
