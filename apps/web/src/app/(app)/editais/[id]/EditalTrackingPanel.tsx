'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  upsertEditalTracking,
  recomputeEditalMatchesAction,
} from '@/app/(app)/actions/articulacao';
import { TRACKING_STATUS_CFG } from '@/app/(app)/articulacao/ArticulacaoClient';
import {
  Sparkles,
  MapPin,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Handshake,
  MessageSquare,
} from 'lucide-react';

export interface EditalMatchItem {
  id: string;
  edital_id: number;
  authority_id: string;
  demand_id: string | null;
  match_score: number;
  match_reasons: string[];
  tracking_status: string;
  notified_at: string | null;
  protocol_submitted: string | null;
  notes: string | null;
  authority_name: string;
  authority_role: string;
  authority_party: string | null;
  allied_status: string;
  authority_whatsapp: string | null;
  authority_phone: string | null;
  authority_email: string | null;
  municipality_name: string;
  macro_region: string | null;
  demand_title: string | null;
  demand_category: string | null;
  demand_estimated_value: number | null;
  demand_urgency: string | null;
}

interface AuthorityOption {
  id: string;
  name: string;
  party: string | null;
  municipality_name: string;
}

interface DemandOption {
  id: string;
  authority_id: string;
  title: string;
  category: string;
}

interface Props {
  edital: {
    id: number;
    titulo: string;
    orgao: string;
    ministerio: string;
    valor_estimado: number | null;
    data_proposta_fim: string | null;
    url_fonte: string | null;
    url_edital: string | null;
  };
  initialMatches: EditalMatchItem[];
  authorities: AuthorityOption[];
  demands: DemandOption[];
}

