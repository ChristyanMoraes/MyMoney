import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.responsiblePerson.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const { name } = patchSchema.parse(json);
    const trimmed = name.trim();

    const dup = await prisma.responsiblePerson.findFirst({
      where: {
        userId: session.user.id,
        name: { equals: trimmed, mode: "insensitive" },
        NOT: { id },
      },
    });
    if (dup) {
      return NextResponse.json(
        { error: "Já existe um responsável com este nome" },
        { status: 400 },
      );
    }

    const updated = await prisma.responsiblePerson.update({
      where: { id },
      data: { name: trimmed },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar responsável" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.responsiblePerson.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  await prisma.responsiblePerson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
