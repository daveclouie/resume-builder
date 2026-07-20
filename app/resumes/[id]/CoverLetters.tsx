'use client';

import { useState } from 'react';

type CoverLetter = {
  id: string;
  jobTitle: string;
  jobDescription: string;
  content: string;
  createdAt: string;
};

export default function CoverLetters({
  resumeId,
  initialCoverLetters,
}: {
  resumeId: string;
  initialCoverLetters: CoverLetter[];
}) {
  const [coverLetters, setCoverLetters] = useState(initialCoverLetters);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleGenerate() {
    if (!jobTitle || !jobDescription) {
      setError('Please fill in both the job title and description.');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const res = await fetch(`/api/resumes/${resumeId}/cover-letters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, jobDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
        setGenerating(false);
        return;
      }

      const newLetter = await res.json();
      setCoverLetters((prev) => [newLetter, ...prev]);
      setJobTitle('');
      setJobDescription('');
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setGenerating(false);
  }

  async function updateContent(id: string, content: string) {
    setCoverLetters((prev) => prev.map((cl) => (cl.id === id ? { ...cl, content } : cl)));
    setSavingId(id);
    await fetch(`/api/cover-letters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setSavingId(null);
  }

  async function deleteCoverLetter(id: string) {
    const confirmed = window.confirm('Delete this cover letter?');
    if (!confirmed) return;

    setCoverLetters((prev) => prev.filter((cl) => cl.id !== id));
    await fetch(`/api/cover-letters/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Cover Letter Generator</h2>

        <div className="space-y-3">
          <input
            placeholder="Job Title (e.g. Frontend Developer)"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <textarea
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Cover Letter'}
          </button>
        </div>
      </div>

      {coverLetters.length > 0 && (
        <div className="mt-6 space-y-4">
          {coverLetters.map((cl) => (
            <div key={cl.id} className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{cl.jobTitle}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {savingId === cl.id ? 'Saving...' : ''}
                  </span>
                  <button
                    onClick={() => deleteCoverLetter(cl.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <textarea
                value={cl.content}
                onChange={(e) => updateContent(cl.id, e.target.value)}
                rows={10}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
