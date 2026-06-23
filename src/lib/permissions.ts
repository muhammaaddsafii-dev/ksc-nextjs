import type { UserRole } from '@/stores/authStore';

export type { UserRole };

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/': ['super_admin', 'admin_tender', 'admin_non_tender', 'admin_inventaris', 'admin_website'],
  '/kategori-dan-tahapan': ['super_admin', 'admin_tender', 'admin_non_tender'],
  '/tender': ['super_admin', 'admin_tender'],
  '/non-tender': ['super_admin', 'admin_non_tender'],
  '/pekerjaan': ['super_admin', 'admin_tender', 'admin_non_tender'],
  '/arsip': ['super_admin', 'admin_tender', 'admin_non_tender'],
  '/tenaga-ahli': ['super_admin', 'admin_inventaris'],
  '/dokumen': ['super_admin', 'admin_inventaris'],
  '/alat': ['super_admin', 'admin_inventaris'],
  '/website': ['super_admin', 'admin_website'],
  '/settings': ['super_admin', 'admin_tender', 'admin_non_tender', 'admin_inventaris', 'admin_website'],
  '/users': ['super_admin'],
};

export function canAccessRoute(role: UserRole | null | undefined, path: string): boolean {
  if (!role) return false;
  const allowed = ROUTE_PERMISSIONS[path];
  if (!allowed) return true;
  return allowed.includes(role);
}

export function isSuperAdmin(role: UserRole | null | undefined): boolean {
  return role === 'super_admin';
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin_tender: 'Admin Tender',
  admin_non_tender: 'Admin Non-Tender',
  admin_inventaris: 'Admin Inventaris',
  admin_website: 'Admin Website',
};
