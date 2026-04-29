import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, Calendar, Building2,
  DollarSign, FileText, MapPin, Tag, Clock,
  CheckCircle, AlertCircle, PauseCircle,
} from 'lucide-react';

interface EditalDetail {
  id: number;
  pncp_id: string | null;
  titulo: string;
  orgao: string;
  ministerio: string;
  numero: string | null;
  objeto: string | null;
  modalidade: string | null;
  valor_estimado: number | null;
  data_abertura: string | null;
  data_encerramento: string | null;
  data_proposta_inicio: string | null;
  data_proposta_fim: string | null;
  data_publicacao: string | null;
  situacao: string;
  url_fonte: string | null;
  url_edital: string | null;
  uf: string | null;
  municipio: string | null;
  unidade_nome: string | null;
  poder: string | null;
  esfera: string | null;
  cnpj_orgao: string | null;
}

const SITUACAO_CFG: Record<string, { label: string; badge: string; icon: any }> = {
  aberto:    { label: 'Aberto',    badge: 'text-green-700 bg-green-50 border-green-200',  icon: CheckCircle },
  encerrado: { label: 'Encerrado', badge: 'text-slate-600 bg-slate-100 border-slate-200', icon: CheckCircle },
  suspenso:  { label: 'Suspenso',  badge: 'text-amber-700 bg-amber-50 border-amber-200',  icon: PauseCircle },
  revogado:  { label: 'Revogado',  badge: 'text-red-700 bg-red-50 border-red-200',        icon: AlertCircle },
};

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtBRL(v?: number | null) {
  if (!v || v === 0) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function daysUntil(d?: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

export default async function EditalDetailPage({ params }: { params: { id: string } }) {
  let edital: EditalDetail | null = null;
  try {
    edital = await api<EditalDetail>(`/editais/${params.id}`);
  } catch {}

  if (!edital) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <Link href="/editais" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Editais
        </Link>
        <div className="stat-card py-16 text-center">
          <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Edital não encontrado.</p>
        </div>
      </div>
    );
  }

  const s = SITUACAO_CFG[edital.situacao] ?? SITUACAO_CFG.encerrado;
  const Icon = s.icon;
  const days = daysUntil(edital.data_proposta_fim);
  const valor = fmtBRL(edital.valor_estimado);

  return (
    <article className="space-y-5 animate-fade-in-up">
      <Link href="/editais" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar aos Editais
      </Link>

      {/* Header */}
      <div className="stat-card space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.badge}`}>
            <Icon className="w-3.5 h-3.5" /> {s.label}
          </span>
          {edital.modalidade && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{edital.modalidade}</span>
          )}
          {edital.situacao === 'aberto' && days !== null && days <= 7 && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${days <= 3 ? 'bg-red-600 text-white animate-pulse' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              Encerra em {days}d
            </span>
          )}
        </div>
        <h1 className="text-lg font-bold text-slate-900 leading-snug">{edital.titulo}</h1>
        <div className="flex flex-wrap gap-3">
          {edital.url_fonte && (
            <a href={edital.url_fonte} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
              <ExternalLink className="w-4 h-4" /> Ver no PNCP
            </a>
          )}
          {edital.url_edital && edital.url_edital !== edital.url_fonte && (
            <a href={edital.url_edital} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
              <ExternalLink className="w-4 h-4" /> Acessar Edital
            </a>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Órgão */}
        <div className="stat-card space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400" /> Órgão contratante
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-slate-800">{edital.orgao}</p>
            {edital.unidade_nome && edital.unidade_nome !== edital.orgao && (
              <p className="text-slate-500 text-xs">{edital.unidade_nome}</p>
            )}
            {edital.cnpj_orgao && <p className="text-xs text-slate-400 font-mono">CNPJ: {edital.cnpj_orgao}</p>}
            <div className="flex gap-2 flex-wrap pt-1">
              {edital.esfera && <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{edital.esfera}</span>}
              {edital.poder && <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{edital.poder}</span>}
              {edital.uf && (
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {edital.municipio ? `${edital.municipio}/${edital.uf}` : edital.uf}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="stat-card space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" /> Datas
          </div>
          <div className="space-y-2 text-sm">
            {edital.data_publicacao && (
              <div className="flex justify-between">
                <span className="text-slate-500">Publicação</span>
                <span className="font-medium text-slate-700">{fmt(edital.data_publicacao)}</span>
              </div>
            )}
            {edital.data_proposta_inicio && (
              <div className="flex justify-between">
                <span className="text-slate-500">Abertura propostas</span>
                <span className="font-medium text-slate-700">{fmt(edital.data_proposta_inicio)}</span>
              </div>
            )}
            {edital.data_proposta_fim && (
              <div className="flex justify-between">
                <span className="text-slate-500">Encerramento</span>
                <span className={`font-semibold ${days !== null && days <= 7 ? 'text-red-600' : 'text-slate-700'}`}>
                  {fmt(edital.data_proposta_fim)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Valor + Objeto */}
      {(valor || edital.objeto) && (
        <div className="stat-card space-y-4">
          {valor && (
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 rounded-xl"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs text-slate-500">Valor estimado</p>
                <p className="text-xl font-bold text-emerald-700">{valor}</p>
              </div>
            </div>
          )}
          {edital.objeto && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Tag className="w-4 h-4 text-slate-400" /> Objeto
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{edital.objeto}</p>
            </div>
          )}
        </div>
      )}

      {/* Identificadores */}
      {(edital.pncp_id || edital.numero) && (
        <div className="stat-card">
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {edital.numero && (
              <span>Número: <strong className="text-slate-700 font-mono">{edital.numero}</strong></span>
            )}
            {edital.pncp_id && (
              <span>PNCP: <strong className="text-slate-700 font-mono">{edital.pncp_id}</strong></span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
