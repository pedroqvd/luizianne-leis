import { api } from '@/lib/api';
import { requireTabAccess } from '@/lib/auth-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { EditalTrackingPanel, type EditalMatchItem } from './EditalTrackingPanel';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Building2,
  DollarSign,
  FileText,
  MapPin,
  Tag,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Scale,
  Layers,
  Download,
  Handshake,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface EditalItemResumo {
  numeroItem: number;
  descricao: string;
  quantidade?: number;
  unidadeMedida?: string;
  valorUnitarioEstimado?: number;
  valorTotal?: number;
}

interface EditalArquivoAnexo {
  sequencialDocumento?: number;
  titulo: string;
  tipoDocumentoNome?: string;
  url: string;
  dataPublicacaoPncp?: string;
}

interface EditalDetail {
  id: number;
  pncp_id: string | null;
  titulo: string;
  orgao: string;
  ministerio: string;
  ministerio_slug?: string | null;
  ministerio_sigla?: string | null;
  autarquia?: string | null;
  orgao_superior?: string | null;
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
  categoria_tematica?: string | null;
  keywords_extraidas?: string[] | null;
  publico_alvo?: string[] | null;
  elegivel_prefeituras?: boolean | null;
  abrangencia?: string | null;
  amparo_legal?: string | null;
  modo_disputa?: string | null;
  criterio_julgamento?: string | null;
  origem?: string | null;
  itens_resumo?: EditalItemResumo[] | null;
  arquivos_anexos?: EditalArquivoAnexo[] | null;
  matches?: EditalMatchItem[];
}

const SITUACAO_CFG: Record<string, { label: string; badge: string; icon: any }> = {
  aberto:    { label: 'Aberto',    badge: 'text-green-700 bg-green-50 border-green-200',  icon: CheckCircle },
  encerrado: { label: 'Encerrado', badge: 'text-slate-600 bg-slate-100 border-slate-200', icon: CheckCircle },
  suspenso:  { label: 'Suspenso',  badge: 'text-amber-700 bg-amber-50 border-amber-200',  icon: PauseCircle },
  revogado:  { label: 'Revogado',  badge: 'text-red-700 bg-red-50 border-red-200',        icon: AlertCircle },
};

