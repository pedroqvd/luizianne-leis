'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  saveAuthority,
  deleteAuthority,
  saveAuthorityDemand,
  updateAuthorityDemandStatus,
  deleteAuthorityDemand,
  upsertEditalTracking,
  recomputeEditalMatchesAction,
  ALLOWED_DEMAND_CATEGORIES,
  type AuthorityInput,
  type AuthorityDemandInput,
} from '@/app/(app)/actions/articulacao';
import {
  Handshake,
  Plus,
  Search,
  MapPin,
  Building2,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
  Pencil,
  Trash2,
  RefreshCw,
  Shield,
  Calendar,
  DollarSign,
  Target,
  ChevronRight,
  X,
  Copy,
  Check,
  Landmark,
  Users,
  Lock,
} from 'lucide-react';

export interface Municipality {
  id: number;
  ibge_code: string;
  name: string;
  macro_region: string;
  population: number;
}

export interface Authority {
  id: string;
  municipality_id: number;
  name: string;
  role: string;
  party: string | null;
  allied_status: string;
  mayor_mandate: string | null;
  senator_votes: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  cabinet_chief_name: string | null;
  cabinet_chief_contact: string | null;
  priority_areas: string[];
  last_meeting_at: string | null;
  confidential_notes: string | null;
  municipality?: Municipality | Municipality[] | null;
}

export interface AuthorityDemand {
  id: string;
  authority_id: string;
  municipality_id: number;
  title: string;
  description: string | null;
  category: string;
  keywords: string[];
  estimated_value: number | null;
  urgency: string;
  status: string;
  target_ministry: string | null;
  protocol_number: string | null;
  assigned_to: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  assignee?: { name: string | null } | null;
}

export interface EditalTracking {
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
  updated_at: string;
  edital?: {
    id: number;
    titulo: string;
    orgao: string;
    ministerio: string;
    valor_estimado: number | null;
    data_proposta_fim: string | null;
    situacao: string;
    categoria_tematica: string | null;
    url_fonte: string | null;
    url_edital: string | null;
    modalidade: string | null;
    uf: string | null;
    municipio: string | null;
  } | null;
  demand?: {
    id: string;
    title: string;
    category: string;
    urgency: string;
    estimated_value: number | null;
  } | null;
}

export interface BudgetAmendment {
  id: number;
  code: string;
  year: number;
  locality: string;
  function_name: string | null;
  subfunction_name: string | null;
  action_name: string | null;
  value_empenhado: string | number;
  value_pago: string | number;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  municipalities: Municipality[];
  initialAuthorities: Authority[];
  initialDemands: AuthorityDemand[];
  initialTrackings: EditalTracking[];
  amendments: BudgetAmendment[];
  members: Member[];
}

const ROLE_LABELS: Record<string, string> = {
  prefeito: 'Prefeito(a)',
  vice_prefeito: 'Vice-Prefeito(a)',
  secretario_municipal: 'Secretário(a) Municipal',
  lideranca_local: 'Liderança Política',
  vereador_aliado: 'Vereador(a) Aliado(a)',
};

