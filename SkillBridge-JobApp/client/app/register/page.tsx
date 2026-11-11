'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, MapPin, Building, Globe, Users, UserCircle, Briefcase } from 'lucide-react';

type UserRole = 'candidate' | 'employer';

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('candidate');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    company: '',
    company_website: '',
    company_size: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { email, password, confirmPassword, first_name, last_name, company } = formData;

    if (!email || !password || !confirmPassword || !first_name || !last_name) {
      setError('Please fill in all required fields');
      return false;
    }

    if (role === 'employer' && !company) {
      setError('Company name is required for employers');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        role,
        first_name: formData.first_name,
        last_name: formData.last_name,
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.location && { location: formData.location }),
        ...(role === 'employer' && {
          company: formData.company,
          ...(formData.company_website && { company_website: formData.company_website }),
          ...(formData.company_size && { company_size: formData.company_size }),
        }),
      };

      const user = await register(registerData);
      // Redirect based on role
      if (user.role === 'candidate') {
        window.location.href = '/candidate/dashboard';
      } else if (user.role === 'employer') {
        window.location.href = '/employer/dashboard';
      }
    } catch (err: unknown) {
      // Extract error message from the error object
      let errorMessage = 'Registration failed. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl animate-fadeIn">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-3" style={{ letterSpacing: '-0.02em' }}>
            SKILLBRIDGE
          </h1>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="meta-line"></div>
            <p className="meta-text">JOIN OUR COMMUNITY</p>
            <div className="meta-line"></div>
          </div>
        </div>

        {/* Register Card */}
        <div className="card">
          <div className="mb-8">
            <h2 className="text-3xl font-black mb-2">CREATE ACCOUNT</h2>
            <div className="flex items-center gap-3">
              <div className="meta-line"></div>
              <span className="meta-text">GET STARTED</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-mono">{error}</p>
              </div>
            )}

            {/* Role Selection - Tabs */}
            <div>
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`flex-1 py-4 px-6 font-black text-sm transition-all relative ${
                    role === 'candidate'
                      ? 'text-red-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <UserCircle className="w-5 h-5" />
                    <span>CANDIDATE</span>
                  </div>
                  {role === 'candidate' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`flex-1 py-4 px-6 font-black text-sm transition-all relative ${
                    role === 'employer'
                      ? 'text-red-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    <span>EMPLOYER</span>
                  </div>
                  {role === 'employer' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                  )}
                </button>
              </div>
              <p className="text-xs font-mono text-gray-500 mt-3 text-center">
                {role === 'candidate' ? 'LOOKING FOR JOB OPPORTUNITIES' : 'HIRING TALENTED PROFESSIONALS'}
              </p>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                  FIRST NAME *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                  <input
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="input-field pl-11"
                    placeholder="John"
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                  LAST NAME *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                  <input
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="input-field pl-11"
                    placeholder="Doe"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                EMAIL ADDRESS *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-11"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                  PHONE NUMBER
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field pl-11"
                    placeholder="+1 (555) 000-0000"
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                  LOCATION
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                  <input
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field pl-11"
                    placeholder="City, Country"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Employer-specific fields */}
            {role === 'employer' && (
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="meta-line"></div>
                  <span className="meta-text">COMPANY INFORMATION</span>
                </div>

                <div>
                  <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                    COMPANY NAME *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <input
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleChange}
                      className="input-field pl-11"
                      placeholder="Acme Inc."
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                    COMPANY WEBSITE
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <input
                      name="company_website"
                      type="url"
                      value={formData.company_website}
                      onChange={handleChange}
                      className="input-field pl-11"
                      placeholder="https://example.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                    COMPANY SIZE
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <select
                      name="company_size"
                      value={formData.company_size}
                      onChange={handleChange}
                      className="input-field pl-11"
                      disabled={loading}
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Password Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                    PASSWORD *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input-field pl-11"
                      placeholder="Enter password"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-mono font-semibold mb-2 text-black/70">
                    CONFIRM PASSWORD *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="input-field pl-11"
                      placeholder="Repeat password"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-mono font-semibold text-black/70 mb-2 uppercase">Password Requirements:</p>
                <ul className="text-xs font-mono text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                      {formData.password.length >= 8 ? '✓' : '○'}
                    </span>
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                      {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                    </span>
                    One uppercase letter (A-Z)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                      {/[a-z]/.test(formData.password) ? '✓' : '○'}
                    </span>
                    One lowercase letter (a-z)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                      {/\d/.test(formData.password) ? '✓' : '○'}
                    </span>
                    One number (0-9)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '○'}
                    </span>
                    One special character (!@#$%^&*...)
                  </li>
                </ul>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full"
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
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
                ALREADY HAVE AN ACCOUNT?
              </p>
              <Link href="/login">
                <button type="button" className="btn-secondary w-full">
                  SIGN IN
                </button>
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-mono text-black/50">
            BY CREATING AN ACCOUNT, YOU AGREE TO OUR{' '}
            <Link href="/terms" className="text-red-600 hover:text-red-700">
              TERMS
            </Link>{' '}
            AND{' '}
            <Link href="/privacy" className="text-red-600 hover:text-red-700">
              PRIVACY POLICY
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
