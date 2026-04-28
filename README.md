# Luizianne Leis — Plataforma de Transparência Legislativa

Monolito modular para acompanhamento da atuação parlamentar baseado em dados oficiais da
**API da Câmara dos Deputados**, com arquitetura preparada para evoluir para microsserviços.

## Arquitetura

```
┌──────────────┐     ┌────────────────────────────────────────────┐
│  Next.js Web │◀───▶│              NestJS API (modular)          │
└──────────────┘     │  ┌──────────┐ ┌────────┐ ┌────────────┐    │
                     │  │  Core    │ │Analyt. │ │Notifications│   │
                     │  └────┬─────┘ └────┬───┘ └──────┬─────┘    │
                     │       │            │            │          │
                     │       └────────────┴────────────┘          │
                     │                event bus                   │
                     │       ▲                                    │
                     │  ┌────┴──────┐                             │
                     │  │ Ingestion │── BullMQ ──┐                │
                     │  └───────────┘            │                │
                     └────────┬──────────────────┴────────────────┘
                              │                  │
                          PostgreSQL          Redis
```

Serviços (módulos NestJS independentes; mesmo deployment hoje):

- **Core** — REST principal, expõe deputada, proposições, votos e atuação.
- **Ingestion** — consome a API da Câmara via cron + BullMQ. Faz diff por hash em
  `proposition_versions`, dedup de tramitações por hash e emite eventos de domínio.
- **Analytics** — métricas de produtividade, taxa de aprovação e rede de coautoria
  (views materializáveis no Postgres + cache Redis).
- **Notifications** — listener event-driven que persiste eventos em `system_events` e
  faz broadcast via SSE (`GET /api/notifications/stream`).
- **Health** — `GET /health`.

## Stack

Backend: Node.js 20, NestJS 10, PostgreSQL 16, Redis 7, BullMQ, axios.
Frontend: Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, SVG nativo para grafo.
Infra: Docker Compose, GitHub Actions (CI), pronto para Vercel (web) + Railway/Fly (api/db/redis).

## Subindo localmente

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run db:migrate
npm run db:seed
npm run ingest:run        # primeira carga (pode demorar)
npm run dev               # API em :8000, web em :3000
```

Ou tudo via Docker:

```bash
docker compose up --build
```

Swagger: http://localhost:8000/docs

## Endpoints REST

| Método | Path                                  | Descrição |
|--------|---------------------------------------|-----------|
| GET    | `/api/deputy`                         | Dados da deputada-alvo |
| GET    | `/api/propositions`                   | Lista filtrável (`type`, `year`, `status`, `search`) |
| GET    | `/api/propositions/:id`               | Detalhe + autores + tramitação |
| GET    | `/api/activity/authorship`            | Proposições como autora |
| GET    | `/api/activity/coauthorship`          | Como coautora |
| GET    | `/api/activity/rapporteur`            | Como relatora |
| GET    | `/api/votes`                          | Lista paginada |
| GET    | `/api/votes/:proposition_id`          | Votos de uma proposição |
| GET    | `/api/analytics/summary`              | Resumo do dashboard |
| GET    | `/api/analytics/productivity`         | Ranking de produtividade |
| GET    | `/api/analytics/approval`             | Distribuição de status |
| GET    | `/api/analytics/network`              | Grafo de coautoria |
| GET    | `/api/analytics/categories`           | Distribuição por área temática (NLP) |
| GET    | `/api/commissions`                    | Lista de comissões |
| GET    | `/api/commissions/deputy/:id`         | Comissões de um deputado |
| GET    | `/api/notifications`                  | Últimos eventos |
| GET    | `/api/notifications/stream`           | Eventos em tempo real (SSE) |
| POST   | `/api/admin/ingest`                   | Trigger manual de ingestão (header `x-admin-token`) |
| POST   | `/api/admin/reclassify?force=true`    | Reclassifica todas as proposições (NLP) |

## Eventos de domínio

`NEW_PROPOSITION`, `STATUS_CHANGED`, `NEW_VOTE`, `NEW_RAPPORTEUR` — emitidos pelo
`IngestionService` (`shared/event-bus.ts`), consumidos pelo `NotificationsListener`,
persistidos em `system_events` e propagados via SSE.

## Banco

Migrações em `db/migrations/` aplicadas pelo runner em `apps/api/src/infra/database/run-migrations.ts`.
Histórico imutável: `proceedings`, `proposition_versions`, `system_events`. Índices em
`external_id`, `(type, year)`, `status`, `presented_at`, GIN trigram em `title` e `name`.

## Cache & Rate limit

`CacheService` (Redis) com `wrap()` para memoização e `invalidate()` por padrão;
TTLs por endpoint. Throttling global com `@nestjs/throttler` (120 req/min default).

## Diferenciais já implementados

- **Diff-based ingestion** (snapshots versionados por hash → idempotente).
- **Rede de coautoria** com view SQL `v_coauthorship_edges` e renderização SVG.
- **Timeline de tramitação** imutável.
- **Classificação por NLP** (`ClassifierService`, `apps/api/src/modules/nlp`):
  classificador heurístico léxico em 9 categorias temáticas (saúde, educação,
  segurança, economia, direitos, ambiente, habitação, cultura, infraestrutura),
  com persistência em `proposition_categories` e contrato pronto para trocar pelo
  modelo ML que preferir (transformer, spaCy, OpenAI…) sem migração.
- **Real-time UI**: o frontend escuta o SSE em `/api/notifications/stream` via
  `RealtimeBadge` e mostra toasts dos eventos `NEW_PROPOSITION`, `STATUS_CHANGED`,
  `NEW_VOTE`, `NEW_RAPPORTEUR`.
- **Trigger manual** de ingestão / reclassificação via `/api/admin/*` com token.
- **Multi-deputado**: o schema é genérico; basta alterar `TARGET_DEPUTY_EXTERNAL_ID`
  ou expandir `DeputyService` para múltiplos alvos.
- **Rate limiting** ativo (Throttler global, 120 req/min default).

## Estrutura

```
apps/
  api/   # NestJS modular monolith
    src/
      modules/
        core/           # Deputy, Propositions, Votes, Activity
        ingestion/      # Câmara API client + queue + scheduler
        analytics/
        notifications/
        health/
      infra/            # database, redis, cache
      shared/           # event-bus, types
  web/   # Next.js App Router
    src/app/            # /, /propositions, /propositions/[id], /votes, /analytics
    src/components/     # StatCard, ProductivityChart, TypeBreakdown, Timeline, Coauthorship
db/migrations/          # SQL versionado
```

## Rumo a microservices

Cada módulo NestJS já tem fronteira clara de domínio. A migração consiste em:

1. Promover cada módulo a app NestJS independente.
2. Substituir `EventEmitter2` por broker (NATS/Kafka/Redis Streams) — interface `EventBus` já isola.
3. Separar bancos por bounded context se necessário (`core`, `ingestion`, `analytics`).
