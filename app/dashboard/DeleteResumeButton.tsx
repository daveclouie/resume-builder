'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteResumeButton({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm('Delete this resume? This cannot be undone.');
    if (!confirmed) return;

    setDeleting(true);
    await fetch(`/api/resumes/${resumeId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:underline disabled:opacity-50"
    >
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
