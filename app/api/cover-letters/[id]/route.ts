import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function verifyOwnership(coverLetterId: string, userId: string) {
  const coverLetter = await prisma.coverLetter.findUnique({
    where: { id: coverLetterId },
    include: { resume: true },
  });
  if (!coverLetter || coverLetter.resume.userId !== userId) return null;
  return coverLetter;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const owned = await verifyOwnership(id, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { content } = await request.json();

  const coverLetter = await prisma.coverLetter.update({
    where: { id },
    data: { content },
  });

  return NextResponse.json(coverLetter);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const owned = await verifyOwnership(id, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.coverLetter.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
