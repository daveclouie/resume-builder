import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ai, GEMINI_MODEL } from '@/lib/ai';

// Google periodically retires older model names — if generation starts failing
// with a 404 "no longer available" error, check https://ai.google.dev/gemini-api/docs/models
// for the current model name and update this one constant.
const GEMINI_MODEL = 'gemini-3.5-flash';

type EntryContent = Record<string, string>;

function buildResumeSummary(resume: {
  sections: {
    type: string;
    entries: { content: EntryContent }[];
  }[];
}) {
  const contact = resume.sections.find((s) => s.type === 'contact')?.entries[0]?.content;
  const experience = resume.sections.find((s) => s.type === 'experience');
  const education = resume.sections.find((s) => s.type === 'education');
  const skills = resume.sections.find((s) => s.type === 'skills')?.entries[0]?.content;

  let summary = '';

  if (contact?.fullName) summary += `Name: ${contact.fullName}\n`;

  if (experience?.entries.length) {
    summary += '\nExperience:\n';
    experience.entries.forEach((e) => {
      if (e.content.role || e.content.company) {
        summary += `- ${e.content.role || ''} at ${e.content.company || ''} (${e.content.startDate || ''} – ${e.content.endDate || 'Present'}): ${e.content.description || ''}\n`;
      }
    });
  }

  if (education?.entries.length) {
    summary += '\nEducation:\n';
    education.entries.forEach((e) => {
      if (e.content.degree || e.content.school) {
        summary += `- ${e.content.degree || ''} at ${e.content.school || ''}\n`;
      }
    });
  }

  if (skills?.list) {
    summary += `\nSkills: ${skills.list}\n`;
  }

  return summary;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;

  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const coverLetters = await prisma.coverLetter.findMany({
    where: { resumeId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(coverLetters);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const { jobTitle, jobDescription } = await request.json();

  if (!jobTitle || !jobDescription) {
    return NextResponse.json({ error: 'Job title and description are required' }, { status: 400 });
  }

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: { entries: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!resume || resume.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const resumeSummary = buildResumeSummary(
    resume as unknown as Parameters<typeof buildResumeSummary>[0]
  );

  let content: string;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Write a professional cover letter for this job application. Be specific and connect the candidate's real experience to the role — don't use generic filler phrases.

Job Title: ${jobTitle}

Job Description:
${jobDescription}

Candidate's Resume Summary:
${resumeSummary}

Write only the cover letter text, no preamble or explanation. Keep it to 3-4 paragraphs.`,
    });

    content = response.text ?? '';

    if (!content) {
      throw new Error('Empty response from Gemini');
    }
  } catch (err) {
    console.error('Gemini generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate cover letter. Please try again.' },
      { status: 500 }
    );
  }

  const coverLetter = await prisma.coverLetter.create({
    data: {
      resumeId: id,
      jobTitle,
      jobDescription,
      content,
    },
  });

  return NextResponse.json(coverLetter, { status: 201 });
}
