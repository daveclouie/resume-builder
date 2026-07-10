import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_SECTIONS = [
  { type: 'contact', title: 'Contact', order: 0 },
  { type: 'experience', title: 'Experience', order: 1 },
  { type: 'education', title: 'Education', order: 2 },
  { type: 'skills', title: 'Skills', order: 3 },
];

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const resume = await prisma.resume.create({
    data: {
      userId: session.user.id,
      title: 'Untitled Resume',
      sections: {
        create: DEFAULT_SECTIONS.map((section) => ({
          type: section.type,
          title: section.title,
          order: section.order,
          entries: {
            create: [{ order: 0, content: {} }],
          },
        })),
      },
    },
    include: {
      sections: {
        include: { entries: true },
      },
    },
  });

  return NextResponse.json(resume, { status: 201 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json(resumes);
}
