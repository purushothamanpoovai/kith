import type { User, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type NewUserInput = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  slug: string;
  role?: UserRole;
  locale?: string;
  primaryLanguage?: string;
};

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserBySlug(slug: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { slug } });
}

export async function createUser(input: NewUserInput): Promise<User> {
  return prisma.user.create({
    data: {
      id: input.id,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      name: input.name,
      slug: input.slug,
      role: input.role ?? "user",
      locale: input.locale ?? "en",
      primaryLanguage: input.primaryLanguage ?? "en",
      profile: {
        create: {
          visibility: "public",
        },
      },
    },
  });
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

export async function updateUserPreferences(
  userId: string,
  data: {
    locale?: string;
    primaryLanguage?: string;
    contentFocusMode?: "all" | "focused";
    focusReligionScopeId?: string | null;
    focusLanguageScopeId?: string | null;
    focusRegionScopeId?: string | null;
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}