const ALLIED_CFG: Record<string, { label: string; cls: string }> = {
  aliado_base_elmano: {
    label: 'Aliado — Base Gov. Elmano / Sen. Luizianne',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  parceiro_estrategico: {
    label: 'Parceiro Estratégico',
    cls: 'bg-brand-50 text-brand-700 border-brand-200',
  },
  em_articulacao: {
    label: 'Em Articulação',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  institucional: {
    label: 'Relação Institucional',
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

const DEMAND_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  mapeada:          { label: 'Mapeada',             cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  em_analise:       { label: 'Em Análise Técnica',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  vinculada_edital: { label: 'Vinculada a Edital',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  emenda_alocada:   { label: 'Emenda Alocada',      cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  em_execucao:      { label: 'Em Execução',         cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  atendida:         { label: 'Atendida / Concluída',cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  arquivada:        { label: 'Arquivada',           cls: 'bg-slate-50 text-slate-400 border-slate-200' },
};

const URGENCY_CFG: Record<string, { label: string; cls: string }> = {
  critica: { label: 'Crítica', cls: 'bg-red-600 text-white border-red-600' },
  alta:    { label: 'Alta',    cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  media:   { label: 'Média',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  baixa:   { label: 'Baixa',   cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const TRACKING_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  sugerido:            { label: 'Match Sugerido',       cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  em_avaliacao:        { label: 'Em Avaliação Gabinete',cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  prefeito_notificado: { label: 'Prefeito Notificado',  cls: 'bg-brand-50 text-brand-700 border-brand-200' },
  elaborando_projeto:  { label: 'Elaborando Projeto',   cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  proposta_enviada:    { label: 'Proposta Protocolada', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  contemplado:         { label: 'Contemplado / Aprovado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  descartado:          { label: 'Não Aplicável',        cls: 'bg-slate-100 text-slate-400 border-slate-200' },
};

function fmtBRL(v?: number | string | null) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtCompactBRL(v?: number | string | null) {
  if (v == null) return 'R$ 0';
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return 'R$ 0';
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(2)} bi`;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)} mi`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)} mil`;
  return fmtBRL(n);
}

function getMun(auth: Authority, munMap: Map<number, Municipality>): Municipality | undefined {
  if (auth.municipality) {
    return Array.isArray(auth.municipality) ? auth.municipality[0] : auth.municipality;
  }
  return munMap.get(auth.municipality_id);
}

function normalizeStr(s?: string | null) {
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function ArticulacaoClient({
  municipalities,
  initialAuthorities,
  initialDemands,
  initialTrackings,
  amendments,
  members,
}: Props) {
  const [authorities, setAuthorities] = useState<Authority[]>(initialAuthorities);
  const [demands, setDemands] = useState<AuthorityDemand[]>(initialDemands);
  const [trackings, setTrackings] = useState<EditalTracking[]>(initialTrackings);

  const [activeView, setActiveView] = useState<'prefeitos' | 'demandas' | 'radar'>('prefeitos');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [alliedFilter, setAlliedFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [onlyWithMatches, setOnlyWithMatches] = useState(false);

  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string | null>(null);
  const [dossierTab, setDossierTab] = useState<'demandas' | 'editais' | 'emendas'>('demandas');

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingAuth, setEditingAuth] = useState<Authority | null>(null);

  const [showDemandModal, setShowDemandModal] = useState(false);
  const [editingDemand, setEditingDemand] = useState<AuthorityDemand | null>(null);
  const [defaultDemandAuthorityId, setDefaultDemandAuthorityId] = useState<string>('');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const munMap = useMemo(() => {
    const m = new Map<number, Municipality>();
    for (const item of municipalities) m.set(item.id, item);
    return m;
  }, [municipalities]);

  const authMap = useMemo(() => {
    const m = new Map<string, Authority>();
    for (const a of authorities) m.set(a.id, a);
    return m;
  }, [authorities]);

  const macroRegions = useMemo(() => {
    return Array.from(new Set(municipalities.map((m) => m.macro_region))).sort();
  }, [municipalities]);

  const parties = useMemo(() => {
    return Array.from(
      new Set(authorities.map((a) => a.party).filter((p): p is string => Boolean(p))),
    ).sort();
  }, [authorities]);

  const demandsByAuthority = useMemo(() => {
    const map = new Map<string, AuthorityDemand[]>();
    for (const d of demands) {
      const list = map.get(d.authority_id) ?? [];
      list.push(d);
      map.set(d.authority_id, list);
    }
    return map;
  }, [demands]);

  const activeTrackingsByAuthority = useMemo(() => {
    const map = new Map<string, EditalTracking[]>();
    for (const t of trackings) {
      if (t.tracking_status === 'descartado') continue;
      if (t.edital && t.edital.situacao !== 'aberto') continue;
      const list = map.get(t.authority_id) ?? [];
      list.push(t);
      map.set(t.authority_id, list);
    }
    return map;
  }, [trackings]);

  // KPIs
  const kpis = useMemo(() => {
    const totalAuthorities = authorities.length;
    const baseElmanoCount = authorities.filter(
      (a) => a.allied_status === 'aliado_base_elmano' || a.allied_status === 'parceiro_estrategico',
    ).length;
    const activeDemands = demands.filter((d) => d.status !== 'arquivada');
    const criticalDemands = activeDemands.filter(
      (d) => d.urgency === 'critica' || d.urgency === 'alta',
    ).length;
    const totalRequestedValue = activeDemands.reduce(
      (acc, d) => acc + Number(d.estimated_value ?? 0),
      0,
    );
    const activeMatches = trackings.filter(
      (t) => t.tracking_status !== 'descartado' && (!t.edital || t.edital.situacao === 'aberto'),
    );
    const mayorsWithMatches = new Set(activeMatches.map((t) => t.authority_id)).size;
    const mobilizedProjects = trackings.filter((t) =>
      ['prefeito_notificado', 'elaborando_projeto', 'proposta_enviada', 'contemplado'].includes(
        t.tracking_status,
      ),
    ).length;

    return {
      totalAuthorities,
      baseElmanoCount,
      totalDemands: activeDemands.length,
      criticalDemands,
      totalRequestedValue,
      activeMatchesCount: activeMatches.length,
      mayorsWithMatches,
      mobilizedProjects,
    };
  }, [authorities, demands, trackings]);

  // Filtered Authorities
  const filteredAuthorities = useMemo(() => {
    const q = normalizeStr(search);
    return authorities.filter((auth) => {
      const mun = getMun(auth, munMap);
      const authDemands = demandsByAuthority.get(auth.id) ?? [];
      const authMatches = activeTrackingsByAuthority.get(auth.id) ?? [];

      if (regionFilter && mun?.macro_region !== regionFilter) return false;
      if (alliedFilter && auth.allied_status !== alliedFilter) return false;
      if (partyFilter && auth.party !== partyFilter) return false;
      if (categoryFilter) {
        const hasCat =
          (auth.priority_areas ?? []).includes(categoryFilter) ||
          authDemands.some((d) => d.category === categoryFilter);
        if (!hasCat) return false;
      }
      if (onlyWithMatches && authMatches.length === 0) return false;

      if (q) {
        const hay = normalizeStr(
          [
            auth.name,
            auth.party ?? '',
            mun?.name ?? '',
            mun?.macro_region ?? '',
            ...authDemands.map((d) => d.title),
          ].join(' '),
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    authorities,
    munMap,
    demandsByAuthority,
    activeTrackingsByAuthority,
    regionFilter,
    alliedFilter,
    partyFilter,
    categoryFilter,
    onlyWithMatches,
    search,
  ]);

  // Filtered Demands
  const filteredDemands = useMemo(() => {
    const q = normalizeStr(search);
    return demands.filter((d) => {
      const auth = authMap.get(d.authority_id);
      const mun = auth ? getMun(auth, munMap) : munMap.get(d.municipality_id);

      if (regionFilter && mun?.macro_region !== regionFilter) return false;
      if (alliedFilter && auth && auth.allied_status !== alliedFilter) return false;
      if (partyFilter && auth?.party !== partyFilter) return false;
      if (categoryFilter && d.category !== categoryFilter) return false;

      if (q) {
        const hay = normalizeStr(
          [
            d.title,
            d.description ?? '',
            d.category,
            d.target_ministry ?? '',
            auth?.name ?? '',
            mun?.name ?? '',
          ].join(' '),
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [demands, authMap, munMap, regionFilter, alliedFilter, partyFilter, categoryFilter, search]);

  // Filtered Trackings
  const filteredTrackings = useMemo(() => {
    const q = normalizeStr(search);
    return trackings.filter((t) => {
      if (t.tracking_status === 'descartado') return false;
      const auth = authMap.get(t.authority_id);
      const mun = auth ? getMun(auth, munMap) : undefined;

      if (regionFilter && mun?.macro_region !== regionFilter) return false;
      if (alliedFilter && auth && auth.allied_status !== alliedFilter) return false;
      if (partyFilter && auth?.party !== partyFilter) return false;
      if (
        categoryFilter &&
        t.edital?.categoria_tematica !== categoryFilter &&
        t.demand?.category !== categoryFilter
      ) {
        return false;
      }

      if (q) {
        const hay = normalizeStr(
          [
            t.edital?.titulo ?? '',
            t.edital?.orgao ?? '',
            t.demand?.title ?? '',
            auth?.name ?? '',
            mun?.name ?? '',
          ].join(' '),
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [trackings, authMap, munMap, regionFilter, alliedFilter, partyFilter, categoryFilter, search]);

  const selectedAuthority = useMemo(
    () => (selectedAuthorityId ? authMap.get(selectedAuthorityId) ?? null : null),
    [selectedAuthorityId, authMap],
  );

  function handleRecomputeMatches() {
    setFeedbackMsg(null);
    startTransition(async () => {
      try {
        const res = await recomputeEditalMatchesAction();
        setFeedbackMsg({
          type: 'ok',
          text: `Cruzamento concluído! ${res.matchesUpserted} vínculos entre editais abertos e demandas de prefeitos atualizados.`,
        });
        window.location.reload();
      } catch (e: any) {
        setFeedbackMsg({
          type: 'err',
          text: e?.message ?? 'Erro ao recalcular matches.',
        });
      }
    });
  }

  function handleUpdateTrackingStatus(t: EditalTracking, nextStatus: string) {
    startTransition(async () => {
      try {
        await upsertEditalTracking({
          edital_id: t.edital_id,
          authority_id: t.authority_id,
          demand_id: t.demand_id,
          tracking_status: nextStatus,
        });
        setTrackings((prev) =>
          prev.map((item) =>
            item.id === t.id ? { ...item, tracking_status: nextStatus } : item,
          ),
        );
      } catch (e: any) {
        setFeedbackMsg({ type: 'err', text: e?.message ?? 'Erro ao atualizar traqueamento.' });
      }
    });
  }

  function buildWhatsAppMessage(t: EditalTracking, auth: Authority, munName: string) {
    const ed = t.edital;
    const prazo = ed?.data_proposta_fim
      ? new Date(ed.data_proposta_fim).toLocaleDateString('pt-BR')
      : 'Aberto';
    const valor = ed?.valor_estimado ? fmtBRL(ed.valor_estimado) : 'Conforme projeto';
    const link = ed?.url_edital || ed?.url_fonte || 'https://pncp.gov.br';
    const demandaTxt = t.demand?.title
      ? `\n📌 *Demanda Vinculada de ${munName}:* ${t.demand.title}`
      : '';

    return [
      `Olá, *${ROLE_LABELS[auth.role] ?? 'Prefeito(a)'} ${auth.name}* (${munName}/CE)!`,
      ``,
      `A equipe de Articulação Municipal do gabinete da *Senadora Luizianne Lins* identificou um edital aberto altamente compatível (${Math.round(Number(t.match_score))}% de aderência) com as prioridades do seu município:`,
      ``,
      `🏛️ *Órgão:* ${ed?.ministerio ?? ed?.orgao ?? 'Governo Federal'}`,
      `📄 *Edital:* ${ed?.titulo ?? `#${t.edital_id}`}`,
      `💰 *Valor Estimado:* ${valor}`,
      `⏳ *Prazo Final:* ${prazo}${demandaTxt}`,
      `🔗 *Link Oficial:* ${link}`,
      ``,
      `Nosso gabinete está à disposição para apoiar a prefeitura na articulação técnica junto ao ministério. Podemos alinhar o protocolo do projeto?`,
    ].join('\n');
  }

  function copyWhatsAppAlert(t: EditalTracking, auth: Authority, munName: string) {
    const msg = buildWhatsAppMessage(t, auth, munName);
    navigator.clipboard?.writeText(msg);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              <Shield className="w-3 h-3" /> Articulação Política & Municipal · Sigiloso
            </span>
          </div>
          <h1 className="page-title mt-1.5">Articulação Municipal & Prefeitos Aliados</h1>
          <p className="text-sm text-slate-500 mt-1">
            Base de prefeitos(as) e lideranças do Ceará (Aliança Gov. Elmano & Sen. Luizianne Lins),
            carteira de demandas municipais e traqueamento inteligente de editais federais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRecomputeMatches}
            disabled={pending}
            className="btn-secondary text-xs py-2"
            title="Cruzar todas as demandas dos prefeitos com os editais abertos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pending ? 'animate-spin' : ''}`} />
            Cruzar Editais × Demandas
          </button>
          <button
            onClick={() => {
              if (!authorities.length) {
                setEditingAuth(null);
                setShowAuthModal(true);
                return;
              }
              setEditingDemand(null);
              setDefaultDemandAuthorityId(selectedAuthorityId ?? authorities[0]?.id ?? '');
              setShowDemandModal(true);
            }}
            className="btn-secondary text-xs py-2 border-brand-200 text-brand-700 hover:bg-brand-50"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Demanda Municipal
          </button>
          <button
            onClick={() => {
              setEditingAuth(null);
              setShowAuthModal(true);
            }}
            className="btn-primary text-xs py-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Prefeito / Liderança
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs border ${
            feedbackMsg.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Strategic KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Prefeitos & Lideranças</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalAuthorities}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {kpis.baseElmanoCount} da Base Aliada Elmano
              </p>
            </div>
            <div className="p-2 bg-brand-50 rounded-xl">
              <Handshake className="w-5 h-5 text-brand-700" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Demandas Mapeadas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalDemands}</p>
              <p className="text-xs text-orange-600 font-medium mt-1">
                {kpis.criticalDemands} de urgência alta/crítica
              </p>
            </div>
            <div className="p-2 bg-orange-50 rounded-xl">
              <ClipboardList className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Volume Demandado</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {fmtCompactBRL(kpis.totalRequestedValue)}
              </p>
              <p className="text-xs text-slate-400 mt-1">em pleitos municipais</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Matches de Editais</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{kpis.activeMatchesCount}</p>
              <p className="text-xs text-slate-500 mt-1">
                para {kpis.mayorsWithMatches} prefeitura(s)
              </p>
            </div>
            <div className="p-2 bg-purple-50 rounded-xl">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Prefeitos Mobilizados</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{kpis.mobilizedProjects}</p>
              <p className="text-xs text-slate-400 mt-1">notificados / com projeto</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </section>

      {/* View Switcher + Filter Bar */}
      <div className="stat-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveView('prefeitos')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                activeView === 'prefeitos'
                  ? 'bg-brand-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Prefeitos & Municípios ({filteredAuthorities.length})
            </button>
            <button
              onClick={() => setActiveView('demandas')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                activeView === 'demandas'
                  ? 'bg-brand-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Carteira de Demandas ({filteredDemands.length})
            </button>
            <button
              onClick={() => setActiveView('radar')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                activeView === 'radar'
                  ? 'bg-brand-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Traqueamento Editais × Prefeitos ({filteredTrackings.length})
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyWithMatches}
              onChange={(e) => setOnlyWithMatches(e.target.checked)}
              className="rounded border-slate-300 text-brand-700 focus:ring-brand-600"
            />
            Apenas com Editais Compatíveis Abertos
          </label>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Município, prefeito(a) ou demanda…"
              className="input pl-9 text-xs"
            />
          </div>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="input text-xs"
          >
            <option value="">Todas as 14 Macrorregiões (CE)</option>
            {macroRegions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={alliedFilter}
            onChange={(e) => setAlliedFilter(e.target.value)}
            className="input text-xs"
          >
            <option value="">Todos os Perfis de Aliança</option>
            {Object.entries(ALLIED_CFG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <select
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            className="input text-xs"
          >
            <option value="">Todos os Partidos</option>
            {parties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input text-xs"
          >
            <option value="">Todas as Áreas Prioritárias</option>
            {ALLOWED_DEMAND_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: PREFEITOS & MUNICÍPIOS */}
      {activeView === 'prefeitos' && (
        <div>
          {filteredAuthorities.length === 0 ? (
            <div className="stat-card py-16 text-center space-y-3">
              <Handshake className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="max-w-md mx-auto">
                <p className="text-sm font-semibold text-slate-700">
                  Nenhum prefeito ou liderança encontrada
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Cadastre os prefeitos da base aliada (Gov. Elmano & Senadora Luizianne Lins) e
                  suas demandas para ativar o radar automático de editais federais.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingAuth(null);
                  setShowAuthModal(true);
                }}
                className="btn-primary text-xs mx-auto"
              >
                <Plus className="w-4 h-4" /> Cadastrar Primeiro Prefeito
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAuthorities.map((auth) => {
                const mun = getMun(auth, munMap);
                const authDemands = demandsByAuthority.get(auth.id) ?? [];
                const authMatches = activeTrackingsByAuthority.get(auth.id) ?? [];
                const allied = ALLIED_CFG[auth.allied_status] ?? ALLIED_CFG.aliado_base_elmano;
                const totalDemValue = authDemands.reduce(
                  (acc, d) => acc + Number(d.estimated_value ?? 0),
                  0,
                );

                return (
                  <div
                    key={auth.id}
                    className="stat-card hover:shadow-card-hover transition-all flex flex-col justify-between gap-4 border border-slate-100"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wide text-brand-700 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {mun?.name ?? 'Município'}
                            </span>
                            {mun?.macro_region && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {mun.macro_region}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">{auth.name}</h3>
                          <p className="text-xs text-slate-500">
                            {ROLE_LABELS[auth.role] ?? auth.role}
                            {auth.party ? ` · ${auth.party}` : ''}
                            {auth.mayor_mandate ? ` · ${auth.mayor_mandate}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingAuth(auth);
                              setShowAuthModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50"
                            title="Editar Perfil"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span className={`badge border text-[10px] ${allied.cls}`}>
                          {allied.label}
                        </span>
                        {authMatches.length > 0 && (
                          <span className="badge border bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-semibold">
                            <Sparkles className="w-3 h-3" /> {authMatches.length} edital(is) compatível(is)
                          </span>
                        )}
                      </div>

                      {(auth.priority_areas?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {auth.priority_areas.slice(0, 4).map((area) => (
                            <span
                              key={area}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Mini stats */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="bg-slate-50 rounded-lg p-2">
                          <span className="text-[10px] text-slate-400 block">Demandas</span>
                          <span className="font-bold text-slate-800">{authDemands.length}</span>
                          {totalDemValue > 0 && (
                            <span className="text-[10px] text-slate-500 ml-1">
                              ({fmtCompactBRL(totalDemValue)})
                            </span>
                          )}
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <span className="text-[10px] text-slate-400 block">População (IBGE)</span>
                          <span className="font-semibold text-slate-700">
                            {mun?.population
                              ? mun.population.toLocaleString('pt-BR')
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setEditingDemand(null);
                          setDefaultDemandAuthorityId(auth.id);
                          setShowDemandModal(true);
                        }}
                        className="text-xs font-medium text-slate-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Demanda
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAuthorityId(auth.id);
                          setDossierTab(authMatches.length > 0 ? 'editais' : 'demandas');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                      >
                        Abrir Dossiê 360º <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CARTEIRA CONSOLIDADA DE DEMANDAS MUNICIPAIS */}
      {activeView === 'demandas' && (
        <div className="space-y-3">
          {filteredDemands.length === 0 ? (
            <div className="stat-card py-14 text-center text-sm text-slate-400">
              Nenhuma demanda municipal encontrada para os filtros selecionados.
            </div>
          ) : (
            filteredDemands.map((dem) => {
              const auth = authMap.get(dem.authority_id);
              const mun = auth ? getMun(auth, munMap) : munMap.get(dem.municipality_id);
              const st = DEMAND_STATUS_CFG[dem.status] ?? DEMAND_STATUS_CFG.mapeada;
              const urg = URGENCY_CFG[dem.urgency] ?? URGENCY_CFG.alta;
              const relatedMatches = trackings.filter(
                (t) => t.demand_id === dem.id && t.tracking_status !== 'descartado',
              );

              return (
                <div
                  key={dem.id}
                  className="stat-card hover:shadow-card-hover transition-shadow flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`badge border text-[10px] font-semibold ${urg.cls}`}>
                        Urgência {urg.label}
                      </span>
                      <span className={`badge border text-[10px] ${st.cls}`}>{st.label}</span>
                      <span className="badge bg-slate-100 text-slate-700 text-[10px] capitalize">
                        {dem.category}
                      </span>
                      {mun && (
                        <span className="text-xs font-semibold text-brand-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {mun.name}
                        </span>
                      )}
                      {auth && (
                        <button
                          onClick={() => {
                            setSelectedAuthorityId(auth.id);
                            setDossierTab('demandas');
                          }}
                          className="text-xs text-slate-500 hover:text-brand-700 underline"
                        >
                          {auth.name} ({auth.party ?? 'S/P'})
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{dem.title}</h3>
                    {dem.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{dem.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      {dem.estimated_value && (
                        <span>
                          Valor Estimado:{' '}
                          <strong className="text-emerald-700">{fmtBRL(dem.estimated_value)}</strong>
                        </span>
                      )}
                      {dem.target_ministry && (
                        <span>
                          Órgão Alvo: <strong className="text-slate-700">{dem.target_ministry}</strong>
                        </span>
                      )}
                      {dem.protocol_number && (
                        <span>
                          Protocolo: <strong className="font-mono">{dem.protocol_number}</strong>
                        </span>
                      )}
                      {relatedMatches.length > 0 && (
                        <button
                          onClick={() => {
                            if (auth) {
                              setSelectedAuthorityId(auth.id);
                              setDossierTab('editais');
                            }
                          }}
                          className="text-purple-700 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {relatedMatches.length} edital(is) aberto(s) compatível(is)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                    <select
                      value={dem.status}
                      onChange={(e) => {
                        const next = e.target.value;
                        startTransition(async () => {
                          try {
                            await updateAuthorityDemandStatus(dem.id, next);
                            setDemands((prev) =>
                              prev.map((x) => (x.id === dem.id ? { ...x, status: next } : x)),
                            );
                          } catch {}
                        });
                      }}
                      className="input text-xs py-1.5 px-2.5 w-auto"
                    >
                      {Object.entries(DEMAND_STATUS_CFG).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingDemand(dem);
                          setDefaultDemandAuthorityId(dem.authority_id);
                          setShowDemandModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50"
                        title="Editar Demanda"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm('Excluir esta demanda municipal?')) return;
                          startTransition(async () => {
                            try {
                              await deleteAuthorityDemand(dem.id);
                              setDemands((prev) => prev.filter((x) => x.id !== dem.id));
                            } catch {}
                          });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Excluir Demanda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 3: RADAR & TRAQUEAMENTO EDITAIS x PREFEITOS */}
      {activeView === 'radar' && (
        <div className="space-y-3">
          {filteredTrackings.length === 0 ? (
            <div className="stat-card py-14 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-purple-300 mx-auto" />
              <p className="text-sm font-medium text-slate-600">
                Nenhum match de edital encontrado para os filtros atuais.
              </p>
              <button onClick={handleRecomputeMatches} className="btn-primary text-xs mx-auto">
                <RefreshCw className="w-3.5 h-3.5" /> Executar Cruzamento Agora
              </button>
            </div>
          ) : (
            filteredTrackings.map((t) => {
              const auth = authMap.get(t.authority_id);
              const mun = auth ? getMun(auth, munMap) : undefined;
              const munName = mun?.name ?? 'Município';
              const trCfg =
                TRACKING_STATUS_CFG[t.tracking_status] ?? TRACKING_STATUS_CFG.sugerido;

              return (
                <div
                  key={t.id}
                  className="stat-card hover:shadow-card-hover transition-shadow space-y-3 border-l-4 border-l-purple-600"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge bg-purple-600 text-white text-[11px] font-bold">
                          <Sparkles className="w-3 h-3" /> {Math.round(Number(t.match_score))}% Aderência
                        </span>
                        <span className={`badge border text-[11px] ${trCfg.cls}`}>
                          {trCfg.label}
                        </span>
                        <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {munName}
                        </span>
                        {auth && (
                          <span className="text-xs text-slate-600 font-medium">
                            · {ROLE_LABELS[auth.role] ?? 'Prefeito(a)'} {auth.name} (
                            {auth.party ?? 'S/P'})
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Link
                          href={`/editais/${t.edital_id}`}
                          className="text-sm font-bold text-slate-900 hover:text-brand-700 transition-colors block"
                        >
                          {t.edital?.titulo ?? `Edital #${t.edital_id}`}
                        </Link>
                        <p className="text-xs text-slate-500">
                          Órgão: <strong className="text-slate-700">{t.edital?.ministerio ?? t.edital?.orgao}</strong>
                          {t.edital?.valor_estimado ? (
                            <>
                              {' '}
                              · Valor Estimado:{' '}
                              <strong className="text-emerald-700">
                                {fmtBRL(t.edital.valor_estimado)}
                              </strong>
                            </>
                          ) : null}
                          {t.edital?.data_proposta_fim ? (
                            <>
                              {' '}
                              · Encerra em:{' '}
                              <strong className="text-red-600">
                                {new Date(t.edital.data_proposta_fim).toLocaleDateString('pt-BR')}
                              </strong>
                            </>
                          ) : null}
                        </p>
                      </div>

                      {t.demand && (
                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs">
                          <span className="font-semibold text-slate-700">
                            Demanda Municipal Atendida:{' '}
                          </span>
                          <span className="text-slate-600">{t.demand.title}</span>
                        </div>
                      )}

                      {(t.match_reasons?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {t.match_reasons.map((r, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full"
                            >
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2 flex-shrink-0">
                      <select
                        value={t.tracking_status}
                        onChange={(e) => handleUpdateTrackingStatus(t, e.target.value)}
                        className="input text-xs py-1.5 px-2.5 w-auto font-medium"
                      >
                        {Object.entries(TRACKING_STATUS_CFG).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>

                      {auth && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyWhatsAppAlert(t, auth, munName)}
                            className="btn-secondary text-xs py-1.5 px-2.5"
                            title="Copiar mensagem pronta para enviar ao Prefeito no WhatsApp"
                          >
                            {copiedId === t.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Alerta p/ Prefeito
                              </>
                            )}
                          </button>

                          <Link
                            href={`/editais/${t.edital_id}`}
                            className="btn-secondary text-xs py-1.5 px-2.5"
                          >
                            Ver Edital <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DOSSIÊ 360º DO PREFEITO (MODAL / DRAWER) */}
      {selectedAuthority && (
        <MayorDossierModal
          authority={selectedAuthority}
          municipality={getMun(selectedAuthority, munMap)}
          demands={demandsByAuthority.get(selectedAuthority.id) ?? []}
          trackings={activeTrackingsByAuthority.get(selectedAuthority.id) ?? []}
          amendments={amendments}
          activeTab={dossierTab}
          setActiveTab={setDossierTab}
          onClose={() => setSelectedAuthorityId(null)}
          onEditAuthority={() => {
            setEditingAuth(selectedAuthority);
            setShowAuthModal(true);
          }}
          onDeleteAuthority={() => {
            if (!confirm(`Excluir o cadastro de ${selectedAuthority.name}?`)) return;
            startTransition(async () => {
              await deleteAuthority(selectedAuthority.id);
              setAuthorities((prev) => prev.filter((a) => a.id !== selectedAuthority.id));
              setSelectedAuthorityId(null);
            });
          }}
          onAddDemand={() => {
            setEditingDemand(null);
            setDefaultDemandAuthorityId(selectedAuthority.id);
            setShowDemandModal(true);
          }}
          onEditDemand={(dem) => {
            setEditingDemand(dem);
            setDefaultDemandAuthorityId(selectedAuthority.id);
            setShowDemandModal(true);
          }}
          onUpdateTrackingStatus={handleUpdateTrackingStatus}
          onCopyWhatsApp={copyWhatsAppAlert}
          copiedId={copiedId}
        />
      )}

      {/* MODAL: CADASTRAR / EDITAR PREFEITO OU LIDERANÇA */}
      {showAuthModal && (
        <AuthorityModal
          municipalities={municipalities}
          initial={editingAuth}
          onClose={() => {
            setShowAuthModal(false);
            setEditingAuth(null);
          }}
          onSaved={(saved) => {
            setAuthorities((prev) => {
              const exists = prev.some((a) => a.id === saved.id);
              return exists
                ? prev.map((a) => (a.id === saved.id ? saved : a))
                : [saved, ...prev];
            });
            setShowAuthModal(false);
            setEditingAuth(null);
          }}
        />
      )}

      {/* MODAL: CADASTRAR / EDITAR DEMANDA MUNICIPAL */}
      {showDemandModal && (
        <AuthorityDemandModal
          authorities={authorities}
          munMap={munMap}
          members={members}
          defaultAuthorityId={defaultDemandAuthorityId}
          initial={editingDemand}
          onClose={() => {
            setShowDemandModal(false);
            setEditingDemand(null);
          }}
          onSaved={(saved) => {
            setDemands((prev) => {
              const exists = prev.some((d) => d.id === saved.id);
              return exists
                ? prev.map((d) => (d.id === saved.id ? saved : d))
                : [saved, ...prev];
            });
            setShowDemandModal(false);
            setEditingDemand(null);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================================
 * SUBCOMPONENT: DOSSIÊ 360º DO PREFEITO / MUNICÍPIO
 * ========================================================================== */
function MayorDossierModal({
  authority,
  municipality,
  demands,
  trackings,
  amendments,
  activeTab,
  setActiveTab,
  onClose,
  onEditAuthority,
  onDeleteAuthority,
  onAddDemand,
  onEditDemand,
  onUpdateTrackingStatus,
  onCopyWhatsApp,
  copiedId,
}: {
  authority: Authority;
  municipality?: Municipality;
  demands: AuthorityDemand[];
  trackings: EditalTracking[];
  amendments: BudgetAmendment[];
  activeTab: 'demandas' | 'editais' | 'emendas';
  setActiveTab: (t: 'demandas' | 'editais' | 'emendas') => void;
  onClose: () => void;
  onEditAuthority: () => void;
  onDeleteAuthority: () => void;
  onAddDemand: () => void;
  onEditDemand: (d: AuthorityDemand) => void;
  onUpdateTrackingStatus: (t: EditalTracking, status: string) => void;
  onCopyWhatsApp: (t: EditalTracking, auth: Authority, munName: string) => void;
  copiedId: string | null;
}) {
  const munName = municipality?.name ?? 'Município';
  const allied = ALLIED_CFG[authority.allied_status] ?? ALLIED_CFG.aliado_base_elmano;

  const munAmendments = useMemo(() => {
    const target = normalizeStr(munName);
    if (!target) return [];
    return amendments.filter((a) => normalizeStr(a.locality).includes(target));
  }, [amendments, munName]);

  const cleanWhats = (authority.whatsapp || authority.phone || '').replace(/\D/g, '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white h-full w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dossier Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {munName} / CE
              </span>
              {municipality?.macro_region && (
                <span className="text-[11px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-full">
                  {municipality.macro_region}
                </span>
              )}
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-medium">
                {allied.label}
              </span>
            </div>
            <h2 className="text-xl font-bold">
              {authority.name}{' '}
              {authority.party && (
                <span className="text-sm font-normal text-slate-300">({authority.party})</span>
              )}
            </h2>
            <p className="text-xs text-slate-300">
              {ROLE_LABELS[authority.role] ?? authority.role}
              {authority.mayor_mandate ? ` · ${authority.mayor_mandate}` : ''}
              {municipality?.population
                ? ` · População: ${municipality.population.toLocaleString('pt-BR')} hab.`
                : ''}
              {authority.senator_votes
                ? ` · Votos Senadora: ${authority.senator_votes.toLocaleString('pt-BR')}`
                : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEditAuthority}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Editar Perfil"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDeleteAuthority}
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500/30 text-red-300 transition-colors"
              title="Excluir Perfil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          {authority.whatsapp && (
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp: <strong>{authority.whatsapp}</strong>
              {cleanWhats && (
                <a
                  href={`https://wa.me/55${cleanWhats}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline ml-1"
                >
                  Abrir Chat
                </a>
              )}
            </span>
          )}
          {authority.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {authority.phone}
            </span>
          )}
          {authority.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {authority.email}
            </span>
          )}
          {authority.cabinet_chief_name && (
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Chefe de Gabinete: <strong>{authority.cabinet_chief_name}</strong>
              {authority.cabinet_chief_contact ? ` (${authority.cabinet_chief_contact})` : ''}
            </span>
          )}
          {authority.last_meeting_at && (
            <span className="flex items-center gap-1.5 ml-auto">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Última audiência:{' '}
              <strong>
                {new Date(authority.last_meeting_at + 'T12:00:00').toLocaleDateString('pt-BR')}
              </strong>
            </span>
          )}
        </div>

        {/* Dossier Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex gap-2 bg-white">
          <button
            onClick={() => setActiveTab('demandas')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'demandas'
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Demandas do Prefeito ({demands.length})
          </button>
          <button
            onClick={() => setActiveTab('editais')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'editais'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Editais Compatíveis & Traqueamento ({trackings.length})
          </button>
          <button
            onClick={() => setActiveTab('emendas')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'emendas'
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            Emendas & Notas Sigilosas ({munAmendments.length})
          </button>
        </div>

        {/* Dossier Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {activeTab === 'demandas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Pleitos prioritários apresentados pela prefeitura de <strong>{munName}</strong>.
                </p>
                <button onClick={onAddDemand} className="btn-primary text-xs py-1.5">
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Demanda de {munName}
                </button>
              </div>

              {demands.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">
                  Nenhuma demanda cadastrada ainda para {authority.name}.
                </div>
              ) : (
                <div className="space-y-3">
                  {demands.map((d) => {
                    const st = DEMAND_STATUS_CFG[d.status] ?? DEMAND_STATUS_CFG.mapeada;
                    const urg = URGENCY_CFG[d.urgency] ?? URGENCY_CFG.alta;
                    return (
                      <div
                        key={d.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`badge border text-[10px] ${urg.cls}`}>
                              {urg.label}
                            </span>
                            <span className={`badge border text-[10px] ${st.cls}`}>
                              {st.label}
                            </span>
                            <span className="badge bg-slate-100 text-slate-700 text-[10px] capitalize">
                              {d.category}
                            </span>
                          </div>
                          <button
                            onClick={() => onEditDemand(d)}
                            className="text-xs text-brand-700 hover:underline flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{d.title}</h4>
                        {d.description && (
                          <p className="text-xs text-slate-600">{d.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                          {d.estimated_value && (
                            <span>
                              Valor: <strong className="text-emerald-700">{fmtBRL(d.estimated_value)}</strong>
                            </span>
                          )}
                          {d.target_ministry && (
                            <span>
                              Ministério Alvo: <strong>{d.target_ministry}</strong>
                            </span>
                          )}
                          {d.protocol_number && (
                            <span>
                              Protocolo: <strong className="font-mono">{d.protocol_number}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'editais' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Editais abertos selecionados automaticamente pelo motor de cruzamento para{' '}
                <strong>{munName}</strong>.
              </p>

              {trackings.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">
                  Nenhum edital aberto compatível no momento. Cadastre novas demandas temáticas ou
                  clique em &ldquo;Cruzar Editais × Demandas&rdquo;.
                </div>
              ) : (
                <div className="space-y-3">
                  {trackings.map((t) => {
                    const trCfg =
                      TRACKING_STATUS_CFG[t.tracking_status] ?? TRACKING_STATUS_CFG.sugerido;
                    return (
                      <div
                        key={t.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="badge bg-purple-600 text-white text-[11px] font-bold">
                              {Math.round(Number(t.match_score))}% Match
                            </span>
                            <span className={`badge border text-[11px] ${trCfg.cls}`}>
                              {trCfg.label}
                            </span>
                          </div>
                          <select
                            value={t.tracking_status}
                            onChange={(e) => onUpdateTrackingStatus(t, e.target.value)}
                            className="input text-xs py-1 px-2.5 w-auto"
                          >
                            {Object.entries(TRACKING_STATUS_CFG).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <Link
                          href={`/editais/${t.edital_id}`}
                          className="text-sm font-bold text-slate-900 hover:text-brand-700 block"
                        >
                          {t.edital?.titulo ?? `Edital #${t.edital_id}`}
                        </Link>

                        <p className="text-xs text-slate-500">
                          {t.edital?.ministerio ?? t.edital?.orgao} · Valor:{' '}
                          <strong>{fmtBRL(t.edital?.valor_estimado)}</strong> · Prazo:{' '}
                          <strong>
                            {t.edital?.data_proposta_fim
                              ? new Date(t.edital.data_proposta_fim).toLocaleDateString('pt-BR')
                              : 'Aberto'}
                          </strong>
                        </p>

                        {t.demand && (
                          <p className="text-xs text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-1.5">
                            📌 Atende à demanda: <strong>{t.demand.title}</strong>
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {(t.match_reasons ?? []).map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full"
                            >
                              ✓ {r}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => onCopyWhatsApp(t, authority, munName)}
                            className="btn-secondary text-xs py-1.5"
                          >
                            {copiedId === t.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Mensagem Copiada!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copiar Alerta WhatsApp p/ Prefeito
                              </>
                            )}
                          </button>
                          <Link
                            href={`/editais/${t.edital_id}`}
                            className="btn-secondary text-xs py-1.5 ml-auto"
                          >
                            Ficha Completa do Edital <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'emendas' && (
            <div className="space-y-6">
              {/* Confidential Notes */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Notas Políticas & Estratégicas Sigilosas
                  </span>
                  <button
                    onClick={onEditAuthority}
                    className="text-xs text-amber-800 underline hover:text-amber-950"
                  >
                    Editar Notas
                  </button>
                </div>
                <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">
                  {authority.confidential_notes ||
                    'Nenhuma anotação política reservada registrada para este prefeito.'}
                </p>
              </div>

              {/* Budget Amendments for Municipality */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Emendas Orçamentárias Localizadas para {munName} ({munAmendments.length})
                </h4>
                {munAmendments.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-400">
                    Nenhuma emenda nominalmente indexada para &ldquo;{munName}&rdquo; (emendas de
                    bancada ou estaduais podem estar registradas sob &ldquo;Ceará&rdquo;).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {munAmendments.map((am) => (
                      <div
                        key={am.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-700">
                            {am.code} ({am.year})
                          </span>
                          <p className="text-slate-600 mt-0.5">
                            {am.action_name ?? am.subfunction_name ?? am.function_name ?? am.locality}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="block text-slate-400 text-[10px]">Empenhado / Pago</span>
                          <span className="font-bold text-emerald-700">
                            {fmtBRL(am.value_empenhado)}
                          </span>
                          <span className="text-slate-400"> / {fmtBRL(am.value_pago)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * SUBCOMPONENT: MODAL DE PREFEITO / AUTORIDADE MUNICIPAL
 * ========================================================================== */
function AuthorityModal({
  municipalities,
  initial,
  onClose,
  onSaved,
}: {
  municipalities: Municipality[];
  initial: Authority | null;
  onClose: () => void;
  onSaved: (a: Authority) => void;
}) {
  const [municipalityId, setMunicipalityId] = useState<number>(
    initial?.municipality_id ?? municipalities[0]?.id ?? 1,
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? 'prefeito');
  const [party, setParty] = useState(initial?.party ?? 'PT');
  const [alliedStatus, setAlliedStatus] = useState(
    initial?.allied_status ?? 'aliado_base_elmano',
  );
  const [mayorMandate, setMayorMandate] = useState(initial?.mayor_mandate ?? '1º Mandato');
  const [senatorVotes, setSenatorVotes] = useState(
    initial?.senator_votes != null ? String(initial.senator_votes) : '',
  );
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [cabinetChiefName, setCabinetChiefName] = useState(initial?.cabinet_chief_name ?? '');
  const [cabinetChiefContact, setCabinetChiefContact] = useState(
    initial?.cabinet_chief_contact ?? '',
  );
  const [priorityAreas, setPriorityAreas] = useState<string[]>(
    initial?.priority_areas ?? ['saúde', 'infraestrutura', 'educação'],
  );
  const [lastMeetingAt, setLastMeetingAt] = useState(
    initial?.last_meeting_at ? initial.last_meeting_at.slice(0, 10) : '',
  );
  const [confidentialNotes, setConfidentialNotes] = useState(
    initial?.confidential_notes ?? '',
  );
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function toggleArea(area: string) {
    setPriorityAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        const payload: AuthorityInput = {
          id: initial?.id,
          municipality_id: Number(municipalityId),
          name,
          role,
          party: party || null,
          allied_status: alliedStatus,
          mayor_mandate: mayorMandate || null,
          senator_votes: senatorVotes ? Number(senatorVotes) : null,
          whatsapp: whatsapp || null,
          phone: phone || null,
          email: email || null,
          cabinet_chief_name: cabinetChiefName || null,
          cabinet_chief_contact: cabinetChiefContact || null,
          priority_areas: priorityAreas,
          last_meeting_at: lastMeetingAt || null,
          confidential_notes: confidentialNotes || null,
        };
        const saved = await saveAuthority(payload);
        onSaved(saved);
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao salvar autoridade.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {initial ? 'Editar Prefeito(a) / Liderança' : 'Cadastrar Prefeito(a) / Liderança Aliada'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Município do Ceará (184) *
              </label>
              <select
                value={municipalityId}
                onChange={(e) => setMunicipalityId(Number(e.target.value))}
                className="input text-xs"
                required
              >
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.macro_region}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cargo / Função *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input text-xs"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nome Completo / Político *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Prefeito(a) João da Silva"
                className="input text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Partido</label>
              <input
                value={party}
                onChange={(e) => setParty(e.target.value.toUpperCase())}
                placeholder="PT, PSB, PSD, MDB…"
                className="input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alinhamento Político *
              </label>
              <select
                value={alliedStatus}
                onChange={(e) => setAlliedStatus(e.target.value)}
                className="input text-xs"
              >
                {Object.entries(ALLIED_CFG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mandato</label>
              <select
                value={mayorMandate}
                onChange={(e) => setMayorMandate(e.target.value)}
                className="input text-xs"
              >
                <option value="1º Mandato (2025-2028)">1º Mandato (2025-2028)</option>
                <option value="Reeleito / 2º Mandato">Reeleito / 2º Mandato</option>
                <option value="Liderança Municipal">Liderança Municipal</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Votação Sen. Luizianne no Município
              </label>
              <input
                type="number"
                min={0}
                value={senatorVotes}
                onChange={(e) => setSenatorVotes(e.target.value)}
                placeholder="Ex: 18500"
                className="input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Direto</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(85) 99999-9999"
                className="input text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefone Gabinete</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(88) 3333-0000"
                className="input text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-mail Institucional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gabinete@municipio.ce.gov.br"
                className="input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chefe de Gabinete / Articulador
              </label>
              <input
                value={cabinetChiefName}
                onChange={(e) => setCabinetChiefName(e.target.value)}
                placeholder="Nome do Chefe de Gabinete"
                className="input text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contato Chefe de Gabinete
              </label>
              <input
                value={cabinetChiefContact}
                onChange={(e) => setCabinetChiefContact(e.target.value)}
                placeholder="(85) 98888-8888"
                className="input text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Última Audiência</label>
              <input
                type="date"
                value={lastMeetingAt}
                onChange={(e) => setLastMeetingAt(e.target.value)}
                className="input text-xs"
              />
            </div>
          </div>

          {/* Priority Areas */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Áreas Prioritárias do Prefeito (usadas no Matchmaking com Editais)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALLOWED_DEMAND_CATEGORIES.map((area) => {
                const selected = priorityAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`px-2.5 py-1 rounded-full border text-[11px] font-medium capitalize transition-colors ${
                      selected
                        ? 'bg-brand-700 text-white border-brand-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              Notas Estratégicas & Acordos Políticos (Sigiloso)
            </label>
            <textarea
              rows={3}
              value={confidentialNotes}
              onChange={(e) => setConfidentialNotes(e.target.value)}
              placeholder="Compromissos de campanha, apoios locais, histórico com o Governo Elmano e observações reservadas do gabinete…"
              className="input text-xs resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="btn-primary text-xs">
              {pending ? 'Salvando…' : 'Salvar Prefeito / Liderança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
 * SUBCOMPONENT: MODAL DE DEMANDA MUNICIPAL DO PREFEITO
 * ========================================================================== */
function AuthorityDemandModal({
  authorities,
  munMap,
  members,
  defaultAuthorityId,
  initial,
  onClose,
  onSaved,
}: {
  authorities: Authority[];
  munMap: Map<number, Municipality>;
  members: Member[];
  defaultAuthorityId: string;
  initial: AuthorityDemand | null;
  onClose: () => void;
  onSaved: (d: AuthorityDemand) => void;
}) {
  const [authorityId, setAuthorityId] = useState(
    initial?.authority_id || defaultAuthorityId || authorities[0]?.id || '',
  );
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'infraestrutura');
  const [keywordsText, setKeywordsText] = useState((initial?.keywords ?? []).join(', '));
  const [estimatedValue, setEstimatedValue] = useState(
    initial?.estimated_value != null ? String(initial.estimated_value) : '',
  );
  const [urgency, setUrgency] = useState(initial?.urgency ?? 'alta');
  const [status, setStatus] = useState(initial?.status ?? 'mapeada');
  const [targetMinistry, setTargetMinistry] = useState(initial?.target_ministry ?? '');
  const [protocolNumber, setProtocolNumber] = useState(initial?.protocol_number ?? '');
  const [assignedTo, setAssignedTo] = useState(initial?.assigned_to ?? '');
  const [dueDate, setDueDate] = useState(initial?.due_date ? initial.due_date.slice(0, 10) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const selectedAuth = authorities.find((a) => a.id === authorityId);
    if (!selectedAuth) {
      setError('Selecione um prefeito/liderança.');
      return;
    }

    startTransition(async () => {
      try {
        const keywords = keywordsText
          .split(',')
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);

        const payload: AuthorityDemandInput = {
          id: initial?.id,
          authority_id: selectedAuth.id,
          municipality_id: selectedAuth.municipality_id,
          title,
          description: description || null,
          category,
          keywords,
          estimated_value: estimatedValue ? Number(estimatedValue) : null,
          urgency,
          status,
          target_ministry: targetMinistry || null,
          protocol_number: protocolNumber || null,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
          notes: notes || null,
        };
        const saved = await saveAuthorityDemand(payload);
        onSaved(saved);
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao salvar demanda.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {initial ? 'Editar Demanda Municipal' : 'Nova Demanda de Prefeito(a)'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Prefeito(a) / Município Solicitante *
            </label>
            <select
              value={authorityId}
              onChange={(e) => setAuthorityId(e.target.value)}
              className="input text-xs"
              required
            >
              {authorities.map((a) => {
                const mun = getMun(a, munMap);
                return (
                  <option key={a.id} value={a.id}>
                    {mun?.name ?? 'Município'} — {a.name} ({a.party ?? 'S/P'})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Título / Objeto da Demanda *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Construção de 2 UBS Porte II e aquisição de ambulância SAMU"
              className="input text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Área Temática *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input text-xs"
              >
                {ALLOWED_DEMAND_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Urgência *</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="input text-xs"
              >
                {Object.entries(URGENCY_CFG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input text-xs"
              >
                {Object.entries(DEMAND_STATUS_CFG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                min={0}
                step="1000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="Ex: 2500000"
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ministério / Órgão Concedente Alvo
              </label>
              <input
                value={targetMinistry}
                onChange={(e) => setTargetMinistry(e.target.value)}
                placeholder="Ex: Ministério da Saúde, FNDE, Codevasf, DNOCS…"
                className="input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Detalhamento Técnico da Demanda
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Localidades beneficiadas, justificativa, situação do projeto básico/executivo…"
              className="input text-xs resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Palavras-Chave para Match de Editais (separadas por vírgula)
            </label>
            <input
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="Ex: ubs, ambulancia, pavimentacao, adutora, creche, fnde"
              className="input text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nº Ofício / Protocolo Siconv
              </label>
              <input
                value={protocolNumber}
                onChange={(e) => setProtocolNumber(e.target.value)}
                placeholder="Ex: OF-142/2026"
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assessor Responsável
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="input text-xs"
              >
                <option value="">Não atribuído</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prazo / Meta</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input text-xs"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="btn-primary text-xs">
              {pending ? 'Salvando e Cruzando Editais…' : 'Salvar Demanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
