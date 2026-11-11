'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary_min: number;
  salary_max: number;
  currency: string;
}

export default function JobApplicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [primaryResume, setPrimaryResume] = useState<{ filename: string } | null>(null);
  const [checkingResume, setCheckingResume] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'candidate') {
      router.push('/login');
      return;
    }

    fetchJobDetails();
    checkResume();
  }, [jobId, user, router]);

  const checkResume = async () => {
    try {
      setCheckingResume(true);
      const response = await fetch('http://localhost:5000/api/resumes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Resume API response:', data);
        console.log('Response structure check:', {
          hasSuccess: 'success' in data,
          hasData: 'data' in data,
          dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
          dataLength: Array.isArray(data.data) ? data.data.length : 'N/A'
        });
        const resumesData = data.data || [];
        console.log('Resumes found:', resumesData.length);

        if (resumesData.length > 0) {
          // Find primary resume
          const primary = resumesData.find((r: Record<string, unknown>) => r.is_primary === true);
          console.log('Primary resume:', primary);

          if (primary) {
            setPrimaryResume({ filename: primary.filename as string });
          } else {
            // Use first resume if no primary
            console.log('Using first resume as fallback');
            setPrimaryResume({ filename: resumesData[0].filename as string });
          }
        } else {
          console.log('No resumes found');
        }
      } else {
        console.error('Resume fetch failed:', response.status);
      }
    } catch (err) {
      console.error('Error checking resume:', err);
    } finally {
      setCheckingResume(false);
    }
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
      const jobData = data.data;

      console.log('Job API response:', data);
      console.log('Job data:', jobData);
      console.log('Job title:', jobData.title);

      const mappedJob: Job = {
        id: jobData.id,
        title: jobData.title || 'Unknown Position',
        company: jobData.company_name || jobData.company || 'Unknown Company',
        company_logo: jobData.company_logo,
        location: jobData.location || 'Remote',
        employment_type: jobData.employment_type || 'full-time',
        salary_min: jobData.salary_min || 0,
        salary_max: jobData.salary_max || 0,
        currency: jobData.salary_currency || 'KES'
      };

      setJob(mappedJob);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setApplying(true);

    if (!primaryResume) {
      setError('Please upload a resume on the My Resumes page before applying');
      setApplying(false);
      return;
    }

    if (!coverLetter.trim()) {
      setError('Please write a cover letter');
      setApplying(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/matching/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_id: jobId,
          cover_letter: coverLetter
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to submit application');
      }

      setSuccess('Application submitted successfully! Redirecting...');
      setTimeout(() => {
        router.push('/candidate/applications');
      }, 2000);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black mx-auto"></div>
          <p className="text-gray-600 mt-4 font-mono">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black mb-4">JOB NOT FOUND</h2>
          <Link href="/candidate/jobs" className="btn-primary">
            BACK TO JOBS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/candidate/jobs/${jobId}`}
            className="text-gray-600 hover:text-black transition-colors flex items-center font-black uppercase text-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Job Details
          </Link>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-200 text-green-800 px-6 py-4 rounded-lg mb-6 animate-fadeIn font-black">
            {success}
          </div>
        )}

        {/* Job Summary Card */}
        <div className="card mb-6">
          <div className="flex items-start space-x-4">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company}
                className="w-16 h-16 rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-black flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
                {job.company[0]}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-black mb-1">{job.title}</h1>
              <p className="text-lg text-gray-600 font-black mb-3">{job.company}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <div className="flex items-center font-black">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </div>
                <div className="flex items-center font-black uppercase text-xs">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {job.employment_type.replace('-', ' ')}
                </div>
                <div className="flex items-center font-black">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {job.currency} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-black mb-2">Submit Your Application</h2>
            <div className="flex items-center gap-3">
              <div className="meta-line"></div>
              <span className="meta-text">APPLICATION FORM</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-8">
            {/* Resume Info */}
            <div>
              <label className="block text-lg font-black text-black mb-2 uppercase">
                1. Resume
              </label>
              <div className="flex items-center gap-3 mb-4">
                <div className="meta-line"></div>
                <span className="meta-text">AUTOMATICALLY USING YOUR PRIMARY RESUME</span>
              </div>

              {checkingResume ? (
                <div className="p-5 bg-gray-50 border-2 border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-base font-black text-gray-700">Checking for resume...</p>
                  </div>
                </div>
              ) : primaryResume ? (
                <div className="p-5 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-base font-black text-green-900">Resume Ready</p>
                      <p className="text-sm text-green-700 mt-1">
                        Using: <span className="font-black">{primaryResume.filename}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-base font-black text-orange-900 mb-2">No Resume Found</p>
                      <p className="text-sm text-orange-700 mb-4">
                        You need to upload a resume before applying for jobs. Please go to the My Resumes page to upload your resume.
                      </p>
                      <Link
                        href="/candidate/my-resumes"
                        className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-black uppercase text-sm"
                      >
                        Go to My Resumes
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-lg font-black text-black mb-2 uppercase">
                2. Write Your Cover Letter <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-3 mb-4">
                <div className="meta-line"></div>
                <span className="meta-text">TELL US WHY YOU&apos;RE PERFECT</span>
              </div>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="input-field min-h-[300px] resize-y text-base"
                placeholder="Dear Hiring Manager,

I am writing to express my strong interest in this position...

• Why are you interested in this role?
• What makes you a great fit?
• What relevant experience do you bring?
• What value can you add to the company?

Looking forward to discussing how I can contribute to your team.

Best regards,
[Your name]"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Pro tip: Tailor your cover letter to highlight skills mentioned in the job description
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-6 border-t-2 border-gray-200">
              <Link
                href={`/candidate/jobs/${jobId}`}
                className="w-full sm:w-auto px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-black uppercase text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={applying || !primaryResume}
              >
                {applying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Application...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-black text-blue-900 mb-2">Application Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your primary resume will be automatically used for this application</li>
                <li>• Customize your cover letter for each application</li>
                <li>• Highlight skills that match the job requirements</li>
                <li>• Proofread everything before submitting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
