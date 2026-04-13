import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { personalities } from '@/lib/data';

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
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to update leaderboard' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const leaderboard = await prisma.leaderboard.findMany({
      orderBy: { score: 'desc' },
      take: 10,
    });
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
