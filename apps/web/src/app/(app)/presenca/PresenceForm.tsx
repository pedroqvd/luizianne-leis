'use client';

import { useState, useTransition } from 'react';
import { createPresenceRecord } from '@/app/(app)/actions/presenca';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { MapPin, Calendar, Camera, X, Loader2 } from 'lucide-react';

const TYPES = [
  { value: 'expediente',  label: 'Expediente' },
  { value: 'reuniao',     label: 'Reunião' },
  { value: 'evento',      label: 'Evento' },
  { value: 'audiencia',   label: 'Audiência Pública' },
  { value: 'sessao',      label: 'Sessão Plenária' },
  { value: 'comissao',    label: 'Comissão' },
  { value: 'outro',       label: 'Outro' },
];

interface Props { onClose: (record?: any) => void }

export function PresenceForm({ onClose }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [location, setLocation]   = useState<'brasilia' | 'fortaleza'>('brasilia');
  const [date, setDate]           = useState(today);
  const [type, setType]           = useState('expediente');
  const [notes, setNotes]         = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError]         = useState('');
  const [pending, startTransition] = useTransition();

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        let photo_url: string | undefined;
        if (photoFile) {
          const supabase = createClient();
          const ext = photoFile.name.split('.').pop();
          const path = `${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('presence-photos')
            .upload(path, photoFile, { upsert: true });
          if (uploadError) {
            setError(`Erro ao enviar foto: ${uploadError.message}`);
            return;
          }
          const { data } = supabase.storage.from('presence-photos').getPublicUrl(path);
          photo_url = data.publicUrl;
        }
        const record = await createPresenceRecord({ location, date, type, notes: notes || undefined, photo_url });
        onClose(record);
      } catch (e: any) {
        setError(e.message ?? 'Erro ao salvar.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Registrar Presença</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Local */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Local</label>
            <div className="grid grid-cols-2 gap-2">
              {(['brasilia', 'fortaleza'] as const).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    location === loc
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {loc === 'brasilia' ? 'Brasília' : 'Fortaleza'}
                </button>
              ))}
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="input w-full"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de atividade</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input w-full">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Pauta, compromissos, detalhes…"
              className="input w-full resize-none"
            />
          </div>

          {/* Foto */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <Camera className="w-3.5 h-3.5 inline mr-1" />Foto (opcional)
            </label>
            {photoPreview ? (
              <div className="relative h-32 w-full">
                <Image src={photoPreview} alt="preview" fill className="object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-slate-500 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg h-16 cursor-pointer hover:bg-slate-50 transition-colors text-xs text-slate-400">
                <Camera className="w-4 h-4" />
                Clique para adicionar foto
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
            )}
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn border border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex-1 btn-primary justify-center">
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