const PUBLICO_LABELS: Record<string, string> = {
  prefeituras: 'Prefeituras Municipais',
  consorcios_publicos: 'Consórcios Públicos',
  adesao_ata_srp: 'Adesão a Ata de Registro de Preços (Carona SRP)',
  ceara_direto: 'Execução Direta no Ceará',
  interesse_tematico_municipal: 'Interesse Temático Municipal',
  licitacao_federal: 'Contratação Federal',
};

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  await requireTabAccess('editais');

  const idNum = Number(params.id);
  let edital: EditalDetail | null = null;

  try {
    edital = await api<EditalDetail>(`/editais/${idNum}`);
  } catch {
    // Fallback direto via Supabase caso a API esteja indisponível
    const admin = createAdminClient();
    const { data } = await admin.from('editais').select('*').eq('id', idNum).maybeSingle();
    if (data) edital = data as EditalDetail;
  }

  if (!edital) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <Link
          href="/editais"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Editais
        </Link>
        <div className="stat-card py-16 text-center">
          <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Edital não encontrado.</p>
        </div>
      </div>
    );
  }

  // Carrega lista de prefeitos e demandas para vínculo manual + fallback de matches
  const admin = createAdminClient();
  const [{ data: rawAuths }, { data: rawDemands }, { data: rawMatches }] = await Promise.all([
    admin
      .from('municipal_authorities')
      .select('id, name, party, municipality:municipality_id(name)')
      .eq('active', true)
      .order('name'),
    admin
      .from('authority_demands')
      .select('id, authority_id, title, category')
      .not('status', 'in', '("atendida","arquivada")'),
    edital.matches
      ? Promise.resolve({ data: null })
      : admin
          .from('edital_authority_tracking')
          .select(
            `*,
             authority:authority_id(name, role, party, allied_status, whatsapp, phone, email, municipality:municipality_id(name, macro_region)),
             demand:demand_id(title, category, estimated_value, urgency)`,
          )
          .eq('edital_id', edital.id)
          .order('match_score', { ascending: false }),
  ]);

  const authorityOptions = (rawAuths ?? []).map((a: any) => {
    const mun = Array.isArray(a.municipality) ? a.municipality[0] : a.municipality;
    return {
      id: a.id,
      name: a.name,
      party: a.party,
      municipality_name: mun?.name ?? 'Município',
    };
  });

  const matches: EditalMatchItem[] =
    edital.matches ??
    (rawMatches ?? []).map((m: any) => {
      const auth = m.authority ?? {};
      const mun = Array.isArray(auth.municipality) ? auth.municipality[0] : auth.municipality;
      const dem = m.demand ?? {};
      return {
        id: m.id,
        edital_id: m.edital_id,
        authority_id: m.authority_id,
        demand_id: m.demand_id,
        match_score: Number(m.match_score ?? 0),
        match_reasons: m.match_reasons ?? [],
        tracking_status: m.tracking_status,
        notified_at: m.notified_at,
        protocol_submitted: m.protocol_submitted,
        notes: m.notes,
        authority_name: auth.name ?? 'Prefeito(a)',
        authority_role: auth.role ?? 'prefeito',
        authority_party: auth.party ?? null,
        allied_status: auth.allied_status ?? 'aliado_base_elmano',
        authority_whatsapp: auth.whatsapp ?? null,
        authority_phone: auth.phone ?? null,
        authority_email: auth.email ?? null,
        municipality_name: mun?.name ?? 'Município',
        macro_region: mun?.macro_region ?? null,
        demand_title: dem.title ?? null,
        demand_category: dem.category ?? null,
        demand_estimated_value: dem.estimated_value ?? null,
        demand_urgency: dem.urgency ?? null,
      };
    });

  const s = SITUACAO_CFG[edital.situacao] ?? SITUACAO_CFG.encerrado;
  const Icon = s.icon;
  const days = daysUntil(edital.data_proposta_fim);
  const valor = fmtBRL(edital.valor_estimado);
  const itens = Array.isArray(edital.itens_resumo) ? edital.itens_resumo : [];
  const arquivos = Array.isArray(edital.arquivos_anexos) ? edital.arquivos_anexos : [];

  return (
    <article className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link
          href="/editais"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Radar de Editais
        </Link>
        <Link
          href="/articulacao"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
        >
          <Handshake className="w-3.5 h-3.5" /> Ir para Articulação Municipal (Prefeitos)
        </Link>
      </div>

      {/* Header Principal */}
      <div className="stat-card space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.badge}`}
          >
            <Icon className="w-3.5 h-3.5" /> {s.label}
          </span>
          {edital.categoria_tematica && (
            <span className="text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full capitalize">
              Área: {edital.categoria_tematica}
            </span>
          )}
          {edital.elegivel_prefeituras && (
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
              🏛️ Elegível para Prefeituras / Adesão Municipal
            </span>
          )}
          {edital.abrangencia && (
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              Abrangência: {edital.abrangencia}
            </span>
          )}
          {edital.modalidade && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              {edital.modalidade}
            </span>
          )}
          {edital.situacao === 'aberto' && days !== null && days >= 0 && days <= 15 && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                days <= 3
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              Encerra em {days} dia(s)
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-slate-900 leading-snug">{edital.titulo}</h1>

        <div className="flex flex-wrap gap-3 pt-1">
          {edital.url_fonte && (
            <a
              href={edital.url_fonte}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs py-2"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir no Portal Oficial (PNCP / Gov.br)
            </a>
          )}
          {edital.url_edital && edital.url_edital !== edital.url_fonte && (
            <a
              href={edital.url_edital}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Sistema de Origem / Edital Completo
            </a>
          )}
        </div>
      </div>

      {/* PAINEL DE TRAQUEAMENTO COM PREFEITOS & DEMANDAS */}
      <EditalTrackingPanel
        edital={edital}
        initialMatches={matches}
        authorities={authorityOptions}
        demands={(rawDemands ?? []) as any[]}
      />

      {/* Ficha Técnica Profunda + Valor e Objeto */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 stat-card space-y-4">
          {valor && (
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Valor Total Estimado</p>
                <p className="text-2xl font-bold text-emerald-700">{valor}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Tag className="w-4 h-4 text-brand-600" /> Objeto Completo e Especificação
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {edital.objeto ?? edital.titulo}
            </p>
          </div>

          {(edital.publico_alvo?.length ?? 0) > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <p className="text-xs font-semibold text-slate-700">
                Enquadramento para Articuladores Municipais:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {edital.publico_alvo!.map((p) => (
                  <span
                    key={p}
                    className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {PUBLICO_LABELS[p] ?? p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(edital.keywords_extraidas?.length ?? 0) > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <p className="text-xs font-semibold text-slate-700">
                Palavras-Chave Indexadas (Motor de Matchmaking):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {edital.keywords_extraidas!.map((kw) => (
                  <span
                    key={kw}
                    className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metadados Jurídicos & Cronograma */}
        <div className="space-y-4">
          <div className="stat-card space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Building2 className="w-4 h-4 text-slate-400" /> Órgão & Unidade Executora
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                {edital.ministerio_sigla && (
                  <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                    {edital.ministerio_sigla}
                  </span>
                )}
                <p className="text-sm font-bold text-slate-900">
                  {edital.ministerio || edital.orgao}
                </p>
              </div>
              {edital.autarquia && (
                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                  🏢 Autarquia / Fundação: <strong>{edital.autarquia}</strong>
                </div>
              )}
              {edital.unidade_nome &&
                edital.unidade_nome !== edital.ministerio &&
                edital.unidade_nome !== edital.autarquia && (
                  <p className="text-slate-600">Unidade/UASG: {edital.unidade_nome}</p>
                )}
              {edital.cnpj_orgao && (
                <p className="text-slate-400 font-mono">CNPJ: {edital.cnpj_orgao}</p>
              )}
              <div className="flex gap-1.5 flex-wrap pt-1">
                {edital.esfera && (
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                    Esfera {edital.esfera}
                  </span>
                )}
                {edital.poder && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Poder {edital.poder}
                  </span>
                )}
                {edital.uf && (
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {edital.municipio ? `${edital.municipio}/${edital.uf}` : edital.uf}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="stat-card space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Calendar className="w-4 h-4 text-slate-400" /> Cronograma Oficial
            </div>
            <div className="space-y-2 text-xs">
              {edital.data_publicacao && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Publicação</span>
                  <span className="font-medium text-slate-800">{fmt(edital.data_publicacao)}</span>
                </div>
              )}
              {edital.data_proposta_inicio && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Abertura de Propostas</span>
                  <span className="font-medium text-slate-800">
                    {fmt(edital.data_proposta_inicio)}
                  </span>
                </div>
              )}
              {edital.data_proposta_fim && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Encerramento</span>
                  <span
                    className={`font-bold ${
                      days !== null && days <= 7 ? 'text-red-600' : 'text-slate-900'
                    }`}
                  >
                    {fmt(edital.data_proposta_fim)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="stat-card space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Scale className="w-4 h-4 text-slate-400" /> Fundamentação & Regras
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              {edital.amparo_legal && (
                <p>
                  <strong>Amparo Legal:</strong> {edital.amparo_legal}
                </p>
              )}
              {edital.modo_disputa && (
                <p>
                  <strong>Modo de Disputa:</strong> {edital.modo_disputa}
                </p>
              )}
              {edital.criterio_julgamento && (
                <p>
                  <strong>Critério de Julgamento:</strong> {edital.criterio_julgamento}
                </p>
              )}
              {edital.numero && (
                <p>
                  <strong>Processo / Compra:</strong>{' '}
                  <span className="font-mono">{edital.numero}</span>
                </p>
              )}
              {edital.pncp_id && (
                <p>
                  <strong>Controle PNCP:</strong>{' '}
                  <span className="font-mono text-[11px]">{edital.pncp_id}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ARQUIVOS & ANEXOS OFICIAIS DO PNCP */}
      {arquivos.length > 0 && (
        <section className="stat-card space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Download className="w-4 h-4 text-brand-700" /> Documentos e Anexos Oficiais ({arquivos.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {arquivos.map((arq, idx) => (
              <a
                key={idx}
                href={arq.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 transition-colors text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{arq.titulo}</p>
                  {arq.tipoDocumentoNome && (
                    <p className="text-[10px] text-slate-400">{arq.tipoDocumentoNome}</p>
                  )}
                </div>
                <Download className="w-4 h-4 text-brand-700 flex-shrink-0" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ITENS DA CONTRATAÇÃO / EDITAL */}
      {itens.length > 0 && (
        <section className="stat-card space-y-3 overflow-hidden">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Layers className="w-4 h-4 text-brand-700" /> Itens Detalhados do Edital ({itens.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400 uppercase">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Descrição do Item</th>
                  <th className="py-2 pr-3 text-right">Qtd.</th>
                  <th className="py-2 pr-3 text-right">Valor Unit.</th>
                  <th className="py-2 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {itens.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pr-3 font-mono text-slate-400">{it.numeroItem || idx + 1}</td>
                    <td className="py-2.5 pr-3 text-slate-800 font-medium">{it.descricao}</td>
                    <td className="py-2.5 pr-3 text-right text-slate-600 whitespace-nowrap">
                      {it.quantidade != null ? `${it.quantidade} ${it.unidadeMedida ?? ''}` : '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-slate-600 whitespace-nowrap">
                      {fmtBRL(it.valorUnitarioEstimado) ?? '—'}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {fmtBRL(it.valorTotal) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </article>
  );
}
