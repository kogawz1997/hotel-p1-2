export async function writeAuditLog(
  supabase: any,
  input: {
    hotelId?: string | null;
    organizationId?: string | null;
    userId?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    changes?: unknown;
    request?: Request;
  }
) {
  try {
    const ip = input.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || input.request?.headers.get('x-real-ip') || null;
    const userAgent = input.request?.headers.get('user-agent') || null;
    await supabase.from('audit_logs').insert({
      hotel_id: input.hotelId || null,
      organization_id: input.organizationId || null,
      user_id: input.userId || null,
      action: input.action,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      before: input.before ?? null,
      after: input.after ?? null,
      changes: input.changes ?? null,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch {
    // Audit must never break user flow. It should shame us in logs later, not brick checkout now.
  }
}
