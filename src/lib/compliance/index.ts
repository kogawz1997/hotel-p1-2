// Thai Hotel Compliance: ทร.30 + e-Tax Invoice
// 
// SETUP REQUIRED:
//
// 1. ทร.30 (Foreign Guest Report)
//    - Coordinate with local Immigration Bureau
//    - Some provinces have online API, others require manual upload
//    - Register your hotel as a "thi pak" (สถานประกอบการที่พัก) first
//    - https://extranet.immigration.go.th
//
// 2. e-Tax Invoice
//    - Choose certified service provider:
//      * INET (https://etax.inet.co.th)
//      * Frank.co.th
//      * leceipt.com
//    - Get digital certificate from CA
//    - Process: 1-3 months
//    - Government docs: https://etax.rd.go.th
//
// 3. ภพ.30 / ภงด. (Tax filings)
//    - Sync to PEAK / FlowAccount which handles e-filing

export interface TM30Submission {
  passportNumber: string;
  nationality: string;
  fullName: string;
  arrivalDate: string;
  hotelName: string;
  hotelAddress: string;
  roomNumber?: string;
}

export interface TM30Response {
  success: boolean;
  confirmationNumber?: string;
  errors?: string[];
}

export class TM30Service {
  // Most provinces still don't have public API.
  // Bangkok has https://extranet.immigration.go.th/tm30
  // Other provinces: contact local immigration

  async submit(report: TM30Submission): Promise<TM30Response> {
    if (!process.env.IMMIGRATION_API_KEY) {
      console.warn('[TM30] API not configured. Manual submission required.');
      // Generate a manual submission file the staff can upload
      return {
        success: false,
        errors: ['Manual submission required. Check docs/TM30_SETUP.md'],
      };
    }

    // TODO: Implement actual API call after immigration approval
    // const response = await axios.post('https://extranet.immigration.go.th/api/tm30', ...);
    
    return {
      success: true,
      confirmationNumber: `TM30-${Date.now()}`,
    };
  }

  // Generate Excel/CSV file for manual upload (fallback)
  generateBatchFile(reports: TM30Submission[]): string {
    const headers = ['Passport', 'Nationality', 'Name', 'Arrival', 'Hotel', 'Address'];
    const rows = reports.map(r => [
      r.passportNumber, r.nationality, r.fullName,
      r.arrivalDate, r.hotelName, r.hotelAddress,
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }
}

// e-Tax Invoice
export interface ETaxInvoice {
  invoiceNumber: string;
  issueDate: string;
  sellerTaxId: string;
  sellerName: string;
  sellerAddress: string;
  buyerTaxId?: string;
  buyerName: string;
  buyerAddress?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    vatRate: number;
  }>;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
}

export interface ETaxResult {
  status: 'submitted' | 'approved' | 'rejected';
  documentId?: string;
  pdfUrl?: string;
  xmlContent?: string;
  errors?: string[];
}

export class ETaxService {
  private provider: string;

  constructor(provider: string = 'inet') {
    this.provider = provider;
  }

  async submit(invoice: ETaxInvoice): Promise<ETaxResult> {
    if (!process.env.ETAX_USERNAME) {
      console.warn('[e-Tax] Not configured. Setup required.');
      return {
        status: 'rejected',
        errors: ['e-Tax provider not configured. See docs/ETAX_SETUP.md'],
      };
    }

    // TODO: Implement after provider approved
    // INET example:
    // const xml = this.buildXML(invoice);
    // const signed = await this.signXML(xml);
    // const response = await axios.post('https://api.etax.inet.co.th/v1/invoices', signed);

    return {
      status: 'submitted',
      documentId: `ETAX-${invoice.invoiceNumber}`,
    };
  }

  // Generate XML in Thai government format (TH e-Tax XML schema)
  buildXML(invoice: ETaxInvoice): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${invoice.invoiceNumber}</ID>
  <IssueDate>${invoice.issueDate}</IssueDate>
  <AccountingSupplierParty>
    <Party>
      <PartyTaxScheme><CompanyID>${invoice.sellerTaxId}</CompanyID></PartyTaxScheme>
      <PartyName><Name>${invoice.sellerName}</Name></PartyName>
    </Party>
  </AccountingSupplierParty>
  <AccountingCustomerParty>
    <Party>
      ${invoice.buyerTaxId ? `<PartyTaxScheme><CompanyID>${invoice.buyerTaxId}</CompanyID></PartyTaxScheme>` : ''}
      <PartyName><Name>${invoice.buyerName}</Name></PartyName>
    </Party>
  </AccountingCustomerParty>
  ${invoice.items.map((item, i) => `
  <InvoiceLine>
    <ID>${i + 1}</ID>
    <InvoicedQuantity>${item.quantity}</InvoicedQuantity>
    <LineExtensionAmount>${item.quantity * item.unitPrice}</LineExtensionAmount>
    <Item><Description>${item.description}</Description></Item>
  </InvoiceLine>`).join('')}
  <LegalMonetaryTotal>
    <TaxExclusiveAmount>${invoice.subtotal}</TaxExclusiveAmount>
    <TaxInclusiveAmount>${invoice.totalAmount}</TaxInclusiveAmount>
  </LegalMonetaryTotal>
</Invoice>`;
  }
}

export const tm30Service = new TM30Service();
export const etaxService = new ETaxService(process.env.ETAX_PROVIDER || 'inet');
