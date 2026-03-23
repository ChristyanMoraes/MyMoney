import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const creditCardSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  last4: z.string().length(4).optional().nullable(),
  closingDay: z.number().int().min(1).max(28),
  dueDay: z.number().int().min(1).max(31),
  limit: z.number().positive().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cards = await prisma.creditCard.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const data = creditCardSchema.parse(json);

    const created = await prisma.creditCard.create({
      data: {
        name: data.name.trim(),
        last4: data.last4?.trim() || null,
        closingDay: data.closingDay,
        dueDay: data.dueDay,
        limit: data.limit ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao cadastrar cartão" },
      { status: 400 },
    );
  }
}
