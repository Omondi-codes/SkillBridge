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
  company_website?: string;
  company_description?: string;
  location: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary_min: number;
  salary_max: number;
  currency: string;
  description: string;
  responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  benefits: string[];
  posted_date: string;
  deadline?: string;
  remote_option: boolean;
  experience_level: string;
  experience_years?: number;
  category?: string;
  education_level?: string;
  positions_available?: number;
  applications_count?: number;
  views_count?: number;
  match_score?: number;
  matching_details?: {
    matched_required_skills: string[];
    matched_preferred_skills: string[];
    missing_skills: string[];
    experience_match: boolean;
    location_match: boolean;
    similarity_score: number;
    overall_score: number;
  };
}

export default function JobDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'candidate') {
      router.push('/login');
      return;
    }

    fetchJobDetails();
  }, [jobId, user, router]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);

      // Fetch job details from API
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

      // Try to get match score and details if user has resume
      let matchScore = undefined;
      let matchingDetails = undefined;
      try {
        const matchResponse = await fetch('http://localhost:5000/api/matching/jobs?limit=100', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          const matches = matchData.data?.matches || [];
          const match = matches.find((m: Record<string, unknown>) => {
            const job = m.job as Record<string, unknown>;
            return job?.id === jobId;
          });
          if (match) {
            const matching = match.matching as Record<string, unknown>;
            const details = matching.details as Record<string, unknown>;
            matchScore = Math.round((matching?.skill_match_percentage as number) || 0);
            matchingDetails = {
              matched_required_skills: (details?.matched_required_skills as string[]) || [],
              matched_preferred_skills: (details?.matched_preferred_skills as string[]) || [],
              missing_skills: (details?.missing_skills as string[]) || [],
              experience_match: (matching?.experience_match as boolean) || false,
              location_match: (matching?.location_match as boolean) || false,
              similarity_score: (matching?.similarity_score as number) || 0,
              overall_score: (matching?.overall_score as number) || 0,
            };
          }
        }
      } catch {
        console.log('Could not fetch match score');
      }

      // Map backend data to frontend structure
      const employer = jobData.employer as Record<string, unknown> | undefined;
      const mappedJob: Job = {
        id: jobData.id,
        title: jobData.title,
        company: jobData.company_name || (employer?.company_name as string) || jobData.company || 'Unknown Company',
        company_logo: (jobData.company_logo || employer?.company_logo) as string | undefined,
        company_website: (jobData.company_website || employer?.company_website) as string | undefined,
        company_description: (jobData.company_description || employer?.company_description) as string | undefined,
        location: jobData.location || 'Remote',
        employment_type: jobData.employment_type || 'full-time',
        salary_min: jobData.salary_min || 0,
        salary_max: jobData.salary_max || 0,
        currency: jobData.salary_currency || 'KES',
        description: jobData.description || '',
        responsibilities: Array.isArray(jobData.responsibilities) ? jobData.responsibilities : [],
        required_skills: Array.isArray(jobData.required_skills) ? jobData.required_skills : [],
        preferred_skills: Array.isArray(jobData.preferred_skills) ? jobData.preferred_skills : [],
        benefits: Array.isArray(jobData.benefits) ? jobData.benefits : [],
        posted_date: jobData.posted_at || jobData.created_at || new Date().toISOString(),
        deadline: jobData.application_deadline,
        remote_option: jobData.remote_allowed || false,
        experience_level: jobData.experience_level || 'Not specified',
        experience_years: jobData.experience_years,
        category: jobData.category,
        education_level: jobData.education_level,
        positions_available: jobData.positions_available,
        applications_count: jobData.applications_count,
        views_count: jobData.views_count,
        match_score: matchScore,
        matching_details: matchingDetails
      };

      setJob(mappedJob);
    } catch (err) {
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black mx-auto"></div>
          <p className="text-gray-600 mt-4 font-mono">Loading job details...</p>
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/candidate/jobs"
            className="text-gray-600 hover:text-black transition-colors flex items-center font-black uppercase text-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4 flex-1">
                  {job.company_logo ? (
                    <img
                      src={job.company_logo}
                      alt={job.company}
                      className="w-16 h-16 rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-black flex items-center justify-center text-2xl font-black text-white">
                      {job.company[0]}
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-black mb-2">{job.title}</h1>
                    <p className="text-xl text-gray-600 font-black">{job.company}</p>
                  </div>
                </div>
                {job.match_score && (
                  <div className="text-center">
                    <div className="relative w-20 h-20">
                      <svg className="transform -rotate-90 w-20 h-20">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#e5e5e5"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#000000"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(job.match_score / 100) * 201} 201`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black">{job.match_score}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-mono uppercase">Match</p>
                  </div>
                )}
              </div>

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
                {job.remote_option && (
                  <div className="flex items-center font-black text-green-700">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Remote Available
                  </div>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div className="card">
              <h2 className="text-2xl font-black mb-2">ABOUT THE ROLE</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="meta-line"></div>
                <span className="meta-text">JOB DESCRIPTION</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{job.description}</p>
            </div>

            {/* Matching Details - Show if available */}
            {job.matching_details && job.match_score && job.match_score > 0 && (
              <div className="card bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-black flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Your Match Analysis
                  </h2>
                  <div className="flex items-center gap-4">
                    {job.matching_details.experience_match && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
                        ✓ Experience Match
                      </span>
                    )}
                    {job.matching_details.location_match && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                        ✓ Location Match
                      </span>
                    )}
                  </div>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-gray-600 text-sm mb-1">Skills Match</p>
                    <p className="text-3xl font-black text-purple-400">{job.match_score}%</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 border border-blue-500/20">
                    <p className="text-gray-600 text-sm mb-1">Overall Score</p>
                    <p className="text-3xl font-black text-blue-400">
                      {Math.round(job.matching_details.overall_score * 100)}%
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 border border-cyan-500/20">
                    <p className="text-gray-600 text-sm mb-1">Similarity Score</p>
                    <p className="text-3xl font-black text-cyan-400">
                      {Math.round(job.matching_details.similarity_score * 100)}%
                    </p>
                  </div>
                </div>

                {/* Skills Breakdown */}
                <div className="space-y-6">
                  {/* Matched Required Skills */}
                  {job.matching_details.matched_required_skills.length > 0 && (
                    <div>
                      <h3 className="text-black font-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Required Skills You Have ({job.matching_details.matched_required_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.matching_details.matched_required_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-300 text-sm rounded-lg font-medium"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Preferred Skills */}
                  {job.matching_details.matched_preferred_skills.length > 0 && (
                    <div>
                      <h3 className="text-black font-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Preferred Skills You Have ({job.matching_details.matched_preferred_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.matching_details.matched_preferred_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm rounded-lg font-medium"
                          >
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {job.matching_details.missing_skills.length > 0 && (
                    <div>
                      <h3 className="text-black font-black mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Skills to Learn ({job.matching_details.missing_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.matching_details.missing_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm rounded-lg font-medium"
                          >
                            ⚠ {skill}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm mt-3">
                        💡 Consider learning these skills to improve your chances for similar roles
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                {(job.category || job.education_level || job.experience_years) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-black font-black mb-3">Additional Requirements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {job.category && (
                        <div>
                          <p className="text-gray-600 mb-1">Category</p>
                          <p className="text-black font-medium">{job.category}</p>
                        </div>
                      )}
                      {job.education_level && (
                        <div>
                          <p className="text-gray-600 mb-1">Education</p>
                          <p className="text-black font-medium">{job.education_level}</p>
                        </div>
                      )}
                      {job.experience_years !== undefined && (
                        <div>
                          <p className="text-gray-600 mb-1">Experience Required</p>
                          <p className="text-black font-medium">{job.experience_years} {job.experience_years === 1 ? 'year' : 'years'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-black mb-2">RESPONSIBILITIES</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="meta-line"></div>
                  <span className="meta-text">WHAT YOU&apos;LL DO</span>
                </div>
                <ul className="space-y-3">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <span className="text-black font-black mr-3 mt-0.5">▪</span>
                      <span className="font-semibold">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            <div className="card">
              <h2 className="text-2xl font-black mb-2">REQUIRED SKILLS</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="meta-line"></div>
                <span className="meta-text">MUST HAVE</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {job.required_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-black"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <h3 className="text-xl font-black mb-2">PREFERRED SKILLS</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="meta-line"></div>
                <span className="meta-text">NICE TO HAVE</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.preferred_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-black"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Missing Skills - Show if available */}
              {job.matching_details && job.matching_details.missing_skills && job.matching_details.missing_skills.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-black mb-2 text-orange-700">SKILLS TO LEARN</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="meta-line bg-orange-600"></div>
                    <span className="meta-text text-orange-600">IMPROVE YOUR PROFILE</span>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-orange-800 font-black text-sm mb-1">
                          You&apos;re missing {job.matching_details.missing_skills.length} skill{job.matching_details.missing_skills.length !== 1 ? 's' : ''} for this role
                        </p>
                        <p className="text-orange-700 text-xs">
                          Learning these skills could significantly improve your chances for similar positions
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.matching_details.missing_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-sm font-black"
                      >
                        ⚠ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-black mb-2">BENEFITS</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="meta-line"></div>
                  <span className="meta-text">PERKS & BENEFITS</span>
                </div>
                <ul className="space-y-3">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <svg className="w-5 h-5 mr-3 mt-0.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8 space-y-6">
              {/* Apply Button */}
              <Link
                href={`/candidate/jobs/${jobId}/apply`}
                className="btn-primary w-full text-center"
              >
                Apply Now
              </Link>

              {/* Job Info */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-black text-black mb-4">Job Information</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Experience Level</p>
                    <p className="text-black font-medium">{job.experience_level}</p>
                  </div>
                  {job.experience_years !== undefined && (
                    <div>
                      <p className="text-gray-500 mb-1">Years Required</p>
                      <p className="text-black font-medium">{job.experience_years} {job.experience_years === 1 ? 'year' : 'years'}</p>
                    </div>
                  )}
                  {job.category && (
                    <div>
                      <p className="text-gray-500 mb-1">Category</p>
                      <p className="text-black font-medium">{job.category}</p>
                    </div>
                  )}
                  {job.education_level && (
                    <div>
                      <p className="text-gray-500 mb-1">Education</p>
                      <p className="text-black font-medium">{job.education_level}</p>
                    </div>
                  )}
                  {job.positions_available !== undefined && (
                    <div>
                      <p className="text-gray-500 mb-1">Positions Available</p>
                      <p className="text-black font-medium">{job.positions_available}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 mb-1">Posted Date</p>
                    <p className="text-black font-medium">
                      {new Date(job.posted_date).toLocaleDateString()}
                    </p>
                  </div>
                  {job.deadline && (
                    <div>
                      <p className="text-gray-500 mb-1">Application Deadline</p>
                      <p className="text-black font-medium">
                        {new Date(job.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {job.applications_count !== undefined && (
                    <div>
                      <p className="text-gray-500 mb-1">Applications</p>
                      <p className="text-black font-medium">{job.applications_count} {job.applications_count === 1 ? 'applicant' : 'applicants'}</p>
                    </div>
                  )}
                  {job.views_count !== undefined && (
                    <div>
                      <p className="text-gray-500 mb-1">Views</p>
                      <p className="text-black font-medium">{job.views_count}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-black text-black mb-4">About {job.company}</h3>
                {job.company_description ? (
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">{job.company_description}</p>
                ) : (
                  <p className="text-gray-500 text-sm mb-4">
                    Learn more about {job.company} on their website.
                  </p>
                )}
                {job.company_website ? (
                  <a
                    href={job.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full text-sm text-center block"
                  >
                    View Company Profile
                  </a>
                ) : (
                  <button
                    disabled
                    className="btn-secondary w-full text-sm opacity-40 cursor-not-allowed"
                    title="No company website provided"
                  >
                    Company Profile Unavailable
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <button className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Save Job
                </button>
                <button className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
