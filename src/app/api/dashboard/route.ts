import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month")
    ? parseInt(searchParams.get("month")!, 10)
    : new Date().getMonth() + 1;
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!, 10)
    : new Date().getFullYear();

  // Usar UTC para evitar problemas de fuso horário (transações podem ter sido salvas em horários diferentes)
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const startOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth - 1, 1, 0, 0, 0, 0));
  const startOfPrevNextMonth = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0, 0));

  const dateFilter = { gte: startOfMonth, lt: startOfNextMonth };
  const prevDateFilter = { gte: startOfPrevMonth, lt: startOfPrevNextMonth };

  const [
    transactions,
    prevTransactions,
    allForBalance,
    incomeAgg,
    expenseAgg,
    prevIncomeAgg,
    prevExpenseAgg,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: dateFilter,
      },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: prevDateFilter,
      },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        type: "INCOME",
        date: dateFilter,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        type: "EXPENSE",
        date: dateFilter,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        type: "INCOME",
        date: prevDateFilter,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        type: "EXPENSE",
        date: prevDateFilter,
      },
      _sum: { amount: true },
    }),
  ]);

  const income = Number(incomeAgg._sum.amount ?? 0);
  const expenses = Number(expenseAgg._sum.amount ?? 0);
  const prevIncome = Number(prevIncomeAgg._sum.amount ?? 0);
  const prevExpenses = Number(prevExpenseAgg._sum.amount ?? 0);

  let balance = 0;
  for (const t of allForBalance) {
    if (t.type === "INCOME") balance += Number(t.amount);
    else balance -= Number(t.amount);
  }

  const result = income - expenses;
  const prevResult = prevIncome - prevExpenses;
  const incomeChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
  const expenseChange = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

  const byCategory = transactions
    .filter((t) => t.type === "EXPENSE" && t.category)
    .reduce(
      (acc, t) => {
        const id = t.category!.id;
        const name = t.category!.name;
        if (!acc[id]) acc[id] = { name, total: 0 };
        acc[id].total += Number(t.amount);
        return acc;
      },
      {} as Record<string, { name: string; total: number }>
    );

  const categoryRanking = Object.entries(byCategory)
    .map(([id, { name, total }]) => ({ id, name, total }))
    .sort((a, b) => b.total - a.total);

  const dailyData: Record<string, { income: number; expense: number }> = {};
  for (let d = 1; d <= endOfMonth.getDate(); d++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dailyData[key] = { income: 0, expense: 0 };
  }
  for (const t of transactions) {
    const key = t.date.toISOString().slice(0, 10);
    if (dailyData[key]) {
      if (t.type === "INCOME") dailyData[key].income += Number(t.amount);
      else dailyData[key].expense += Number(t.amount);
    }
  }

  const fixedExpenses = transactions
    .filter((t) => t.type === "EXPENSE" && t.expenseType === "FIXED")
    .reduce((s, t) => s + Number(t.amount), 0);
  const incomeCommitted = income > 0 ? (expenses / income) * 100 : 0;
  const savedPercent = income > 0 ? ((income - expenses) / income) * 100 : 0;

  const goals = await prisma.financialGoal.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    summary: {
      balance,
      income,
      expenses,
      result,
      incomeCommitted: Math.round(incomeCommitted * 10) / 10,
      savedPercent: Math.round(savedPercent * 10) / 10,
      incomeChange: Math.round(incomeChange * 10) / 10,
      expenseChange: Math.round(expenseChange * 10) / 10,
      prevIncome,
      prevExpenses,
      prevResult,
    },
    categoryRanking,
    dailyData: Object.entries(dailyData).map(([date, d]) => ({ date, ...d })),
    transactions: transactions.slice(0, 10),
    goals,
    fixedExpenses,
  });
}
