'use client';

import { useMemo } from 'react';

interface Props {
  data: { day: string; total: number }[];
}

const WEEKS = 576 // ~11 years of history (covers since 2015);
const DAYS = 7;
const LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function intensity(total: number, max: number): string {
  if (total === 0) return 'bg-slate-100';
  const r = total / max;
  if (r < 0.25) return 'bg-brand-200';
  if (r < 0.5)  return 'bg-brand-400';
  if (r < 0.75) return 'bg-brand-600';
  return 'bg-brand-700';
}

export function ProductivityHeatmap({ data }: Props) {
  const { grid, monthLabels, max } = useMemo(() => {
    const map = new Map<string, number>();
    for (const { day, total } of data) map.set(day, total);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // start from Sunday WEEKS weeks ago
    const start = new Date(today);
    start.setDate(start.getDate() - today.getDay() - (WEEKS - 1) * 7);

    const grid: { date: string; total: number; future: boolean }[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < WEEKS; w++) {
      const col: { date: string; total: number; future: boolean }[] = [];
      for (let d = 0; d < DAYS; d++) {
        const cur = new Date(start);
        cur.setDate(start.getDate() + w * 7 + d);
        const iso = cur.toISOString().slice(0, 10);
        const month = cur.getMonth();
        if (d === 0 && month !== lastMonth) {
          monthLabels.push({ label: MONTHS[month], col: w });
          lastMonth = month;
        }
        col.push({ date: iso, total: map.get(iso) ?? 0, future: cur > today });
      }
      grid.push(col);
    }

    const max = Math.max(...data.map((d) => d.total), 1);
    return { grid, monthLabels, max };
  }, [data]);

  const total = useMemo(
    () => grid.flat().reduce((s, cell) => s + cell.total, 0),
    [grid],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{total} proposições (histórico completo)</span>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>Menos</span>
          {['bg-slate-100', 'bg-brand-200', 'bg-brand-400', 'bg-brand-600', 'bg-brand-700'].map((c) => (
            <span key={c} className={`w-3 h-3 rounded-sm inline-block ${c}`} />
          ))}
          <span>Mais</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Month labels */}
          <div className="flex ml-7 mb-1">
            {(() => {
              const labels: JSX.Element[] = [];
              let lastCol = -1;
              for (const { label, col } of monthLabels) {
                const gap = col - lastCol - 1;
                if (gap > 0) labels.push(<span key={`gap-${col}`} style={{ width: gap * 14 }} className="inline-block" />);
                labels.push(<span key={label + col} className="text-[10px] text-slate-400 inline-block w-[14px]">{label}</span>);
                lastCol = col;
              }
              return labels;
            })()}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {LABELS.map((l, i) => (
                <span key={l} className={`text-[10px] text-slate-400 h-3 leading-3 w-6 ${i % 2 === 1 ? '' : 'invisible'}`}>
                  {l}
                </span>
              ))}
            </div>

            {/* Grid */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    title={cell.future ? '' : `${cell.date}: ${cell.total} proposição(ões)`}
                    className={`w-3 h-3 rounded-sm ${cell.future ? 'bg-transparent' : intensity(cell.total, max)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
