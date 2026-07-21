'use client';

import { useState } from 'react';
import Link from 'next/link';
import CoverLetters from './CoverLetters';
import AtsAnalysisSection from './AtsAnalysisSection';

type EntryContent = Record<string, string>;

type Entry = {
  id: string;
  order: number;
  content: EntryContent;
};

type Section = {
  id: string;
  type: string;
  title: string;
  order: number;
  entries: Entry[];
};

type Resume = {
  id: string;
  title: string;
  sections: Section[];
};

type CoverLetter = {
  id: string;
  jobTitle: string;
  jobDescription: string;
  content: string;
  createdAt: string;
};

type AtsAnalysisItem = {
  id: string;
  jobTitle: string;
  jobDescription: string;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  createdAt: string;
};

export default function ResumeEditor({
  initialResume,
  initialCoverLetters,
  initialAtsAnalyses,
}: {
  initialResume: Resume;
  initialCoverLetters: CoverLetter[];
  initialAtsAnalyses: AtsAnalysisItem[];
}) {
  const [resume, setResume] = useState(initialResume);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [titleSaving, setTitleSaving] = useState(false);

  async function updateTitle(title: string) {
    setResume((prev) => ({ ...prev, title }));
    setTitleSaving(true);
    await fetch(`/api/resumes/${resume.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setTitleSaving(false);
  }

  function getSection(type: string) {
    return resume.sections.find((s) => s.type === type);
  }

  async function updateEntryContent(entryId: string, content: EntryContent) {
    setResume((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => ({
        ...section,
        entries: section.entries.map((entry) =>
          entry.id === entryId ? { ...entry, content } : entry
        ),
      })),
    }));

    setSavingId(entryId);
    await fetch(`/api/entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setSavingId(null);
  }

  async function addEntry(sectionId: string) {
    const res = await fetch(`/api/sections/${sectionId}/entries`, {
      method: 'POST',
    });
    const newEntry = await res.json();

    setResume((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, entries: [...section.entries, newEntry] } : section
      ),
    }));
  }

  async function removeEntry(sectionId: string, entryId: string) {
    setResume((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              entries: section.entries.filter((e) => e.id !== entryId),
            }
          : section
      ),
    }));

    await fetch(`/api/entries/${entryId}`, { method: 'DELETE' });
  }

  const contactSection = getSection('contact');
  const experienceSection = getSection('experience');
  const educationSection = getSection('education');
  const skillsSection = getSection('skills');

  const contactEntry = contactSection?.entries[0];
  const skillsEntry = skillsSection?.entries[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">
            ← Back to Dashboard
          </Link>
          <input
            value={resume.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="mx-4 flex-1 rounded-md border border-transparent px-2 py-1 text-center text-sm font-medium text-gray-900 hover:border-gray-300 focus:border-blue-500 focus:outline-none"
          />
          <p className="text-sm text-gray-400">
            {savingId || titleSaving ? 'Saving...' : 'All changes saved'}
          </p>
          <button
            onClick={() => window.print()}
            className="ml-4 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            Download PDF
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        {/* LEFT: FORM */}
        <div className="space-y-6">
          {/* Contact */}
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Contact</h2>
            <div className="space-y-3">
              {['fullName', 'email', 'phone', 'location'].map((field) => (
                <input
                  key={field}
                  placeholder={
                    field === 'fullName'
                      ? 'Full Name'
                      : field.charAt(0).toUpperCase() + field.slice(1)
                  }
                  value={contactEntry?.content[field] || ''}
                  onChange={(e) =>
                    contactEntry &&
                    updateEntryContent(contactEntry.id, {
                      ...contactEntry.content,
                      [field]: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              ))}
            </div>
          </section>

          {/* Experience */}
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Experience</h2>
            <div className="space-y-4">
              {experienceSection?.entries.map((entry) => (
                <div key={entry.id} className="space-y-2 rounded-md border border-gray-100 p-3">
                  <input
                    placeholder="Company"
                    value={entry.content.company || ''}
                    onChange={(e) =>
                      updateEntryContent(entry.id, {
                        ...entry.content,
                        company: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Role"
                    value={entry.content.role || ''}
                    onChange={(e) =>
                      updateEntryContent(entry.id, {
                        ...entry.content,
                        role: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Start Date"
                      value={entry.content.startDate || ''}
                      onChange={(e) =>
                        updateEntryContent(entry.id, {
                          ...entry.content,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="End Date"
                      value={entry.content.endDate || ''}
                      onChange={(e) =>
                        updateEntryContent(entry.id, {
                          ...entry.content,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={entry.content.description || ''}
                    onChange={(e) =>
                      updateEntryContent(entry.id, {
                        ...entry.content,
                        description: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => removeEntry(experienceSection.id, entry.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => experienceSection && addEntry(experienceSection.id)}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add Experience
              </button>
            </div>
          </section>

          {/* Education */}
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Education</h2>
            <div className="space-y-4">
              {educationSection?.entries.map((entry) => (
                <div key={entry.id} className="space-y-2 rounded-md border border-gray-100 p-3">
                  <input
                    placeholder="School"
                    value={entry.content.school || ''}
                    onChange={(e) =>
                      updateEntryContent(entry.id, {
                        ...entry.content,
                        school: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Degree"
                    value={entry.content.degree || ''}
                    onChange={(e) =>
                      updateEntryContent(entry.id, {
                        ...entry.content,
                        degree: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Start Date"
                      value={entry.content.startDate || ''}
                      onChange={(e) =>
                        updateEntryContent(entry.id, {
                          ...entry.content,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="End Date"
                      value={entry.content.endDate || ''}
                      onChange={(e) =>
                        updateEntryContent(entry.id, {
                          ...entry.content,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeEntry(educationSection.id, entry.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => educationSection && addEntry(educationSection.id)}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add Education
              </button>
            </div>
          </section>

          {/* Skills */}
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Skills</h2>
            <textarea
              placeholder="e.g. JavaScript, React, Node.js, SQL"
              value={skillsEntry?.content.list || ''}
              onChange={(e) =>
                skillsEntry &&
                updateEntryContent(skillsEntry.id, {
                  ...skillsEntry.content,
                  list: e.target.value,
                })
              }
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">Separate skills with commas</p>
          </section>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div
            className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
            id="resume-preview"
          >
            <h1 className="text-2xl font-bold text-gray-900">
              {contactEntry?.content.fullName || 'Your Name'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {[
                contactEntry?.content.email,
                contactEntry?.content.phone,
                contactEntry?.content.location,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>

            {experienceSection && experienceSection.entries.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Experience
                </h2>
                {experienceSection.entries
                  .filter((entry) => entry.content.role || entry.content.company)
                  .map((entry) => (
                    <div key={entry.id} className="mb-3">
                      <div className="flex items-baseline justify-between">
                        <p className="font-medium text-gray-900">
                          {entry.content.role}
                          {entry.content.company && ` · ${entry.content.company}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.content.startDate} – {entry.content.endDate || 'Present'}
                        </p>
                      </div>
                      {entry.content.description && (
                        <p className="mt-1 text-sm text-gray-700">{entry.content.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {educationSection && educationSection.entries.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Education
                </h2>
                {educationSection.entries
                  .filter((entry) => entry.content.degree || entry.content.school)
                  .map((entry) => (
                    <div key={entry.id} className="mb-3">
                      <div className="flex items-baseline justify-between">
                        <p className="font-medium text-gray-900">
                          {entry.content.degree}
                          {entry.content.school && ` · ${entry.content.school}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.content.startDate} – {entry.content.endDate || 'Present'}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {skillsEntry?.content.list && (
              <div className="mt-6">
                <h2 className="mb-2 border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Skills
                </h2>
                <p className="text-sm text-gray-700">{skillsEntry.content.list}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CoverLetters resumeId={resume.id} initialCoverLetters={initialCoverLetters} />
      <AtsAnalysisSection resumeId={resume.id} initialAnalyses={initialAtsAnalyses} />
    </div>
  );
}
