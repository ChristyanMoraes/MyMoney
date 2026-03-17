import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().datetime(),
  categoryId: z.string().cuid().optional(),
  accountId: z.string().cuid().optional(),
  creditCardId: z.string().cuid().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 20,
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

    const created = await prisma.transaction.create({
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        userId: session.user.id,
        categoryId: data.categoryId,
        accountId: data.accountId,
        creditCardId: data.creditCardId,
        notes: data.notes,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao salvar transação" },
      { status: 400 },
    );
  }
}

