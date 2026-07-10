'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateResumeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const res = await fetch('/api/resumes', { method: 'POST' });

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const resume = await res.json();
    router.push(`/resumes/${resume.id}`);
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Creating...' : '+ Create New Resume'}
    </button>
  );
}
