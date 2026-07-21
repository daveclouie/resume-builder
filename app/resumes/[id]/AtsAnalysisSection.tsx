'use client';

import { useState } from 'react';

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

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export default function AtsAnalysisSection({
  resumeId,
  initialAnalyses,
}: {
  resumeId: string;
  initialAnalyses: AtsAnalysisItem[];
}) {
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    if (!jobTitle || !jobDescription) {
      setError('Please fill in both the job title and description.');
      return;
    }

    setError('');
    setAnalyzing(true);

    try {
      const res = await fetch(`/api/resumes/${resumeId}/ats-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, jobDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
        setAnalyzing(false);
        return;
      }

      const newAnalysis = await res.json();
      setAnalyses((prev) => [newAnalysis, ...prev]);
      setJobTitle('');
      setJobDescription('');
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setAnalyzing(false);
  }

  async function deleteAnalysis(analysisId: string) {
    const confirmed = window.confirm('Delete this analysis?');
    if (!confirmed) return;

    setAnalyses((prev) => prev.filter((a) => a.id !== analysisId));
    await fetch(`/api/ats-analysis/${analysisId}`, { method: 'DELETE' });
  }

  return (
    <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">ATS Score &amp; Suggestions</h2>
        <p className="mb-4 text-sm text-gray-500">
          Paste a job description to see how well your resume matches and get suggestions to improve
          it.
        </p>

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
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>
      </div>

      {analyses.length > 0 && (
        <div className="mt-6 space-y-4">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{analysis.jobTitle}</h3>
                <button
                  onClick={() => deleteAnalysis(analysis.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>

              <div
                className={`mb-4 inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${scoreColor(analysis.score)}`}
              >
                Match Score: {analysis.score}/100
              </div>

              {analysis.matchedKeywords?.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Matched Keywords
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.matchedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.missingKeywords?.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Missing Keywords
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.suggestions?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Suggestions
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
