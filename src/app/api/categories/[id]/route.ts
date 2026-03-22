import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["ESSENTIAL", "NON_ESSENTIAL", "SUBSCRIPTION", "INVESTMENT", "DEBT", "OTHER"]),
  color: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
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

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const data = categorySchema.parse(json);

    const duplicate = await prisma.category.findFirst({
      where: {
        name: { equals: data.name.trim(), mode: "insensitive" },
        id: { not: id },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 400 },
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: data.name.trim(),
        type: data.type,
        color: data.color || null,
        description: data.description || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
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

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const transactionsCount = await prisma.transaction.count({
    where: { categoryId: id },
  });
  if (transactionsCount > 0) {
    return NextResponse.json(
      { error: "Não é possível excluir. Esta categoria está em uso por transações." },
      { status: 400 },
    );
  }

  const goalsCount = await prisma.spendingGoal.count({
    where: { categoryId: id },
  });
  if (goalsCount > 0) {
    return NextResponse.json(
      { error: "Não é possível excluir. Esta categoria está em uso por metas de gastos." },
      { status: 400 },
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
