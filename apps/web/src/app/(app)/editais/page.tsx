import { FileText, ExternalLink, Calendar, Building2, AlertCircle, CheckCircle, PauseCircle } from 'lucide-react';

const situacaoCfg = {
  aberto:    { label: 'Aberto',    color: 'text-green-700 bg-green-50 border-green-200',   icon: CheckCircle },
  encerrado: { label: 'Encerrado', color: 'text-slate-600 bg-slate-100 border-slate-200',  icon: CheckCircle },
  suspenso:  { label: 'Suspenso',  color: 'text-amber-700 bg-amber-50 border-amber-200',   icon: PauseCircle },
  revogado:  { label: 'Revogado',  color: 'text-red-700 bg-red-50 border-red-200',         icon: AlertCircle },
} as const;

type Situacao = keyof typeof situacaoCfg;

interface Edital {
  id: number;
  titulo: string;
  orgao: string;
  ministerio: string;
  numero?: string;
  objeto?: string;
  modalidade?: string;
  data_abertura?: string;
  data_encerramento?: string;
  situacao: Situacao;
  url_fonte?: string;
}

const EDITAIS_EXEMPLO: Edital[] = [
  {
    id: 1,
    titulo: 'Chamamento Público – Educação Integral no Ceará',
    orgao: 'Fundo Nacional de Desenvolvimento da Educação',
    ministerio: 'MEC',
    numero: 'Edital nº 01/2025',
    objeto: 'Seleção de projetos para ampliação da educação em tempo integral em municípios do Ceará',
    modalidade: 'Chamamento Público',
    data_abertura: '2025-03-01',
    data_encerramento: '2025-05-31',
    situacao: 'aberto',
    url_fonte: 'https://www.fnde.gov.br/index.php/programas/par/areas-para-estados-e-municipios/editais',
  },
  {
    id: 2,
    titulo: 'Credenciamento – Atenção Básica à Saúde',
    orgao: 'Fundo Nacional de Saúde',
    ministerio: 'Ministério da Saúde',
    numero: 'FNS/2025-04',
    objeto: 'Credenciamento de municípios para repasse do Programa Saúde com Agente',
    modalidade: 'Credenciamento',
    data_abertura: '2025-04-01',
    data_encerramento: '2025-12-31',
    situacao: 'aberto',
    url_fonte: 'https://www.saude.gov.br',
  },
  {
    id: 3,
    titulo: 'Pregão Eletrônico – Obras de Infraestrutura Hídrica',
    orgao: 'Departamento Nacional de Obras Contra as Secas',
    ministerio: 'Ministério da Integração',
    numero: 'DNOCS PE 003/2025',
    objeto: 'Contratação de empresa para obras de adutoras e cisternas no semiárido',
    modalidade: 'Pregão Eletrônico',
    data_abertura: '2025-02-10',
    data_encerramento: '2025-02-28',
    situacao: 'encerrado',
    url_fonte: 'https://www.gov.br/dnocs',
  },
];

function fmt(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EditaisPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Editais</h1>
          <p className="text-slate-500 text-sm mt-1">
            Abertura de editais nos ministérios e órgãos federais de interesse político
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="stat-card">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Buscar</label>
            <input
              type="text"
              placeholder="Título, órgão ou ministério…"
              className="input text-sm"
            />
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Ministério</label>
            <select className="input text-sm">
              <option value="">Todos</option>
              <option>MEC</option>
              <option>Ministério da Saúde</option>
              <option>Ministério da Integração</option>
              <option>Ministério das Cidades</option>
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Situação</label>
            <select className="input text-sm">
              <option value="">Todas</option>
              <option value="aberto">Aberto</option>
              <option value="encerrado">Encerrado</option>
              <option value="suspenso">Suspenso</option>
              <option value="revogado">Revogado</option>
            </select>
          </div>
          <button type="submit" className="btn-secondary">Filtrar</button>
        </form>
      </div>

      {/* Aviso dados exemplo */}
      <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <span>
          Os editais abaixo são <strong>exemplos ilustrativos</strong>. A equipe pode cadastrar editais reais
          diretamente no banco ou via painel admin (em breve).
        </span>
      </div>

      {/* Lista de editais */}
      <div className="space-y-3">
        {EDITAIS_EXEMPLO.map((edital) => {
          const cfg = situacaoCfg[edital.situacao];
          const SituacaoIcon = cfg.icon;

          return (
            <div key={edital.id} className="stat-card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Ícone */}
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-brand-600" />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800 leading-tight">{edital.titulo}</h3>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      <SituacaoIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="font-medium text-slate-700">{edital.ministerio}</span>
                      {' · '}{edital.orgao}
                    </span>
                    {edital.numero && <span className="text-slate-400">{edital.numero}</span>}
                    {edital.modalidade && (
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px] font-medium">
                        {edital.modalidade}
                      </span>
                    )}
                  </div>

                  {edital.objeto && (
                    <p className="text-xs text-slate-600 line-clamp-2">{edital.objeto}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                    {edital.data_abertura && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Abertura: <strong className="text-slate-600">{fmt(edital.data_abertura)}</strong>
                      </span>
                    )}
                    {edital.data_encerramento && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Encerra: <strong className="text-slate-600">{fmt(edital.data_encerramento)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Ação */}
                {edital.url_fonte && (
                  <a
                    href={edital.url_fonte}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 flex-shrink-0 mt-1 sm:mt-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver edital
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Estatísticas resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Abertos',    value: '2', color: 'text-green-600' },
          { label: 'Encerrados', value: '1', color: 'text-slate-500' },
          { label: 'Suspensos',  value: '0', color: 'text-amber-600' },
          { label: 'Total',      value: '3', color: 'text-brand-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card text-center py-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
