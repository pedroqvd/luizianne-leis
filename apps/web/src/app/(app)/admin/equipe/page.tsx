import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InviteForm } from './InviteForm';
import { SubscriptionToggles } from './SubscriptionToggles';
import { MemberActions } from './MemberActions';
import { Users, Shield, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
}

interface Area {
  id: number;
  slug: string;
  label: string;
  description: string | null;
}

interface Subscription {
  user_id: string;
  area_id: number;
  enabled: boolean;
}

export default async function EquipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Verify admin role
  const { data: profile } = await admin
    .from('app_users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  const [{ data: users }, { data: areas }, { data: subscriptions }] = await Promise.all([
    admin.from('app_users').select('*').order('created_at'),
    admin.from('notification_areas').select('*').order('id'),
    admin.from('user_subscriptions').select('*'),
  ]);

  const members = (users ?? []) as AppUser[];
  const areasList = (areas ?? []) as Area[];
  const subsList = (subscriptions ?? []) as Subscription[];

  function isEnabled(userId: string, areaId: number) {
    return subsList.find((s) => s.user_id === userId && s.area_id === areaId)?.enabled ?? false;
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Gestão da Equipe</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie membros e controle quais notificações cada um recebe.
          </p>
        </div>
        <span className="badge bg-brand-50 text-brand-700 border border-brand-100 text-xs px-3 py-1">
          <Shield className="w-3 h-3" /> Admin
        </span>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400" />
          Convidar novo membro
        </h2>
        <InviteForm />
      </div>

      {/* Team table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">
            Membros ({members.length})
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Nenhum membro cadastrado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Membro
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Papel
                  </th>
                  {areasList.map((a) => (
                    <th key={a.id} className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                      {a.label}
                    </th>
                  ))}
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{m.name ?? '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{m.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge border text-[11px] ${
                        m.role === 'admin'
                          ? 'bg-brand-50 text-brand-700 border-brand-100'
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {m.role === 'admin' ? 'Admin' : 'Membro'}
                      </span>
                    </td>
                    {areasList.map((a) => (
                      <td key={a.id} className="px-4 py-4 text-center">
                        <SubscriptionToggles
                          userId={m.id}
                          areaId={a.id}
                          enabled={isEnabled(m.id, a.id)}
                          isSelf={m.id === user.id}
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <MemberActions
                        userId={m.id}
                        currentRole={m.role}
                        isSelf={m.id === user.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Areas legend */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {areasList.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
            <p className="text-sm font-semibold text-slate-900">{a.label}</p>
            <p className="text-xs text-slate-400 mt-1">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
