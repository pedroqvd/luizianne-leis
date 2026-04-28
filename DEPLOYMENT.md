# Deploy — Stack 100% Gratuita

| Serviço     | Plataforma                        | Free tier                                            |
|-------------|-----------------------------------|------------------------------------------------------|
| Frontend    | [Vercel](https://vercel.com)      | Hobby ilimitado                                      |
| API         | [Render](https://render.com)      | 750h/mês, dorme após 15min sem tráfego               |
| PostgreSQL  | [Supabase](https://supabase.com)  | 500 MB, pausa após 7 dias sem atividade              |
| Redis       | [Upstash](https://upstash.com)    | 10 000 comandos/dia, 256 MB                          |

Tempo total estimado: **15-20 min**.

---

## 1. PostgreSQL — Supabase

1. Crie um projeto em https://supabase.com/dashboard.
2. Em **Project Settings → Database** copie a connection string da seção
   **"Connection pooling" — Mode: Session** (porta 5432). Formato:

   ```
   postgresql://postgres.<ref>:<senha>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

3. Em **Database → Extensions** habilite `pg_trgm` (busca por similaridade).
4. Anote a URL — será o `DATABASE_URL`.

> Migrações rodam automaticamente no boot da API (entrypoint do Docker).

---

## 2. Redis — Upstash

1. Crie um banco em https://console.upstash.com/redis (região mais próxima do Render).
2. Em **Details → Connect → ioredis** copie o `REDIS_URL`. Formato:

   ```
   rediss://default:<token>@<endpoint>.upstash.io:6379
   ```

3. Anote — será o `REDIS_URL` (note o duplo `s` em `rediss`, indica TLS).

---

## 3. API — Render

1. Push do repo para o GitHub (já feito).
2. Em https://dashboard.render.com → **New + → Blueprint**, aponte para o repositório.
   O `render.yaml` na raiz já está configurado.
3. Após o blueprint detectar o serviço, no painel do serviço **luizianne-api**
   defina os **Environment Variables** marcados com `sync: false`:

   | Variável        | Valor                                                    |
   |-----------------|----------------------------------------------------------|
   | `DATABASE_URL`  | URL do Supabase (passo 1)                                |
   | `REDIS_URL`     | URL do Upstash (passo 2)                                 |
   | `ADMIN_TOKEN`   | qualquer string secreta                                  |
   | `CORS_ORIGINS`  | `https://<seu-projeto>.vercel.app,http://localhost:3000` |

4. Deploy começa automaticamente. Acompanhe os logs até ver
   `[entrypoint] migrations done.` e `API ready on :8000`.
5. Anote a URL pública (`https://luizianne-api.onrender.com`).

> ⚠️ Free tier do Render dorme após 15 min sem requests. Primeira chamada
> demora ~30s. Para manter aquecido use **UptimeRobot** (gratuito) pingando
> `/health` a cada 5 min.

---

## 4. Frontend — Vercel

1. https://vercel.com/new → importe o repositório.
2. Em **Configure Project**:
   - **Root Directory**: `apps/web` *(clique em Edit ao lado)*
   - **Framework Preset**: Next.js *(detectado automaticamente)*
   - **Install Command**, **Build Command**, **Output Directory**: deixe padrão
3. Em **Environment Variables** adicione:

   | Variável                | Valor                                  |
   |-------------------------|----------------------------------------|
   | `NEXT_PUBLIC_API_URL`   | `https://luizianne-api.onrender.com`   |

4. Clique **Deploy**. Após ~2 min está no ar em `https://<seu-projeto>.vercel.app`.

5. **Volte ao Render** e atualize `CORS_ORIGINS` com a URL exata da Vercel.
   O serviço reinicia automaticamente.

---

## 5. Primeira ingestão

Após o boot, o cron roda a cada 6 horas. Para popular imediatamente:

```bash
curl -X POST https://luizianne-api.onrender.com/api/admin/ingest \
  -H "x-admin-token: <ADMIN_TOKEN>"
```

Deve retornar `{"enqueued":true,"jobId":"…"}`. A ingestão completa demora
5–15 min (depende do volume da deputada-alvo). Acompanhe no dashboard:

```
https://<seu-projeto>.vercel.app/notifications
```

Eventos `NEW_PROPOSITION` aparecem em tempo real conforme a ingestão sincroniza.

---

## Troubleshooting

| Sintoma                               | Causa                                            | Fix                                                      |
|---------------------------------------|--------------------------------------------------|----------------------------------------------------------|
| `ECONNREFUSED` no Render              | `DATABASE_URL` errada (use Session pooler)        | Pegar URL na seção pooler, **não** "Direct connection"   |
| `self signed certificate` no Postgres | SSL não habilitado                                | URL contém `supabase` → SSL ativa sozinho                |
| `MaxRetriesPerRequestError` no Redis  | URL sem `rediss://` (TLS) no Upstash              | Copiar URL via "ioredis" no painel Upstash               |
| CORS bloqueado no browser             | `CORS_ORIGINS` não inclui a URL Vercel            | Atualizar env var no Render                              |
| Vercel não acha lockfile              | "Root Directory" não setado para `apps/web`       | Project Settings → Root Directory → `apps/web`           |
| Free tier do Supabase pausou          | 7 dias sem queries                                | Fazer 1 query no SQL Editor para reativar                |

---

## Custom domain (opcional, gratuito)

- Vercel: Domain Settings → adicionar domínio + DNS CNAME → automaticamente
  emite SSL via Let's Encrypt.
- Render: Settings → Custom Domain (também gratuito com SSL).
