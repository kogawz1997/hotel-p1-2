export interface Hotel {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  type: 'hotel' | 'hostel' | 'pool_villa' | 'serviced_apartment' | 'resort' | 'boutique';
  address?: string;
  city?: string;
  country: string;
  timezone: string;
  currency: string;
  phone?: string;
  email?: string;
  website?: string;
  check_in_time: string;
  check_out_time: string;
  tax_id?: string;
  vat_rate: number;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_type_id: string;
  room_number: string;
  floor?: number;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked';
  notes?: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  code?: string;
  description?: string;
  max_occupancy: number;
  base_rate: number;
  amenities: string[];
  size_sqm?: number;
  bed_type?: string;
}

export interface Guest {
  id: string;
  hotel_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  passport_number?: string;
  id_card_number?: string;
  preferred_language: string;
  preferences: Record<string, any>;
  vip_status: boolean;
  loyalty_points: number;
  loyalty_tier: string;
  notes?: string;
  total_stays: number;
  total_revenue: number;
}

export interface Reservation {
  id: string;
  hotel_id: string;
  guest_id: string;
  room_id?: string;
  room_type_id: string;
  rate_plan_id?: string;
  reservation_code: string;
  check_in: string;
  check_out: string;
  nights: number;
  num_adults: number;
  num_children: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show' | 'on_hold';
  source: string;
  external_id?: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  special_requests?: string;
  internal_notes?: string;
  tm30_reported: boolean;
}

export interface Conversation {
  id: string;
  hotel_id: string;
  guest_id?: string;
  reservation_id?: string;
  channel: string;
  channel_user_id: string;
  guest_language: string;
  guest_name?: string;
  status: 'open' | 'snoozed' | 'closed' | 'spam';
  assigned_to?: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count: number;
  ai_handling: boolean;
  needs_human: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'guest' | 'staff' | 'ai' | 'system';
  sender_id?: string;
  original_text?: string;
  original_language?: string;
  translated_text?: string;
  message_type: string;
  media_url?: string;
  ai_generated: boolean;
  ai_confidence?: number;
  status: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  hotel_id: string;
  reservation_id: string;
  guest_id: string;
  invoice_number: string;
  invoice_type: 'tax_invoice' | 'receipt' | 'credit_note' | 'debit_note';
  issue_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  buyer_name?: string;
  buyer_tax_id?: string;
  is_etax: boolean;
  etax_status?: string;
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'cancelled';
  pdf_url?: string;
}
