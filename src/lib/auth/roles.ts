export type AppRole = 'platform_owner' | 'hotel_owner' | 'owner' | 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'staff';

export const ROLE_ORDER: Record<AppRole, number> = {
  staff: 10,
  housekeeping: 15,
  front_desk: 20,
  manager: 30,
  admin: 40,
  hotel_owner: 50,
  owner: 50,
  platform_owner: 100,
};

export function normalizeRole(role?: string | null): AppRole {
  if (role === 'owner') return 'hotel_owner';
  if (role === 'platform_owner' || role === 'hotel_owner' || role === 'admin' || role === 'manager' || role === 'front_desk' || role === 'housekeeping' || role === 'staff') return role;
  return 'staff';
}

export function hasRole(role: string | null | undefined, allowed: AppRole[]) {
  const normalized = normalizeRole(role);
  return allowed.some((item) => normalizeRole(item) === normalized);
}

export function hasMinimumRole(role: string | null | undefined, minimum: AppRole) {
  return ROLE_ORDER[normalizeRole(role)] >= ROLE_ORDER[normalizeRole(minimum)];
}
