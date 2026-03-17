"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#131720]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10b77f] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-[#131720] dark:text-white">
      {/* Nav */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-[#131720]/80">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b77f]/20">
              <MoneyIcon className="h-6 w-6 text-[#10b77f]" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-[#10b77f]">
              My Money
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Funcionalidades
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Como Funciona
            </a>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#10b77f]/90"
            >
              Começar agora!
            </Link>
          </div>
        </div>
      </nav>

      <main className="px-4 pt-20">
        {/* Hero */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden py-24">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-10 top-20 hidden h-72 w-72 rounded-full bg-[#10b77f]/30 blur-3xl md:block" />
            <div className="absolute right-10 top-20 hidden h-72 w-72 rounded-full bg-[#10b77f]/30 blur-3xl md:block" />
            <div className="absolute top-3/4 h-96 w-full rounded-full bg-[#10b77f]/20 blur-3xl" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#10b77f]/10 px-4 py-2 dark:bg-[#10b77f]/20">
              <MoneyIcon className="h-4 w-4 text-[#10b77f]" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Controle financeiro simplificado
              </span>
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white md:text-6xl lg:text-7xl">
              Cuide do seu dinheiro,{" "}
              <span className="block text-[#10b77f]">
                construa seu futuro
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
              A educação financeira é o primeiro passo para uma vida mais
              tranquila. Cadastre suas despesas e receitas, acompanhe seus gastos
              e tome decisões mais conscientes sobre o seu dinheiro.
            </p>
            <div className="mb-10 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg
                  className="h-4 w-4 text-[#10b77f]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Controle de despesas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg
                  className="h-4 w-4 text-[#10b77f]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Organize suas receitas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg
                  className="h-4 w-4 text-[#10b77f]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Visão clara do seu orçamento</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10b77f] px-10 py-4 text-lg font-semibold text-white transition hover:bg-[#10b77f]/90"
              >
                Começar Agora
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#10b77f]/30 bg-white/50 px-10 py-4 text-lg font-semibold text-zinc-900 backdrop-blur-sm transition hover:border-[#10b77f] hover:bg-[#10b77f]/10 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white dark:hover:border-[#10b77f] dark:hover:bg-[#10b77f]/20"
              >
                Já tenho conta
              </Link>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#10b77f] md:text-4xl">
                  Simples
                </div>
                <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Interface intuitiva
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#10b77f] md:text-4xl">
                  Seguro
                </div>
                <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Seus dados protegidos
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#10b77f] md:text-4xl">
                  Grátis
                </div>
                <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Para sempre
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t border-zinc-200 py-24 dark:border-zinc-800"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#10b77f]">
                Funcionalidades
              </span>
              <h2 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-white md:text-5xl">
                Tudo que você precisa para{" "}
                <span className="text-[#10b77f]">cuidar do seu dinheiro</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
                A educação financeira começa com o conhecimento. Nossa
                plataforma foi desenvolvida para ajudá-lo a entender para onde
                vai seu dinheiro e tomar decisões mais inteligentes.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
                  title: "Controle de Despesas",
                  desc: "Registre todas as suas despesas e visualize para onde vai seu dinheiro.",
                },
                {
                  icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  title: "Acompanhe Receitas",
                  desc: "Cadastre suas fontes de renda e acompanhe o total de entradas mensais.",
                },
                {
                  icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m-2 2V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                  title: "Visão do Orçamento",
                  desc: "Veja o resumo do mês: total de receitas, despesas e saldo.",
                },
                {
                  icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                  title: "Histórico Completo",
                  desc: "Acesse o histórico de todas as suas transações organizadas por data.",
                },
                {
                  icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                  title: "Dados Seguros",
                  desc: "Suas informações financeiras protegidas com autenticação segura.",
                },
                {
                  icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
                  title: "Modo Escuro",
                  desc: "Interface confortável para os olhos em qualquer horário do dia.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-zinc-200 bg-white p-8 transition hover:border-[#10b77f]/30 hover:shadow-lg dark:border-zinc-800 dark:bg-[#1d2330] dark:hover:border-[#10b77f]/30"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#10b77f]/10 dark:bg-[#10b77f]/20">
                    <svg
                      className="h-7 w-7 text-[#10b77f]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={f.icon}
                      />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-t border-zinc-200 py-24 dark:border-zinc-800"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-[#10b77f]">
                Como Funciona
              </span>
              <h2 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-white md:text-5xl">
                Simples, rápido e{" "}
                <span className="text-[#10b77f]">eficiente</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
                Em apenas 4 passos você começa a ter controle total sobre suas
                finanças e a construir uma relação mais saudável com o dinheiro.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Crie sua conta",
                  desc: "Cadastre-se gratuitamente em poucos segundos.",
                },
                {
                  step: "02",
                  title: "Registre transações",
                  desc: "Adicione suas despesas e receitas do dia a dia.",
                },
                {
                  step: "03",
                  title: "Acompanhe os totais",
                  desc: "Visualize o resumo do mês em tempo real.",
                },
                {
                  step: "04",
                  title: "Tome decisões",
                  desc: "Use os dados para planejar e economizar.",
                },
              ].map((s) => (
                <div key={s.step} className="relative text-center">
                  <div className="mb-6 inline-flex items-center justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#1d2330]">
                      <span className="text-2xl font-bold text-[#10b77f]">
                        {s.step}
                      </span>
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-t border-zinc-200 py-24 dark:border-zinc-800">
          <div className="absolute inset-0">
            <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[#10b77f]/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-[#10b77f]/10 blur-3xl" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#10b77f]/10 px-4 py-2 dark:bg-[#10b77f]/20">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Comece agora mesmo
              </span>
            </div>
            <h2 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-white md:text-5xl lg:text-6xl">
              Pronto para{" "}
              <span className="block text-[#10b77f]">
                cuidar melhor do seu dinheiro?
              </span>
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
              A educação financeira é a base para realizar seus sonhos. Junte-se a
              quem já está no controle das próprias finanças.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10b77f] px-10 py-4 text-lg font-semibold text-white transition hover:bg-[#10b77f]/90"
              >
                Criar Conta
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#10b77f]/30 bg-white/50 px-10 py-4 text-lg font-semibold text-zinc-900 backdrop-blur-sm transition hover:border-[#10b77f] dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white dark:hover:border-[#10b77f]"
              >
                Entrar com minha conta
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b77f]/20">
                  <MoneyIcon className="h-6 w-6 text-[#10b77f]" />
                </div>
                <span className="text-xl font-bold text-zinc-900 dark:text-white">
                  My Money
                </span>
              </div>
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 md:text-left">
                A plataforma que te ajuda a cuidar do seu dinheiro e construir
                uma vida financeira mais saudável.
              </p>
            </div>
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800 md:flex-row">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                © {new Date().getFullYear()} My Money. Todos os direitos
                reservados.
              </p>
              <div className="flex gap-6">
                <Link
                  href="#features"
                  className="text-sm text-zinc-500 transition hover:text-[#10b77f] dark:text-zinc-400"
                >
                  Funcionalidades
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-sm text-zinc-500 transition hover:text-[#10b77f] dark:text-zinc-400"
                >
                  Como funciona
                </Link>
                <Link
                  href="/register"
                  className="text-sm text-zinc-500 transition hover:text-[#10b77f] dark:text-zinc-400"
                >
                  Começar agora
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
