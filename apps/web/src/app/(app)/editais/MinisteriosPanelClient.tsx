'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  Filter,
  DollarSign,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface AutarquiaSummary {
  sigla?: string;
  nome: string;
  editais_abertos: number;
  editais_total: number;
  valor_abertos: number;
}

export interface MinistrySummary {
  slug: string;
  sigla: string;
  nome: string;
  editais_abertos: number;
  editais_total: number;
  valor_abertos: number;
  autarquias: AutarquiaSummary[];
}

function fmtBRL(v?: number | string | null) {
  if (!v) return null;
  const n = Number(v);
  if (isNaN(n) || n === 0) return null;
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`;
  return `R$ ${n.toFixed(0)}`;
}

export function MinisteriosPanelClient({
  ministries,
}: {
  ministries: MinistrySummary[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active_only'>('all');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return ministries.filter((m) => {
      if (filterMode === 'active_only' && m.editais_abertos === 0) {
        return false;
      }
      if (!q) return true;

      const inName = m.nome.toLowerCase().includes(q);
      const inSigla = m.sigla.toLowerCase().includes(q);
      const inAut = m.autarquias.some(
        (a) =>
          a.nome.toLowerCase().includes(q) ||
          (a.sigla && a.sigla.toLowerCase().includes(q)),
      );
      return inName || inSigla || inAut;
    });
  }, [ministries, searchTerm, filterMode]);

  const totalMinAtivos = useMemo(
    () => ministries.filter((m) => m.editais_abertos > 0).length,
    [ministries],
  );

  const totalEditaisAbertos = useMemo(
    () => ministries.reduce((acc, m) => acc + m.editais_abertos, 0),
    [ministries],
  );

  const totalValorAberto = useMemo(
    () => ministries.reduce((acc, m) => acc + Number(m.valor_abertos || 0), 0),
    [ministries],
  );

  const totalAutarquiasAtivas = useMemo(() => {
    let count = 0;
    for (const m of ministries) {
      for (const a of m.autarquias) {
        if (a.editais_abertos > 0) count++;
      }
    }
    return count;
  }, [ministries]);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Monitoramento Canônico Federal
            </div>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight">
              Mapeamento Contínuo por Ministério & Autarquias
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Todos os 30+ Ministérios do Governo Federal e mais de 60 Autarquias (FNDE, DNOCS, Fiocruz,
              Embrapa, Ibama, Codevasf) mapeados com identificação instantânea de editais abertos hoje.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <div className="px-3 py-1">
              <span className="text-[11px] text-slate-400 block font-medium">Ministérios c/ Editais</span>
              <span className="text-2xl font-black text-emerald-400">{totalMinAtivos}</span>
              <span className="text-[10px] text-slate-400 block">de {ministries.length} órgãos</span>
            </div>
            <div className="px-3 py-1">
              <span className="text-[11px] text-slate-400 block font-medium">Editais Abertos Hoje</span>
              <span className="text-2xl font-black text-white">{totalEditaisAbertos}</span>
              <span className="text-[10px] text-slate-400 block">oportunidades</span>
            </div>
            <div className="px-3 py-1">
              <span className="text-[11px] text-slate-400 block font-medium">Autarquias Ativas</span>
              <span className="text-2xl font-black text-brand-300">{totalAutarquiasAtivas}</span>
              <span className="text-[10px] text-slate-400 block">em captação</span>
            </div>
            <div className="px-3 py-1">
              <span className="text-[11px] text-slate-400 block font-medium">Volume Estimado</span>
              <span className="text-2xl font-black text-emerald-300">{fmtBRL(totalValorAberto) ?? '—'}</span>
              <span className="text-[10px] text-slate-400 block">em aberto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control bar: search + filter modes */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar ministério ou autarquia (ex: MEC, FNDE, DNOCS, Saúde, Cidades, Incra)..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({ministries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active_only')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterMode === 'active_only'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Apenas com Editais Ativos ({totalMinAtivos})
          </button>
        </div>
      </div>

      {/* Grid of Ministries */}
      {filtered.length === 0 ? (
        <div className="stat-card text-center py-12">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Nenhum ministério ou autarquia encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Tente buscar por outra sigla ou altere o filtro de editais ativos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const hasActive = m.editais_abertos > 0;
            const valor = fmtBRL(m.valor_abertos);

            return (
              <div
                key={m.slug}
                className={`stat-card flex flex-col justify-between transition-all hover:shadow-md ${
                  hasActive
                    ? 'border-emerald-200 ring-1 ring-emerald-100 bg-gradient-to-b from-white to-emerald-50/20'
                    : 'border-slate-200 bg-white opacity-85 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-md tracking-wider ${
                          hasActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {m.sigla}
                      </span>
                      {hasActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          {m.editais_abertos} {m.editais_abertos === 1 ? 'edital ativo' : 'editais ativos'}
                        </span>
                      )}
                      {!hasActive && (
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          0 ativos
                        </span>
                      )}
                    </div>

                    {valor && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {valor}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-brand-700 transition-colors">
                    {m.nome}
                  </h3>

                  {/* Autarchies section */}
                  {m.autarquias.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Autarquias & Fundações Vinculadas ({m.autarquias.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {m.autarquias.map((a, idx) => {
                          const autActive = a.editais_abertos > 0;
                          const label = a.sigla || a.nome;

                          if (autActive) {
                            return (
                              <Link
                                key={idx}
                                href={`/editais?view=lista&ministerioSlug=${encodeURIComponent(
                                  m.slug,
                                )}&autarquia=${encodeURIComponent(a.sigla || a.nome)}&situacao=aberto`}
                                title={`${a.nome} (${a.editais_abertos} editais abertos)`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors"
                              >
                                <span>{label}</span>
                                <span className="bg-emerald-600 text-white rounded-full px-1 text-[9px] font-black">
                                  {a.editais_abertos}
                                </span>
                              </Link>
                            );
                          }

                          return (
                            <span
                              key={idx}
                              title={a.nome}
                              className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Histórico total: <strong className="text-slate-600">{m.editais_total}</strong>
                  </span>

                  {hasActive ? (
                    <Link
                      href={`/editais?view=lista&ministerioSlug=${encodeURIComponent(
                        m.slug,
                      )}&situacao=aberto`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      Ver editais ativos <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/editais?view=lista&ministerioSlug=${encodeURIComponent(m.slug)}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Ver todos <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
