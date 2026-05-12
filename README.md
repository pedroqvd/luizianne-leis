# Luizianne Leis — Plataforma de Transparência Legislativa

Plataforma completa de acompanhamento da atuação parlamentar de **Luizianne Lins (REDE · CE)**, baseada em dados oficiais da API da Câmara dos Deputados, Portal da Transparência e PNCP.

## Arquitetura

```
┌───────────────────┐     ┌──────────────────────────────────────────────┐
│   Next.js Web     │◀───▶│              NestJS API (modular)            │
│  (Vercel / SSR)   │     │                                              │
└───────────────────┘     │  Core · Analytics · Ingestion · Notifications │
         │                │  CEAP · Discursos · Frentes · Emendas-Orc    │
         │                │  Editais · Comissões · Admin                  │
         ▼                └──────────────────┬───────────────────────────┘
    Supabase Auth                            │
    (RLS + Storage)                   PostgreSQL + Redis
```

## Stack

| Camada | Tecnologias |
|--------|------------|
| **Backend** | Node.js 22, NestJS 10, PostgreSQL 16, Redis 7, BullMQ |
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, Supabase Auth |
| **Infra prod (gratuita)** | Vercel (web) · Render (api) · Supabase (Postgres + Storage) · Upstash (Redis) |
| **Fontes de dados** | API Câmara dos Deputados · Portal da Transparência · PNCP |

## Módulos da API

| Módulo | Descrição |
|--------|-----------|
| **Core** | Deputada, proposições, votos, atividade, comissões |
| **Analytics** | Produtividade, aprovação, coautoria, heatmap, categorias |
| **Ingestion** | Sincronização com API da Câmara (multi-legislatura: 55ª, 56ª, 57ª) |
| **CEAP** | Cota parlamentar — despesas por tipo, fornecedor, ano |
| **Discursos** | Pronunciamentos no Plenário com busca por full-text |
| **Frentes** | Frentes parlamentares por legislatura |
| **Emendas-Orc** | Emendas orçamentárias (Portal da Transparência) |
| **Editais** | Monitor de editais federais em tempo real (PNCP) |
| **Notifications** | Outbox pattern + SSE para eventos em tempo real |
| **Admin** | Triggers manuais protegidos por `AdminGuard` |

## Subindo localmente

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run db:migrate
npm run dev               # API em :8000, web em :3000
```

Swagger: http://localhost:8000/docs

## Endpoints REST

### Dados públicos

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/deputy` | Dados da deputada-alvo |
| GET | `/propositions` | Lista filtrável (`type`, `year`, `status`, `role`, `search`) |
| GET | `/propositions/:id` | Detalhe + autores + tramitação |
| GET | `/votes` | Votos paginados (`absencesOnly`, `limit`, `offset`) |
| GET | `/votes/stats/target` | Estatísticas de votação (sim/não/abstenção/ausência) |
| GET | `/commissions/target` | Comissões ativas e anteriores |
| GET | `/analytics/summary` | Resumo do dashboard |
| GET | `/analytics/productivity` | Produtividade por autor/coautor/relator |
| GET | `/analytics/approval` | Distribuição de status das proposições |
| GET | `/analytics/network` | Grafo de coautoria |
| GET | `/analytics/categories` | Distribuição por área temática |
| GET | `/analytics/heatmap` | Atividade semanal (histórico completo) |
| GET | `/ceap` | Despesas da cota parlamentar filtrável |
| GET | `/ceap/stats` | Totais e período coberto |
| GET | `/ceap/by-year` | Agrupamento anual |
| GET | `/ceap/by-tipo` | Agrupamento por categoria de despesa |
| GET | `/discursos` | Pronunciamentos (`ano`, `tipo`, `search`) |
| GET | `/discursos/stats` | Total, anos de atividade, tipos |
| GET | `/discursos/by-year` | Discursos por ano |
| GET | `/discursos/by-tipo` | Discursos por tipo |
| GET | `/frentes` | Frentes parlamentares por legislatura |
| GET | `/frentes/stats` | Total e legislaturas |
| GET | `/emendas-orc` | Emendas orçamentárias filtrável (`ano`, `uf`, `tipo`, `search`) |
| GET | `/emendas-orc/stats` | Totais de dotação, empenhado, pago |
| GET | `/emendas-orc/by-year` | Execução por ano |
| GET | `/emendas-orc/by-funcao` | Por área temática |
| GET | `/emendas-orc/by-uf` | Por estado de destino |
| GET | `/editais` | Editais federais filtráveis (PNCP) |
| GET | `/editais/stats` | Abertos, encerrando, valor total |
| GET | `/editais/ministries` | Lista de ministérios com editais |
| GET | `/notifications` | Últimos eventos (`limit`) |
| GET | `/notifications/stream` | Eventos em tempo real (SSE) |
| GET | `/health` | Health check |

