'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CandidateForm } from '@/components/CandidateForm';
import { Loader2 } from 'lucide-react';

function EditContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  return <CandidateForm mode="edit" id={id} />;
}

export default function EditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="text-sm font-medium text-slate-500">Loading Candidate...</span>
        </div>
      }
    >
      <EditContent />
    </Suspense>
  );
}
