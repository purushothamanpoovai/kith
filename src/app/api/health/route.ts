import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      db: "ok",
      time: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        status: "error",
        db: "error",
        time: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