### Admin (requer `x-admin-token`)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/admin/ingest` | Ingestão completa (proposições, votos, comissões) |
| POST | `/admin/ingest-editais` | Ingestão de editais do PNCP |
| POST | `/admin/ingest-emendas-orc` | Ingestão de emendas do Portal da Transparência |
| POST | `/admin/check-absences` | Verificar ausências recentes |
| POST | `/admin/check-absences-historical` | Verificar ausências históricas |
| POST | `/admin/check-laws` | Alerta de leis aprovadas |
| POST | `/admin/reclassify` | Reclassificar proposições por NLP |

### Ingestão individual

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/ceap/ingest/historical` | Ingestão histórica da cota parlamentar |
| POST | `/discursos/ingest/historical` | Ingestão histórica de discursos |
| POST | `/frentes/ingest` | Sincronizar frentes parlamentares |

## Multi-legislatura

A deputada possui IDs distintos na API da Câmara por mandato (55ª, 56ª, 57ª legislaturas).
O serviço de ingestão descobre automaticamente os IDs históricos via `findDeputyIdsByLegislatura`
e usa um `historicalIdMap` para evitar criação de registros duplicados ("ghost records"):

```
legislatura 55: found ids [XXXXX]
legislatura 56: found ids [YYYYY]
syncing propositions for deputy ids: [178866, XXXXX, YYYYY]
```

## Banco de dados

Migrações em `db/migrations/` aplicadas automaticamente na inicialização da API.

Tabelas principais:
- `deputies`, `propositions`, `proposition_authors`, `proposition_proceedings`
- `proposition_versions` — histórico imutável de mudanças por hash
- `votes` — votos nominais + ausências
- `ceap_despesas` — cota parlamentar
- `discursos` — pronunciamentos
- `frentes`, `frente_members` — frentes parlamentares
- `emendas_orcamentarias` — emendas do Portal da Transparência
- `editais` — editais do PNCP
- `commissions`, `deputy_commissions` — comissões
- `system_events`, `outbox_events` — eventos de domínio (outbox pattern)
- `app_users`, `presence_records`, `demands` — gestão interna (Supabase)

Views materializadas: `v_deputy_productivity`, `v_proposition_approval`,
`v_coauthorship_edges`, `v_categories_breakdown`.

## Cache & Rate limit

`CacheService` (Redis) com `wrap()` para memoização por padrão glob (`analytics:*`, `propositions:*`).
Throttling global: 120 req/min via `@nestjs/throttler`.

## Autenticação (painel interno)

O painel web usa **Supabase Auth** (email + senha). Permissões por usuário são controladas
via `app_users.role` (`admin` / `member`) e `app_users.allowed_tabs` (array de slugs visíveis).
Server Actions Next.js validam ownership antes de qualquer mutação de dados.

## Diferenciais

- **Diff-based ingestion** — snapshots versionados por hash; idempotente em re-runs
- **Outbox pattern** — eventos salvos transacionalmente com `SKIP LOCKED` para concorrência multi-node
- **Full Text Search** — índices GIN com `tsvector` em `propositions` e `discursos`
- **Heatmap histórico completo** — 576 semanas (~11 anos) de atividade legislativa
- **Rede de coautoria** — view SQL `v_coauthorship_edges` + renderização SVG
- **NLP temático** — `ClassifierService` com 9 categorias; contrato substituível por qualquer modelo ML
- **Real-time UI** — SSE em `/notifications/stream` com toasts de eventos de domínio
- **Multi-deputado** — schema genérico; basta alterar `TARGET_DEPUTY_EXTERNAL_ID`

## Estrutura

```
apps/
  api/src/
    modules/
      core/           # deputy, propositions, votes, commissions
      ingestion/      # câmara API client, cron, historical sync, absence tracker
      analytics/      # produtividade, aprovação, coautoria, heatmap
      ceap/           # cota parlamentar
      discursos/      # pronunciamentos
      frentes/        # frentes parlamentares
      emendas-orc/    # emendas orçamentárias
      editais/        # editais PNCP
      notifications/  # outbox worker, SSE
      admin/          # triggers manuais
      nlp/            # classificador temático
    infra/            # database pool, redis, cache
    shared/           # event-bus, types
  web/src/
    app/(app)/        # dashboard, legislativo, emendas, votes, ceap,
                      # discursos, frentes, editais, comissoes, analytics,
                      # presenca, demandas
    app/(auth)/       # login
    components/       # layout (Sidebar, MobileDrawer), ProductivityHeatmap,
                      # CoauthorshipGraph, RealtimeBadge
db/migrations/        # SQL versionado (001 → 016)
render.yaml           # deploy Render (api)
```
