import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string(),
  categoryId: z.string().cuid().optional().nullable(),
  creditCardId: z.string().cuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  expenseType: z.enum(["FIXED", "VARIABLE"]).optional().nullable(),
  isPaid: z.boolean().optional(),
  installments: z.number().int().min(1).max(60).optional().nullable(),
  installmentNumber: z.number().int().min(1).optional().nullable(),
  purchasedBy: z.string().max(100).optional().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const data = transactionSchema.parse(json);

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        categoryId: data.categoryId || null,
        creditCardId: data.creditCardId ?? existing.creditCardId,
        notes: data.notes || null,
        isRecurring: data.isRecurring ?? existing.isRecurring,
        expenseType: data.expenseType ?? existing.expenseType,
        isPaid: data.isPaid ?? existing.isPaid,
        paidAt: data.isPaid === true ? new Date() : data.isPaid === false ? null : existing.paidAt,
        installments: data.installments ?? existing.installments,
        installmentNumber: data.installmentNumber ?? existing.installmentNumber,
        purchasedBy: data.purchasedBy !== undefined ? data.purchasedBy : existing.purchasedBy,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar transação" },
      { status: 400 },
    );
  }
}

const patchSchema = z.object({
  isPaid: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const data = patchSchema.parse(json);

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        isPaid: data.isPaid,
        paidAt: data.isPaid ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar status" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
