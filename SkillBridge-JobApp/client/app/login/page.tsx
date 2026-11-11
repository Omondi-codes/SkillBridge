'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const user = await login({ email, password });
      // Redirect based on role
      if (user.role === 'candidate') {
        window.location.href = '/candidate/dashboard';
      } else if (user.role === 'employer') {
        window.location.href = '/employer/dashboard';
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-3" style={{ letterSpacing: '-0.02em' }}>
            SKILLBRIDGE
          </h1>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="meta-line"></div>
            <p className="meta-text">CONNECT TALENT WITH OPPORTUNITY</p>
            <div className="meta-line"></div>
          </div>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="mb-8">
            <h2 className="text-3xl font-black mb-2">SIGN IN</h2>
            <div className="flex items-center gap-3">
              <div className="meta-line"></div>
              <span className="meta-text">WELCOME BACK</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-mono">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black focus:ring-2"
                />
                <span className="ml-2 text-sm font-mono text-black/70">REMEMBER ME</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-mono font-semibold text-red-600 hover:text-red-700 transition-colors"
              >
                FORGOT PASSWORD?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-mono">OR</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-mono text-black/70 mb-4">
                DON&apos;T HAVE AN ACCOUNT?
              </p>
              <Link href="/register">
                <button type="button" className="btn-secondary w-full">
                  CREATE ACCOUNT
                </button>
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-mono text-black/50">
            © 2025 SKILLBRIDGE. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  );
}
