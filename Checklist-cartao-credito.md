# Checklist — Compras no cartão (aba Cartão de crédito)

Plano derivado da conversa: cadastrar compras na aba do cartão (total, parcelas, responsável) e exibir mapa da fatura / totais por responsável. Referência técnica: `POST /api/transactions` já parcela compras com `creditCardId`.

---

## Decisões de produto (antes ou durante o MVP)

- [ ] Definir se a “fatura” no MVP é **mês civil** (filtro atual) ou já **ciclo de fechamento** (`closingDay` + `CreditCardInvoice`).
- [x] Decidimos que vamos usar o mês civil como já esta sendo atualmente 
- [ ] Definir se **valor da parcela** é só `total / N` ou se permite ajuste (ex. última parcela corrigir centavos).
- [x] Decidimos que vamos usar o valor da parcela como 'total / N' porem com uma opção de edição manual para cada parcela
- [ ] Definir se **categoria** é obrigatória; se não, qual **categoria padrão** para compras só pelo cartão.
- [x] Decidimos que vamos usar categorias para as compras do cartão de crédito, e podemos usar inclusive as mesmas categorias criadas.
- [ ] Definir **responsáveis**: lista fixa (Eu, Cônjuge, …) vs texto livre (como hoje).
- [x] Decidimo que vamos usar uma lista fixa de pessoas cadastradas, onde vamos pode adicionar e remover pessoas dessa lista assim como editar informações sobre elas. 

---

## Fase A — MVP (UI + agregações sem mudar schema)

### UI — cadastro na aba Cartão

- [x] Adicionar botão **“Nova compra no cartão”** em `src/app/dashboard/cartao-credito/page.tsx` (ou componente extraído).
- [x] Implementar **modal** (`src/components/CreditCardPurchaseModal.tsx`): descrição, valor total, nº parcelas, sugestão total/N, parcela manual opcional (`installmentAmount` na API), responsável, data, categoria obrigatória.
- [x] No submit, chamar **`POST /api/transactions`** com `type: "EXPENSE"`, `creditCardId`, `amount` = total, `installments`, `purchasedBy`, `date`, `categoryId`, `installmentAmount` quando manual.
- [x] Após sucesso: **refetch** via `loadTransactions` e fechar modal; erros com mensagem (`errors.submit`).
- [x] Lista de responsáveis: modelo **`ResponsiblePerson`** + API **`/api/responsible-people`** + página **`/dashboard/responsaveis`**; modais usam select alimentado pela API (cadastro inicial feito por ti na página Responsáveis).

### UI — mapa / resumo do mês

- [x] Exibir **total da fatura** do mês (soma existente; rótulo **“Total no mês (calendário)”**).
- [x] Visualização **por responsável** (gráfico de barras já existente; `null` → “Não informado”).
- [x] Tabela: coluna **Parcela** com texto **“k de N”** / à vista.

### Qualidade

- [ ] Testar fluxo manual: 1 parcela (à vista) e N parcelas; mudar `MonthFilter` e confirmar parcelas nos meses certos.
- [ ] Confirmar em **Movimentações** que as mesmas transações aparecem (mesma origem).

---

## Fase B — Agrupamento fiável + fatura por ciclo (schema / API)

### Modelo e API

- [ ] Adicionar campo **`purchaseGroupId`** (ex. `String?` / cuid) em `Transaction` no `schema.prisma`; gerar e aplicar migração ou `db push` conforme processo do projeto.
- [ ] No **`POST /api/transactions`**, quando criar compra parcelada no cartão, gerar **um** `purchaseGroupId` e repetir em **todas** as parcelas (incl. loop `i = 2..N`).
- [ ] (Opcional) Preencher **`invoiceId`** usando `CreditCardInvoice` + regras de `closingDay` / mês da fatura; documentar regra na API.

### UI

- [ ] Agrupar na interface por **`purchaseGroupId`**: mostrar compra como um grupo com “parcela k de N” e total da compra.
- [ ] (Se `invoiceId` existir) Filtrar ou secção **“Fatura do ciclo”** alinhada ao cartão, não só mês civil.

### Qualidade

- [ ] Testes de integração ou unitários no handler de criação parcelada (mock Prisma): mesmo `purchaseGroupId` em N linhas.

---

## Fase C — Polimento

- [ ] **Editar / eliminar compra inteira**: operações que afetem todas as linhas com o mesmo `purchaseGroupId` (API nova ou extensão de `DELETE/PATCH`).
- [ ] Mensagens na UI: deixar explícito que compras do cartão são **transações** partilhadas com Movimentações.
- [ ] Revisar **acessibilidade** do modal (labels, foco, teclado).
- [ ] Atualizar **`Plano-testes.md`** / E2E se existir fluxo crítico no cartão.

---

## Referências rápidas

- Página: `src/app/dashboard/cartao-credito/page.tsx`
- API transações: `src/app/api/transactions/route.ts`
- Modal de referência: `src/components/TransactionModal.tsx`
- Schema: `prisma/schema.prisma` (`Transaction`, `CreditCard`, `CreditCardInvoice`)
