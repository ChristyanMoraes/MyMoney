This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Testes

Comandos (ver também `Cursor.md` e `Plano-testes.md`):

| Comando | Descrição |
|--------|-----------|
| `npm run test` | Vitest — testes em `src/**/*.test.ts(x)` |
| `npm run test:watch` | Vitest em modo observação |
| `npm run test:e2e` | Playwright (instalar browser: `npm run test:e2e:install`) |
| `npm run test:e2e:ui` | Playwright com interface |
| `npm run test:e2e:install` | Instala o Chromium usado pelo Playwright |

Por defeito o E2E usa **`http://localhost:3000`** (alinhado com `NEXTAUTH_URL`). Com `npm run dev` já a correr, o Playwright reutiliza o servidor (fora de CI). Outra porta: `PORT=3001 npm run test:e2e` ou `PLAYWRIGHT_BASE_URL=...`. Em CI, use `CI=1` para subir com `next build` + `next start`.

### Deploy (ex.: Digital Ocean)

O client Prisma é gerado em `src/generated/prisma` (não está no Git). O script `npm run build` executa **`prisma generate`** antes do `next build`. Garanta que a variável **`DATABASE_URL`** está disponível na fase de build da App Platform (ou um valor placeholder só para o generate, se a plataforma não injetar a URL real nessa fase).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
