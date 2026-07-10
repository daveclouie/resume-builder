import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ResumeEditor from './ResumeEditor';

export default async function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: { entries: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!resume || resume.userId !== session?.user?.id) {
    notFound();
  }

  return <ResumeEditor initialResume={resume} />;
}
