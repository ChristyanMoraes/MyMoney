/** Intervalos UTC usados por GET /api/dashboard — extraído para testes de regressão. */
export function getDashboardMonthUtcRange(month: number, year: number) {
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const startOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth - 1, 1, 0, 0, 0, 0));
  const startOfPrevNextMonth = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0, 0));

  return {
    dateFilter: { gte: startOfMonth, lt: startOfNextMonth } as const,
    prevDateFilter: { gte: startOfPrevMonth, lt: startOfPrevNextMonth } as const,
    endOfMonth,
  };
}
