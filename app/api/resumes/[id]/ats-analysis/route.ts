import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
        summary += `- ${e.content.role || ''} at ${e.content.company || ''}: ${e.content.description || ''}\n`;
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

  const analyses = await prisma.atsAnalysis.findMany({
    where: { resumeId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(analyses);
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

  let parsed: {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `You are an ATS (Applicant Tracking System) resume analyzer. Compare this resume against the job description and respond with ONLY valid JSON, no other text, in exactly this shape:

{
  "score": <number 0-100 representing how well the resume matches the job>,
  "matchedKeywords": [<important keywords/skills from the job description that ARE present in the resume>],
  "missingKeywords": [<important keywords/skills from the job description that are NOT present in the resume>],
  "suggestions": [<3-5 specific, actionable suggestions to improve the resume for this job>]
}

Job Title: ${jobTitle}

Job Description:
${jobDescription}

Resume Summary:
${resumeSummary}`,
    });

    const text = (response.text ?? '').trim();
    const jsonText = text.replace(/^```json\s*|\s*```$/g, '');
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error('ATS analysis generation error:', err);
    return NextResponse.json(
      { error: 'Failed to analyze resume. Please try again.' },
      { status: 500 }
    );
  }

  const analysis = await prisma.atsAnalysis.create({
    data: {
      resumeId: id,
      jobTitle,
      jobDescription,
      score: parsed.score,
      matchedKeywords: parsed.matchedKeywords,
      missingKeywords: parsed.missingKeywords,
      suggestions: parsed.suggestions,
    },
  });

  return NextResponse.json(analysis, { status: 201 });
}
