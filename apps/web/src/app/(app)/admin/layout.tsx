import { requireAdminAccess } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAccess();
  return <>{children}</>;
}
