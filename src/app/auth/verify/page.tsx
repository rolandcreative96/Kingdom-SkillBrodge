'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="max-w-md w-full space-y-8 text-center">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>

      <p className="text-gray-600">
        We sent a confirmation link to{' '}
        <strong className="text-gray-900">{email || 'your email'}</strong>
      </p>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm text-left">
        <p className="font-medium mb-1">Didn&apos;t receive the email?</p>
        <ul className="list-disc pl-4 space-y-1 text-blue-700">
          <li>Check your spam / junk folder</li>
          <li>Make sure you entered the correct email</li>
          <li>Wait a few minutes — it can take up to 5 minutes</li>
        </ul>
      </div>

      <Link
        href="/auth/login"
        className="inline-block w-full py-3 px-4 rounded-lg text-white bg-primary-600 hover:bg-primary-700"
      >
        Go to Login
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
