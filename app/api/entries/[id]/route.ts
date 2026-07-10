import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function verifyEntryOwnership(entryId: string, userId: string) {
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: { section: { include: { resume: true } } },
  });
  if (!entry || entry.section.resume.userId !== userId) return null;
  return entry;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const owned = await verifyEntryOwnership(id, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();

  const entry = await prisma.entry.update({
    where: { id },
    data: { content: body.content },
  });

  return NextResponse.json(entry);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const owned = await verifyEntryOwnership(id, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.entry.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
