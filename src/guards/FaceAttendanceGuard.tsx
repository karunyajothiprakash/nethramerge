import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const allowedEmails = new Set([
  'vemulanavyalahar009@gmail.com',
  'kim.swathi.07@gmail.com',
]);

type Props = {
  children: React.ReactNode;
};

export default function FaceAttendanceGuard({ children }: Props) {
  const { profile, loading } = useAuth();

  if (loading) {
    // Optionally render a loading state
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  }

  const email = profile?.email?.toLowerCase() ?? '';
  if (!allowedEmails.has(email)) {
    // Redirect unauthorized users to dashboard (or /unauthorized if exists)
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
