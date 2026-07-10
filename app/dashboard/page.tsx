import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import CreateResumeButton from './CreateResumeButton';

export default async function DashboardPage() {
  const session = await auth();

  const resumes = await prisma.resume.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your Resumes</h1>
            <p className="text-sm text-gray-600">Signed in as {session?.user?.email}</p>
          </div>

          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>

        <CreateResumeButton />

        {resumes.length === 0 ? (
          <p className="mt-8 text-sm text-gray-500">
            You don&apos;t have any resumes yet. Create your first one above.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {resumes.map((resume) => (
              <li key={resume.id}>
                <Link
                  href={`/resumes/${resume.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md"
                >
                  <p className="font-medium text-gray-900">{resume.title}</p>
                  <p className="text-xs text-gray-500">
                    Last updated {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
