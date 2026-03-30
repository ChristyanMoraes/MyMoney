import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type CredentialsInput = {
  email?: string | unknown;
  password?: string | unknown;
} | null | undefined;

export async function authorizeCredentials(credentials: CredentialsInput) {
  if (!credentials?.email || !credentials?.password) return null;

  const email = String(credentials.email).trim();
  const password = String(credentials.password);
  if (!email || !password) return null;

  const user = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: Prisma.QueryMode.insensitive },
    },
  });
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}
