import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string(),
  categoryId: z.string().cuid().optional(),
  accountId: z.string().cuid().optional(),
  creditCardId: z.string().cuid().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  expenseType: z.enum(["FIXED", "VARIABLE"]).optional(),
  isPaid: z.boolean().optional(),
  installments: z.number().int().min(1).max(60).optional().nullable(),
  purchasedBy: z.string().max(100).optional().nullable(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const take = searchParams.get("take") ? parseInt(searchParams.get("take")!, 10) : 50;
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : null;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : null;
  const categoryId = searchParams.get("categoryId") || null;
  const creditCardId = searchParams.get("creditCardId") || null;

  const where: { userId: string; type?: "EXPENSE"; date?: { gte: Date; lt: Date }; categoryId?: string; creditCardId?: string } = { userId: session.user.id };

  if (month != null && year != null) {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const startOfNextMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    where.date = { gte: startOfMonth, lt: startOfNextMonth };
  }

  if (categoryId) {
    where.categoryId = categoryId;
    where.type = "EXPENSE";
  }

  if (creditCardId) {
    where.creditCardId = creditCardId;
    where.type = "EXPENSE";
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    take: Math.min(take, 200),
    include: {
      category: true,
    },
  });

  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const data = transactionSchema.parse(json);

    const baseDate = new Date(data.date);
    const isPaid = data.isPaid ?? (data.type === "INCOME");
    const isRecurring = data.isRecurring ?? false;
    const isFixed = data.expenseType === "FIXED";
    const installments = data.installments && data.installments > 1 ? data.installments : 1;
    const isParceled = data.creditCardId && installments > 1;
    const parcelAmount = isParceled ? Number((data.amount / installments).toFixed(2)) : data.amount;
    const shouldCreateNextMonth =
      data.type === "EXPENSE" && (isRecurring || isFixed) && !isParceled;

    const baseTxData = {
      type: data.type,
      description: data.description,
      amount: isParceled ? parcelAmount : data.amount,
      date: baseDate,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      userId: session.user.id,
      categoryId: data.categoryId,
      accountId: data.accountId,
      creditCardId: data.creditCardId,
      notes: data.notes,
      isRecurring: isParceled ? false : isRecurring,
      expenseType: data.expenseType ?? null,
      isPaid,
      paidAt: isPaid === true ? new Date() : null,
      installments: isParceled ? installments : null,
      installmentNumber: isParceled ? 1 : null,
      purchasedBy: data.purchasedBy || null,
    };

    const created = await prisma.transaction.create({
      data: { ...baseTxData },
    });

    if (isParceled && installments > 1) {
      for (let i = 2; i <= installments; i++) {
        const parcelDate = new Date(baseDate);
        parcelDate.setUTCMonth(parcelDate.getUTCMonth() + i - 1);
        await prisma.transaction.create({
          data: {
            ...baseTxData,
            amount: parcelAmount,
            date: parcelDate,
            dueDate: parcelDate,
            isPaid: false,
            paidAt: null,
            installmentNumber: i,
          },
        });
      }
    } else if (shouldCreateNextMonth) {
      const nextMonthDate = new Date(baseDate);
      nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);

      await prisma.transaction.create({
        data: {
          type: "EXPENSE",
          description: data.description,
          amount: data.amount,
          date: nextMonthDate,
          dueDate: nextMonthDate,
          userId: session.user.id,
          categoryId: data.categoryId,
          accountId: data.accountId,
          creditCardId: data.creditCardId,
          notes: data.notes,
          isRecurring,
          expenseType: data.expenseType ?? null,
          isPaid: false,
          paidAt: null,
        },
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao salvar transação" },
      { status: 400 },
    );
  }
}

