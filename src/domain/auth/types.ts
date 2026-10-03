import type { User } from "@/generated/prisma/client";

export type AuthUser = Pick<
  User,
  "id" | "email" | "name" | "slug" | "role" | "locale" | "primaryLanguage"
>;
