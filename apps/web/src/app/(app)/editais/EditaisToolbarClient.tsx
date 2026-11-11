'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  recomputeEditalMatchesAction,
  createStrategicEdital,
  ALLOWED_DEMAND_CATEGORIES,
} from '@/app/(app)/actions/articulacao';
import { RefreshCw, Plus, Sparkles, X, CheckCircle2 } from 'lucide-react';

export function EditaisToolbarClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [titulo, setTitulo] = useState('');
  const [ministerio, setMinisterio] = useState('Ministério da Saúde');
  const [numero, setNumero] = useState('');
  const [objeto, setObjeto] = useState('');
  const [categoria, setCategoria] = useState('saúde');
  const [origem, setOrigem] = useState<'transferegov' | 'pac_selecoes' | 'manual'>('transferegov');
  const [uf, setUf] = useState('CE');
  const [valorEstimado, setValorEstimado] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [urlFonte, setUrlFonte] = useState('');
  const [error, setError] = useState('');

  function handleRecompute() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await recomputeEditalMatchesAction();
        setFeedback(`${res.matchesUpserted} matches com prefeitos recalculados!`);
        router.refresh();
      } catch {}
    });
  }

  function handleCreateEdital(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        await createStrategicEdital({
          titulo,
          orgao: ministerio,
          ministerio,
          numero: numero || undefined,
          objeto: objeto || titulo,
          categoria_tematica: categoria,
          origem,
          uf,
          valor_estimado: valorEstimado ? Number(valorEstimado) : null,
          data_proposta_fim: dataFim || null,
          url_fonte: urlFonte || undefined,
          url_edital: urlFonte || undefined,
        });
        setShowModal(false);
        setTitulo('');
        setObjeto('');
        setFeedback('Edital estratégico cadastrado e cruzado com as demandas dos prefeitos!');
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao cadastrar edital estratégico.');
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {feedback && (
          <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" /> {feedback}
          </span>
        )}
        <button
          onClick={handleRecompute}
          disabled={pending}
          className="btn-secondary text-xs py-2"
          title="Recalcular cruzamento automático com a carteira de demandas dos prefeitos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${pending ? 'animate-spin' : ''}`} />
          Recalcular Match Prefeitos
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs py-2"
        >
          <Plus className="w-3.5 h-3.5" /> + Edital Estratégico (PAC / Transferegov)
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Cadastrar Seleção / Edital Estratégico para Prefeituras
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEdital} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Título da Seleção / Chamamento *
                </label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Novo PAC Seleções — Construção de UBS e Policlínicas Municipais"
                  className="input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ministério / Órgão Concedente *
                  </label>
                  <input
                    value={ministerio}
                    onChange={(e) => setMinisterio(e.target.value)}
                    placeholder="Ex: Ministério da Saúde, FNDE, Codevasf…"
                    className="input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Área Temática *
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="input text-xs"
                  >
                    {ALLOWED_DEMAND_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origem</label>
                  <select
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value as any)}
                    className="input text-xs"
                  >
                    <option value="transferegov">Transferegov / Siconv</option>
                    <option value="pac_selecoes">Novo PAC Seleções</option>
                    <option value="manual">Chamamento Ministerial</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº Programa/Edital</label>
                  <input
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ex: 360002026001"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Abrangência UF</label>
                  <select value={uf} onChange={(e) => setUf(e.target.value)} className="input text-xs">
                    <option value="CE">Ceará (CE)</option>
                    <option value="DF">Nacional (DF)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Objeto e Critérios de Elegibilidade Municipal *
                </label>
                <textarea
                  rows={3}
                  value={objeto}
                  onChange={(e) => setObjeto(e.target.value)}
                  placeholder="Descreva os itens financiáveis (ex: pavimentação, UBS, creche, ambulância, adutora) para que o motor cruze com as demandas dos prefeitos…"
                  className="input text-xs resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teto / Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    value={valorEstimado}
                    onChange={(e) => setValorEstimado(e.target.value)}
                    placeholder="Ex: 5000000"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Prazo Final de Adesão / Proposta
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Link Oficial (Transferegov / Gov.br)
                </label>
                <input
                  type="url"
                  value={urlFonte}
                  onChange={(e) => setUrlFonte(e.target.value)}
                  placeholder="https://www.gov.br/..."
                  className="input text-xs"
                />
              </div>

              {error && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={pending} className="btn-primary text-xs">
                  {pending ? 'Cadastrando e Cruzando…' : 'Salvar e Cruzar com Prefeitos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
