# Cursor — Contexto do projeto My Money

Documento de referência para ferramentas e pessoas que trabalham no código: o que o sistema faz, como está organizado e quais convenções emergiram no repositório.

---

## 1. Visão geral do produto

**My Money** é uma aplicação web de **controle financeiro pessoal** em português (Brasil): cadastro de **receitas e despesas**, **categorias**, **metas de gasto**, **objetivos financeiros**, visão mensal no **dashboard** (gráficos e resumos), **movimentações**, **gastos por categoria** (detalhe e navegação por mês/ano) e **cartão de crédito** (cartões, filtros por mês, gráficos por categoria/responsável, compras parceladas e campo “quem comprou”).

Fluxo do utilizador: **landing** (`/`) → **login/registo** → **área autenticada** sob `/dashboard` protegida por **middleware** NextAuth.

---

## 2. Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js 16** (App Router, Turbopack no build) |
| UI | **React 19**, **Tailwind CSS 4** (`@tailwindcss/postcss`) |
| Auth | **NextAuth v4** (estratégia **JWT**, provider **Credentials** + bcrypt) |
| Base de dados | **PostgreSQL** via **Prisma 7** + **`@prisma/adapter-pg`** (`pg` pool) |
| Validação em API | **Zod** (hoje como dependência transitiva — ver `Inconsistencias.md`) |
| Gráficos | **Recharts** |
| Tema | **next-themes** (claro/escuro), script inline no `layout` para evitar flash |

Variáveis de ambiente relevantes (padrão NextAuth/Prisma): `DATABASE_URL`, `AUTH_SECRET` ou `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (recomendado alinhar com o URL real da app).

---

## 3. Estrutura de pastas (alto nível)

```
src/app/                 # App Router: páginas e Route Handlers
  api/                   # REST: dashboard, transactions, categories, credit-cards, auth
  dashboard/             # Páginas autenticadas (dashboard, movimentações, categorias, cartão, gastos…)
  login/, register/
  layout.tsx, page.tsx   # Root: fontes, ThemeProvider, AuthProvider (SessionProvider)
src/components/          # UI reutilizável: AppLayout, modais, MonthFilter, tema, etc.
src/lib/prisma.ts        # Instância singleton PrismaClient + pool pg
src/auth.ts              # authOptions, auth(), export GET/POST para NextAuth
src/types/next-auth.d.ts # Extensão Session.user.id
middleware.ts            # withAuth: rotas públicas /, /login, /register; resto exige JWT
prisma/schema.prisma     # Modelos + enums; client gerado em src/generated/prisma
prisma.config.ts         # Configuração Prisma 7 (projecto)
```

**Nota:** O client Prisma é gerado para `src/generated/prisma` (não usar `@prisma/client` default no import do app — o código usa `@/generated/prisma/client` onde aplicável).

---

## 4. Modelo de domínio (Prisma) — resumo

- **User**: utilizador com email/senha (bcrypt); relação com `Transaction` e `FinancialGoal`.
- **Transaction**: despesa/receita; campos de data, categoria, conta, cartão, fatura de cartão, parcelas (`installments`, `installmentNumber`), `purchasedBy`, etc.
- **Category**: catálogo de categorias (tipos `ExpenseCategoryType`); usado por transações e `SpendingGoal`.
- **Account**, **CreditCard**, **CreditCardInvoice**: contas e cartões; faturas mensais do cartão com `@@unique([cardId, month, year])`.
- **SpendingGoal** / **FinancialGoal**: metas de gasto por categoria/mês e metas financeiras do utilizador.

Relações `userId` em `Transaction` são **opcionais** no schema (`String?`) — o código das APIs costuma preencher com o utilizador da sessão.

---

## 5. Autenticação e autorização

- **Sessão**: JWT; callbacks `jwt` / `session` propagam `user.id`.
- **Servidor**: `auth()` importado de `@/auth` nas route handlers.
- **Cliente**: `SessionProvider` em `AuthProvider`, `useSession` nas páginas.
- **Middleware**: `authorized` permite `/`, `/login`, `/register` sem token; demais rotas exigem token. Rotas `api/auth` excluídas do matcher.

Página de login usa `signIn("credentials", { callbackUrl: "/dashboard", redirect: true })` por compatibilidade com o cliente NextAuth e URLs relativas.

---

## 6. Padrões de implementação observados

### APIs (`src/app/api/**/route.ts`)

1. `const session = await auth();` — rejeitar com `401` + `{ error: "Não autorizado" }` se não houver `session?.user?.id`.
2. Parâmetros de query ou body validados com **Zod** onde existe schema.
3. Respostas com **`NextResponse.json`**: erros de validação muitas vezes `400` com mensagem genérica e `console.error` no servidor.
4. Transações e dashboard filtram por **`userId: session.user.id`** onde o modelo é multi-inquilino na prática.

### Frontend

- Páginas interativas como **`"use client"`**.
- Layout autenticado: **`AppLayout`** (sidebar desktop `lg+`, menu móvel com estado local).
- Estética: fundo zinc / `#131720`, acento **`#10b77f`**, tipografia Geist.
- Filtros mensais: componente **`MonthFilter`** e datas agregadas em **UTC** nas APIs para consistência entre fusos.

### Formatação de código

- Predominância de **Aspas duplas** e **ponto e vírgula** em ficheiros mais recentes; alguns ficheiros legados misturam estilo (menos `;` em `auth`/authorize).

---

## 7. Scripts NPM

- `npm run dev` — desenvolvimento  
- `npm run build` / `npm run start` — produção  
- `npm run lint` — ESLint  
- `npm run test` — Vitest (`src/**/*.test.ts(x)`), ver `vitest.config.ts`  
- `npm run test:watch` — Vitest interativo  
- `npm run test:e2e` — Playwright (`e2e/*.spec.ts`); na primeira vez: `npm run test:e2e:install`  
- `npm run test:e2e:ui` — Playwright com UI  
- `npm run test:e2e:install` — instala Chromium para E2E  

Prisma: `npx prisma generate`, `npx prisma db push` / migrações conforme ambiente.

---

## 8. Regra de workflow — executar testes após mudanças no código

**Sempre que alterares o código** (nova feature, refatoração, correção de bugs ou ajustes de configuração que afetem comportamento), **corre os testes antes de dar a tarefa como concluída**:

1. **`npm run test`** — suíte de testes unitários e de integração (componentes, helpers, handlers com dependências mockadas). Corrigir falhas no código ou, se o comportamento mudou de forma intencional, atualizar o teste e documentar em mensagem de commit ou PR.
2. **`npm run test:e2e`** — sempre que tocares em **fluxos completos** (login, registo, dashboard, APIs críticas com UI), ou antes de merges para `main`, para validar o caminho real do utilizador.

Objetivo com a refatoração em curso (ver `Inconsistencias.md`): a suíte passa a **rede de segurança** — mudanças não devem quebrar contratos já cobertos por testes. Quando ainda não existir script configurado, a primeira entrega do plano em `Plano-testes.md` é precisamente criar estes comandos e um smoke mínimo; até lá, no mínimo **`npm run build`** e **`npm run lint`** não podem falhar.

---

## 9. Ficheiros relacionados

- **`Inconsistencias.md`** — lacunas de modelo multi-utilizador, duplicação de schemas, dependências e plano de refatoração sugerido.  
- **`Plano-testes.md`** — plano de implementação de testes unitários e E2E por módulos, tarefas e ordem sugerida.

Manter este ficheiro atualizado quando a arquitetura mudar (novos módulos, auth, ou decisão explícita single-tenant vs multi-tenant).
