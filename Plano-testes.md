# Plano de implementação — testes unitários e E2E

Este plano alinha-se com `Cursor.md` (regra: **rodar testes após mudanças no código**) e com a refatoração descrita em `Inconsistencias.md`. Está **separado por módulos**; em cada módulo listam-se **tarefas** com indicação **U** (unitário), **I** (integração, ex.: handler + mocks) ou **E** (E2E).

**Stack sugerida** (compatível com Next.js 16 + React 19):

| Tipo | Ferramenta sugerida | Nota |
|------|---------------------|------|
| Unit / componentes | **Vitest** + **@testing-library/react** + **jsdom** | Rápido, ESM nativo, bom com TypeScript |
| E2E | **Playwright** | Fluxos reais no browser; base URL `http://localhost:3000` em CI com servidor de preview |

Alternativa: Jest via `next/jest` — aceitável se a equipa preferir; o importante é **um** runner estável e scripts em `package.json`.

---

## Módulo 0 — Infraestrutura e convenções

**Estado:** implementado (Vitest + Testing Library + Playwright; smoke em `MonthFilter.test.tsx` e `e2e/smoke.spec.ts`).

**Objetivo:** Comandos únicos e pastas padronizadas antes de testar lógica de negócio.

| # | Tarefa | Tipo |
|---|--------|------|
| 0.1 | Adicionar dependências de desenvolvimento (Vitest, RTL, Playwright, tipos) e scripts `test`, `test:watch`, `test:e2e`, `test:e2e:ui` no `package.json` | — ✓ |
| 0.2 | Criar `vitest.config.ts` com alias `@/` igual ao `tsconfig` | U ✓ |
| 0.3 | Criar `playwright.config.ts` com `webServer: npm run build && npm run start` ou `npm run dev` para desenvolvimento local | E ✓ |
| 0.4 | Pastas sugeridas: `src/**/*.test.ts(x)` colocalizados ou `__tests__/` por feature; E2E em `e2e/*.spec.ts` | — ✓ |
| 0.5 | Documentar no README ou em `Cursor.md` (secção scripts) os comandos finais após o primeiro merge de testes | — ✓ |
| 0.6 | (Opcional CI) Job que executa `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e` com secrets apenas onde necessário | — *(pendente: `npm run lint` ainda falha em ficheiros legados)* |

---

## Módulo 1 — Autenticação e sessão

**Estado:** implementado (`src/lib/authorize-credentials.ts` + testes; `register/route.test.ts`; `e2e/auth.spec.ts`; registo usa `signIn` com `redirect: true` como o login).

**Ficheiros:** `src/auth.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts`, páginas `login`, `register`.

| # | Tarefa | Tipo |
|---|--------|------|
| 1.1 | Testes unitários do fluxo `authorize`: mock de `prisma.user.findFirst` + `bcrypt.compare` — sucesso, utilizador inexistente, senha incorreta, email vazio | U ✓ |
| 1.2 | Testes de `register` POST: body válido chama `create`; email duplicado retorna 400; Zod inválido retorna 400 | I ✓ |
| 1.3 | E2E: registo de utilizador fictício + redirecionamento ou login imediato consoante fluxo actual | E ✓ |
| 1.4 | E2E: login com credenciais válidas — chega ao dashboard; credenciais inválidas — mensagem de erro ou query `error` | E ✓ |
| 1.5 | Após refatoração multi-tenant ou mudança em JWT, repetir 1.1–1.4 e ajustar mocks | U / E |

---

## Módulo 2 — Middleware

**Estado:** implementado (`src/lib/middleware-authorized.ts`, `src/lib/middleware-matcher.ts`; `middleware.ts` importa a função de autorização; E2E em `e2e/auth.spec.ts`).

**Ficheiros:** `middleware.ts`

| # | Tarefa | Tipo |
|---|--------|------|
| 2.1 | Extrair ou testar `callbacks.authorized` com requests simuladas: `/`, `/login`, `/register` permitem acesso; `/dashboard` sem token redireciona; com token mockado permite | U / I ✓ |
| 2.2 | Garantir que alterações em `matcher` não bloqueiam `api/auth` nem assets estáticos | U ✓ |
| 2.3 | E2E smoke: utilizador não autenticado acede `/dashboard` e acaba em `/login` (ou fluxo configurado) | E ✓ |

---

## Módulo 3 — API Dashboard

**Estado:** implementado (`src/lib/dashboard-month-range.ts` + `dashboard-month-range.test.ts`; `src/app/api/dashboard/route.test.ts`).

**Ficheiros:** `src/app/api/dashboard/route.ts`

| # | Tarefa | Tipo |
|---|--------|------|
| 3.1 | Mock `auth()` sem sessão → 401 | I ✓ |
| 3.2 | Mock `auth()` com `user.id` + prisma mock — resposta inclui chaves esperadas (summary, categorias, etc.) para mês/ano fixos | I ✓ |
| 3.3 | Regressão: filtros de data em UTC (comparar limites com casos de borda mês/mudança de ano) | U / I ✓ |

---

