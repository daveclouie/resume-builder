import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;

  const section = await prisma.section.findUnique({
    where: { id },
    include: { resume: true, entries: true },
  });

  if (!section || section.resume.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const maxOrder = section.entries.reduce((max, e) => Math.max(max, e.order), -1);

  const entry = await prisma.entry.create({
    data: {
      sectionId: id,
      order: maxOrder + 1,
      content: {},
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
