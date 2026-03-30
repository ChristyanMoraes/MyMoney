# Inconsistências e plano de refatoração

Registo objetivo de desvios em relação a um modelo **multi-utilizador seguro** e a **padrões internos** coerentes. Itens estão ordenados por impacto (dados/segurança primeiro).

---

## 1. Inconsistências registadas

### 1.1 Crítico — isolamento de dados (multi-tenant)

| Área | Problema |
|------|----------|
| **CreditCard** | Modelo **sem `userId`**. `GET/POST /api/credit-cards` lista e cria cartões para **toda a base**: qualquer utilizador autenticado vê e associa transações a cartões de outros. |
| **Category** | **Sem `userId`**. Categorias são **globais**. O primeiro GET cria `DEFAULT_CATEGORIES` partilhadas por todos; **PUT/PATCH/DELETE** em `/api/categories/[id]` autenticam o utilizador mas **não verificam dono** — qualquer utilizador pode alterar/apagar qualquer categoria. |
| **Account** | Sem `userId` no schema (se for usado no futuro, mesmo risco). |

**Transações** e **dashboard** filtram por `userId` — alinhado com utilizador — mas **cartões** e **categorias** não, gerando inconsistência de domínio e risco de privacidade.

---

### 1.2 Alto — duplicação e manutenção

| Item | Detalhe |
|------|---------|
| **Schemas Zod** | `transactionSchema` (e variantes) repetido entre `api/transactions/route.ts` e `api/transactions/[id]/route.ts`; `categorySchema` entre `categories/route.ts` e `categories/[id]/route.ts`. Alterações exigem editar dois sítios. |
| **MoneyIcon** | SVG/markup duplicado em `page.tsx` (landing), `login`, `register`, `AppLayout` — divergência visual futura provável. |

---

### 1.3 Médio — dependências e tooling

| Item | Detalhe |
|------|---------|
| **Zod** | Importado em várias rotas mas **não declarado** em `dependencies` do `package.json`; vem **só por** `eslint-config-next` (versão pode mudar ou deixar de existir). Deve ser **`zod` direto** com versão fixada. |
| **@auth/prisma-adapter** | Presente no `package.json` mas o login é **Credentials + JWT**; adapter Prisma para OAuth não está integrado — **dependência não usada** ou preparação incompleta. |

---

### 1.4 Médio — infraestrutura e segurança operacional

| Item | Detalhe |
|------|---------|
| **SSL do pool PG** (`src/lib/prisma.ts`) | `ssl: { rejectUnauthorized: false }` facilita hosted DB com certificados não padrão, mas **reduz verificação TLS** — documentar excecção ou tornar configurável por ambiente (`DATABASE_SSL_REJECT_UNAUTHORIZED`). |

---

### 1.5 Baixo — estilo e UX de código

| Item | Detalhe |
|------|---------|
| **Pontuação / estilo** | Mistura de estilo com ou sem `;` (ex.: `authorize` em `auth.ts` vs rotas). |
| **Tratamento de erro em API** | Mensagens genéricas (`400` + "Erro ao…") sem mapear `ZodError` de forma uniforme; sem helper partilhado `jsonError` / código de erro estável. |
| **Layout dashboard** | Sem `src/app/dashboard/layout.tsx` — cada página repete `AppLayout` + `useSession`; poderia envolver filhos uma vez (com cuidado com páginas que precisam de props diferentes). |
| **Campos obrigatórios no schema** | `CreditCard` exige `closingDay`/`dueDay` no Prisma; a UI de cadastro simplificado pode não refletir todas as regras de negócio — validar alinhamento produto/schema. |

---

## 2. Plano de refatoração sugerido

Fases pensadas para **reduzir risco**: primeiro dados e API, depois DX e polimento.

### Fase A — Modelo e migração multi-utilizador (prioritário)

1. **CreditCard**: adicionar `userId` (obrigatório), relação com `User`; índice composto onde fizer sentido; migração que associa cartões existentes a um utilizador “legado” ou exige script manual.
2. **Category**: decidir produto: (a) categorias **por utilizador** com `userId` + seed por utilizador no primeiro acesso, ou (b) catálogo global **só leitura** com categorias custom apenas por user — hoje está no meio-termo perigoso.
3. Atualizar **todas** as queries em `credit-cards` e `categories` para filtrar/validar **dono**; em `PUT/DELETE` de categoria, `404` se não for do utilizador (ou política explícita de admin).
4. Rever **foreign keys** de `Transaction.creditCardId` para garantir que só aceita cartão do mesmo `userId`.

**Critério de aceite:** dois utilizadores de teste não conseguem ver nem editar dados um do outro (cartões, categorias, transações).

---

### Fase B — Consolidação de código

1. Extrair schemas Zod para `src/lib/validations/` (ex.: `transactions.ts`, `categories.ts`) e reexportar tipos inferidos se útil.
2. Componente único **`MoneyIcon`** (ou ícone da lib escolhida) importado de `@/components/icons/MoneyIcon`.
3. Helper **`requireSession()`** ou `getSessionOr401()` em `src/lib/auth-guard.ts` para encurtar boilerplate nas rotas.

---

### Fase C — Dependências e configuração

1. Adicionar **`zod`** às `dependencies` com versão alinhada ao usado no projeto (hoje transitivo ~4.x).
2. Remover **`@auth/prisma-adapter`** até haver integração real, ou implementar provider OAuth com adapter e documentar.
3. Opcional: variável de ambiente para política SSL do Postgres em desenvolvimento vs produção.

---

### Fase D — UX técnica (opcional)

1. `dashboard/layout.tsx` com shell comum + verificação de sessão uma vez (reduz duplicação).
2. Respostas de API padronizadas: `{ error: { code, message } }` e mapeamento de `ZodError` para mensagens de campo.
3. Testes automatizados mínimos: integração em rotas críticas (`transactions`, `credit-cards` após Fase A).

---

## 3. Resumo executivo

O maior desvio é **tratar transações como por-utilizador e cartões/categorias como globais sem controlo de escrita** — isso deve ser corrigido antes de uso com dados reais de várias pessoas. Em seguida, **centralizar validações e ícones** e **fixar Zod** como dependência direta reduz incidentes de build e retrabalho.
