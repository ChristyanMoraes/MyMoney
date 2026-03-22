import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DEFAULT_CATEGORIES = [
  { name: "Alimentação", type: "ESSENTIAL" as const },
  { name: "Transporte", type: "ESSENTIAL" as const },
  { name: "Moradia", type: "ESSENTIAL" as const },
  { name: "Saúde", type: "ESSENTIAL" as const },
  { name: "Educação", type: "ESSENTIAL" as const },
  { name: "Lazer", type: "NON_ESSENTIAL" as const },
  { name: "Assinaturas", type: "SUBSCRIPTION" as const },
  { name: "Investimentos", type: "INVESTMENT" as const },
  { name: "Dívidas", type: "DEBT" as const },
  { name: "Salário", type: "ESSENTIAL" as const },
  { name: "Freelance", type: "NON_ESSENTIAL" as const },
  { name: "Outros", type: "OTHER" as const },
];

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["ESSENTIAL", "NON_ESSENTIAL", "SUBSCRIPTION", "INVESTMENT", "DEBT", "OTHER"]),
  color: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  if (categories.length === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES,
    });
    const created = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(created);
  }

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const data = categorySchema.parse(json);

    const existing = await prisma.category.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 400 },
      );
    }

    const created = await prisma.category.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        color: data.color || null,
        description: data.description || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 400 },
    );
  }
}