function fmtBRL(v?: number | string | null) {
  if (!v) return 'Conforme projeto';
  const n = Number(v);
  if (isNaN(n) || n === 0) return 'Conforme projeto';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function EditalTrackingPanel({
  edital,
  initialMatches,
  authorities,
  demands,
}: Props) {
  const router = useRouter();
  const [matches, setMatches] = useState<EditalMatchItem[]>(initialMatches);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAuthorityId, setSelectedAuthorityId] = useState(authorities[0]?.id ?? '');
  const [selectedDemandId, setSelectedDemandId] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const availableDemands = demands.filter((d) => d.authority_id === selectedAuthorityId);

  function handleStatusChange(m: EditalMatchItem, nextStatus: string) {
    startTransition(async () => {
      try {
        await upsertEditalTracking({
          edital_id: edital.id,
          authority_id: m.authority_id,
          demand_id: m.demand_id,
          tracking_status: nextStatus,
        });
        setMatches((prev) =>
          prev.map((x) =>
            x.authority_id === m.authority_id ? { ...x, tracking_status: nextStatus } : x,
          ),
        );
        router.refresh();
      } catch {}
    });
  }

  function handleRecompute() {
    startTransition(async () => {
      try {
        await recomputeEditalMatchesAction({ editalId: edital.id });
        router.refresh();
      } catch {}
    });
  }

  function handleManualLink(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAuthorityId) return;
    startTransition(async () => {
      try {
        await upsertEditalTracking({
          edital_id: edital.id,
          authority_id: selectedAuthorityId,
          demand_id: selectedDemandId || null,
          match_score: 85,
          match_reasons: ['Vinculado estrategicamente pela equipe do gabinete'],
          tracking_status: 'em_avaliacao',
          notes: manualNotes || null,
        });
        setShowAddForm(false);
        setManualNotes('');
        router.refresh();
      } catch {}
    });
  }

  function copyWhatsApp(m: EditalMatchItem) {
    const prazo = edital.data_proposta_fim
      ? new Date(edital.data_proposta_fim).toLocaleDateString('pt-BR')
      : 'Aberto';
    const link = edital.url_edital || edital.url_fonte || 'https://pncp.gov.br';
    const demTxt = m.demand_title ? `\n📌 *Demanda Vinculada:* ${m.demand_title}` : '';

    const msg = [
      `Olá, *Prefeito(a) ${m.authority_name}* (${m.municipality_name}/CE)!`,
      ``,
      `O gabinete da *Senadora Luizianne Lins* selecionou uma oportunidade aberta de captação federal compatível com o seu município:`,
      ``,
      `🏛️ *Órgão:* ${edital.ministerio || edital.orgao}`,
      `📄 *Edital:* ${edital.titulo}`,
      `💰 *Valor Estimado:* ${fmtBRL(edital.valor_estimado)}`,
      `⏳ *Prazo Final:* ${prazo}${demTxt}`,
      `🔗 *Link Oficial:* ${link}`,
      ``,
      `Estamos à disposição para articular tecnicamente o pleito de ${m.municipality_name} junto ao Ministério!`,
    ].join('\n');

    navigator.clipboard?.writeText(msg);
    setCopiedId(m.authority_id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <section
      id="traqueamento"
      className="stat-card space-y-4 border-l-4 border-l-purple-600"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Traqueamento com Prefeitos & Demandas Municipais ({matches.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Prefeitos da base aliada cujas demandas ou áreas prioritárias têm aderência a este
            edital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRecompute}
            disabled={pending}
            className="btn-secondary text-xs py-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pending ? 'animate-spin' : ''}`} />
            Recalcular Matches
          </button>
          {authorities.length > 0 && (
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="btn-primary text-xs py-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Vincular Prefeito a este Edital
            </button>
          )}
        </div>
      </div>

      {/* Manual Link Form */}
      {showAddForm && (
        <form
          onSubmit={handleManualLink}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs"
        >
          <p className="font-semibold text-slate-800">
            Vincular manualmente um Prefeito / Município a este Edital
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Prefeito(a) / Município *</label>
              <select
                value={selectedAuthorityId}
                onChange={(e) => {
                  setSelectedAuthorityId(e.target.value);
                  setSelectedDemandId('');
                }}
                className="input text-xs"
                required
              >
                {authorities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.municipality_name} — {a.name} ({a.party ?? 'S/P'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">
                Demanda Municipal Associada (opcional)
              </label>
              <select
                value={selectedDemandId}
                onChange={(e) => setSelectedDemandId(e.target.value)}
                className="input text-xs"
              >
                <option value="">Vínculo pelo perfil geral do município</option>
                {availableDemands.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.category}] {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Observação de Articulação</label>
            <input
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Ex: Prefeito solicitou apoio técnico na audiência de segunda-feira…"
              className="input text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary text-xs py-1.5"
            >
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="btn-primary text-xs py-1.5">
              Salvar Vínculo
            </button>
          </div>
        </form>
      )}

      {/* List of Matches */}
      {matches.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-8 text-center space-y-2">
          <Handshake className="w-7 h-7 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">
            Nenhum prefeito vinculado automaticamente a este edital ainda.
          </p>
          <p className="text-[11px] text-slate-400">
            Cadastre prefeitos e demandas na aba{' '}
            <Link href="/articulacao" className="text-brand-700 underline font-medium">
              Articulação Municipal
            </Link>{' '}
            ou vincule manualmente acima.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const st =
              TRACKING_STATUS_CFG[m.tracking_status] ?? TRACKING_STATUS_CFG.sugerido;
            const cleanWhats = (m.authority_whatsapp || m.authority_phone || '').replace(
              /\D/g,
              '',
            );

            return (
              <div
                key={m.authority_id}
                className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge bg-purple-600 text-white text-[11px] font-bold">
                      {Math.round(Number(m.match_score))}% Match
                    </span>
                    <span className={`badge border text-[11px] ${st.cls}`}>{st.label}</span>
                    <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {m.municipality_name}
                    </span>
                    {m.macro_region && (
                      <span className="text-[10px] text-slate-400">({m.macro_region})</span>
                    )}
                    <span className="text-xs font-semibold text-slate-800">
                      · {m.authority_name} {m.authority_party ? `(${m.authority_party})` : ''}
                    </span>
                  </div>

                  {m.demand_title && (
                    <p className="text-xs text-slate-700">
                      <strong className="text-slate-900">Demanda compatível:</strong>{' '}
                      {m.demand_title}
                      {m.demand_estimated_value ? (
                        <span className="text-emerald-700 font-semibold ml-1">
                          ({fmtBRL(m.demand_estimated_value)})
                        </span>
                      ) : null}
                    </p>
                  )}

                  {(m.match_reasons?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {m.match_reasons.map((r, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-white text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full"
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <select
                    value={m.tracking_status}
                    onChange={(e) => handleStatusChange(m, e.target.value)}
                    disabled={pending}
                    className="input text-xs py-1.5 px-2.5 w-auto font-medium bg-white"
                  >
                    {Object.entries(TRACKING_STATUS_CFG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => copyWhatsApp(m)}
                    className="btn-secondary text-xs py-1.5 px-2.5 bg-white"
                    title="Copiar mensagem de alerta para o Prefeito"
                  >
                    {copiedId === m.authority_id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Alerta WhatsApp
                      </>
                    )}
                  </button>

                  {cleanWhats && (
                    <a
                      href={`https://wa.me/55${cleanWhats}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1.5 px-2.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      title="Abrir conversa no WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
