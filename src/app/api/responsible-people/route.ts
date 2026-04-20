import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const postSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const list = await prisma.responsiblePerson.findMany({
    where: { userId: session.user.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { name } = postSchema.parse(json);
    const trimmed = name.trim();

    const dup = await prisma.responsiblePerson.findFirst({
      where: {
        userId: session.user.id,
        name: { equals: trimmed, mode: "insensitive" },
      },
    });
    if (dup) {
      return NextResponse.json(
        { error: "Já existe um responsável com este nome" },
        { status: 400 },
      );
    }

    const maxOrder = await prisma.responsiblePerson.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const created = await prisma.responsiblePerson.create({
      data: {
        userId: session.user.id,
        name: trimmed,
        sortOrder,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar responsável" },
      { status: 400 },
    );
  }
}
