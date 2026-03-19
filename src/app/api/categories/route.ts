import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
