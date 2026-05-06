'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, DollarSign, FileSearch, Activity, BarChart3, Users, Building2, X } from 'lucide-react';

interface Result {
  id: string;
  label: string;
  sub?: string;
  href: string;
  icon: any;
}

const STATIC_PAGES: Result[] = [
  { id: 'dash',    label: 'Dashboard',    href: '/',              icon: BarChart3 },
  { id: 'leg',     label: 'Legislativo',  href: '/legislativo',   icon: FileText },
  { id: 'emen',    label: 'Emendas',      href: '/emendas',       icon: DollarSign },
  { id: 'edit',    label: 'Editais',      href: '/editais',       icon: FileSearch },
  { id: 'vot',     label: 'Votações',     href: '/votes',         icon: Activity },
  { id: 'com',     label: 'Comissões',    href: '/comissoes',     icon: Building2 },
  { id: 'ana',     label: 'Analytics',    href: '/analytics',     icon: BarChart3 },
  { id: 'atv',     label: 'Atividade',    href: '/atividade',     icon: Activity },
  { id: 'equipe',  label: 'Equipe',       href: '/admin/equipe',  icon: Users },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults(STATIC_PAGES); setActiveIdx(0); return; }
    const q = query.toLowerCase();
    const matched = STATIC_PAGES.filter(
      (p) => p.label.toLowerCase().includes(q) || (p.sub ?? '').toLowerCase().includes(q),
    );
    setResults(matched);
    setActiveIdx(0);

    // Fetch search from API
    startTransition(async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const res = await fetch(`${base}/api/propositions?search=${encodeURIComponent(query)}&limit=5`);
        if (!res.ok) return;
        const data = await res.json();
        const apiResults: Result[] = (data.rows ?? []).map((p: any) => ({
          id: `prop-${p.id}`,
          label: p.title ?? `${p.type} ${p.number}/${p.year}`,
          sub: `${p.type} ${p.number}/${p.year}`,
          href: `/legislativo/${p.id}`,
          icon: FileText,
        }));
        setResults([...matched, ...apiResults]);
      } catch {}
    });
  }, [query]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) navigate(results[activeIdx].href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] sm:pt-[15vh] px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar páginas, proposições…"
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          {loading && <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-brand-600 rounded-full animate-spin flex-shrink-0" />}
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <ul className="max-h-56 sm:max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-400">Nenhum resultado.</li>
          ) : (
            results.map((r, i) => {
              const Icon = r.icon;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => navigate(r.href)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === activeIdx ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${i === activeIdx ? 'bg-brand-100' : 'bg-slate-100'}`}>
                      <Icon className={`w-3.5 h-3.5 ${i === activeIdx ? 'text-brand-700' : 'text-slate-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${i === activeIdx ? 'text-brand-800' : 'text-slate-700'}`}>{r.label}</p>
                      {r.sub && <p className="text-[11px] text-slate-400 truncate">{r.sub}</p>}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-3 text-[11px] text-slate-400">
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">↵</kbd> abrir</span>
          <span><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">esc</kbd> fechar</span>
          <span className="ml-auto"><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</kbd> qualquer lugar</span>
        </div>
      </div>
    </div>
  );
}
