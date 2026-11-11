'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const userName = user ? `${user.first_name} ${user.last_name}` : 'Guest';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <Sidebar userRole="candidate" />
      <Navbar userName={userName} userEmail={userEmail} />
      <main className="lg:ml-64 mt-16">
        {children}
      </main>
    </div>
  );
}