## Módulo 4 — API Transações

**Ficheiros:** `src/app/api/transactions/route.ts`, `src/app/api/transactions/[id]/route.ts`

| # | Tarefa | Tipo |
|---|--------|------|
| 4.1 | GET sem sessão → 401 | I |
| 4.2 | GET com `month`, `year`, `categoryId`, `creditCardId` — `where` construído correctamente (pode usar snapshot do objeto `where` com prisma mock) | I |
| 4.3 | POST: Zod rejeita amount ≤ 0; sucesso chama `create` / parcelas com dados esperados | I |
| 4.4 | PUT/PATCH/DELETE: 404 quando transação não pertence ao `userId`; sucesso quando pertence | I |
| 4.5 | E2E: criar despesa pela UI (modal) e verificar listagem ou API | E |
| 4.6 | Após Fase A de `Inconsistencias.md` (cartão por utilizador), adicionar casos de isolamento (não associar cartão alheio) | I |

---

## Módulo 5 — API Categorias

**Ficheiros:** `src/app/api/categories/route.ts`, `src/app/api/categories/[id]/route.ts`

| # | Tarefa | Tipo |
|---|--------|------|
| 5.1 | GET sem sessão → 401; com sessão retorna lista (mock createMany default categories se vazio — comportamento actual) | I |
| 5.2 | POST nome duplicado → 400 | I |
| 5.3 | PUT/DELETE: após refatoração com `userId`, testes de permissão (só dono); antes disso, documentar risco nos testes como `@todo security` | I |

---

## Módulo 6 — API Cartões de crédito

**Ficheiros:** `src/app/api/credit-cards/route.ts`

| # | Tarefa | Tipo |
|---|--------|------|
| 6.1 | GET/POST sem sessão → 401 | I |
| 6.2 | POST body válido — `create` com campos esperados | I |
| 6.3 | Após introduzir `userId` no modelo, filtrar listagem e criação por utilizador e cobrir com testes de isolamento | I |
| 6.4 | E2E: fluxo “sem cartões” → cadastro → página cartão mostra dados | E |

---

## Módulo 7 — Componentes e UI reutilizável

**Ficheiros:** `src/components/*` (MonthFilter, TransactionModal, CategoryModal, AppLayout, ThemeToggle, etc.)

| # | Tarefa | Tipo |
|---|--------|------|
| 7.1 | **MonthFilter**: mudança de mês/ano dispara callback com valores correctos | U |
| 7.2 | **ThemeToggle**: alternância chama `setTheme` mock | U |
| 7.3 | **AppLayout** (ou extrair nav): itens de menu e link activo com `MemoryRouter` ou mock de `usePathname` | U |
| 7.4 | **TransactionModal**: submit com campos mínimos (mock `fetch`) — foco em validação de formulário, não no chart | U |
| 7.5 | Manter testes **estáveis** — evitar asserts em classes Tailwind frágeis; preferir roles e labels (a11y) | U |

---

## Módulo 8 — Páginas dashboard (cliente)

**Ficheiros:** `src/app/dashboard/**/page.tsx`, `src/app/page.tsx`

| # | Tarefa | Tipo |
|---|--------|------|
| 8.1 | Testes ligeiros: mock `useSession` loading vs authenticated — evitar `return null` silencioso (regressão já corrigida no dashboard) | U |
| 8.2 | E2E: utilizador logado abre dashboard, filtro mês altera URL ou dados visíveis | E |
| 8.3 | E2E: navegação para movimentações, categorias, cartão de crédito pelo menu (desktop e/ou menu móvel) | E |

---

## Módulo 9 — Validações e helpers (pós-refatoração)

**Dependência:** extração de schemas Zod para `src/lib/validations/` (Fase B em `Inconsistencias.md`).

| # | Tarefa | Tipo |
|---|--------|------|
| 9.1 | Testes puramente unitários para cada schema: casos válidos e mensagens de erro nos inválidos | U |
| 9.2 | Helpers `requireSession` / formatação de moeda — funções puras com entradas fixas | U |

---

## Ordem de execução recomendada

1. **Módulo 0** — sem isto, o resto não escala.  
2. **Módulo 1** + **2** — auth e middleware são pré-requisitos para I confiável nas APIs.  
3. **Módulo 3** e **4** — maior superfície de negócio.  
4. **5** e **6** — alinhados à refatoração multi-tenant.  
5. **7** e **8** em paralelo quando a equipa tiver tempo.  
6. **9** quando os schemas estiverem centralizados.

---

## Métricas de prontidão (definição de “feito” por fase)

- **Fase mínima:** Módulo 0 + 1.4 + 2.3 + um teste I em dashboard ou transações + `npm run test` verde no CI.  
- **Fase sólida:** Todos os módulos 1–6 com cobertura I nos endpoints principais + E2E login + fluxo transação.  
- **Fase UX:** Módulos 7–8 com testes de componente e E2E de navegação.

Qualquer alteração de código que quebre estes testes deve ser **corrigida ou acompanhada de actualização explícita dos testes**, na linha da regra em `Cursor.md`.
