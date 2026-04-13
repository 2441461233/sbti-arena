import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { personalities } from '@/lib/data';
// Helper to safely extract error info without tripping strict linters
function normalizeError(e: unknown): { message: string; code?: string } {
  const anyE = e as any;
  const message =
    anyE?.message ? String(anyE.message) : 'Unknown error';
  const code =
    typeof anyE?.code === 'string' ? anyE.code : undefined;
  return { message, code };
}

export async function POST(req: Request) {
  try {
    const { personalityId } = await req.json();

    const personality = personalities.find(p => p.id === personalityId);
    if (!personality) {
      return NextResponse.json({ error: 'Invalid personality' }, { status: 400 });
    }

    const updated = await prisma.leaderboard.upsert({
      where: { personalityId },
      update: { score: { increment: 1 } },
      create: {
        personalityId,
        name: personality.name,
        score: 1,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const { message, code } = normalizeError(error);
    console.error('Database Error (POST /api/leaderboard):', message, code);
    return NextResponse.json({ error: message, code }, { status: 500 });
  }
}

export async function GET() {
  try {
    const leaderboard = await prisma.leaderboard.findMany({
      orderBy: { score: 'desc' },
      take: 10,
    });
    return NextResponse.json(leaderboard);
  } catch (error: unknown) {
    const { message, code } = normalizeError(error);
    console.error('Database Error (GET /api/leaderboard):', message, code);
    return NextResponse.json({ error: message, code }, { status: 500 });
  }
}
