'use client';

import { ArrowLeft } from 'lucide-react';
import dynamicFn from 'next/dynamic';

export const dynamic = 'force-dynamic';

const DynamicStackSignIn = dynamicFn(
  () => import('@/components/StackAuthClient').then((mod) => ({ default: mod.StackSignIn })),
  { ssr: false }
);

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-indigo-600">
            <ArrowLeft />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <DynamicStackSignIn />
      </div>
    </div>
  );
}