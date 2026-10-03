import { prisma } from "@/lib/db";

export async function createSession(input: {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  ip?: string | null;
  userAgent?: string | null;
}) {
  return prisma.session.create({
    data: {
      tokenHash: input.tokenHash,
      userId: input.userId,
      expiresAt: input.expiresAt,
      ip: input.ip,
      userAgent: input.userAgent,
    },
  });
}

export async function findSessionWithUser(tokenHash: string) {
  return prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function deleteExpiredSessions() {
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
