'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  TrendingUp,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';

interface Job {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience_level: 'entry' | 'mid' | 'senior' | 'lead';
  salary_range: string;
  description: string;
  requirements: string[];
  posted_date: string;
  application_deadline?: string;
  match_percentage: number;
  matching_details?: {
    matched_required_skills: string[];
    matched_preferred_skills: string[];
    missing_skills: string[];
    experience_match: boolean;
    location_match: boolean;
    similarity_score: number;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      // Try to fetch matched jobs first (requires resume)
      try {
        const matchedResponse = await api.get('/matching/jobs?limit=100');
        const matchedData = matchedResponse.data.data || {};
        const matches = matchedData.matches || [];

        if (matches.length > 0) {
          // Map matched jobs with their match percentages
          const mappedJobs = matches.map((match: Record<string, unknown>) => {
            const job = match.job as Record<string, unknown>;
            const matching = match.matching as Record<string, unknown>;
            const details = matching.details as Record<string, unknown>;

            // Build salary range from min/max
            let salaryRange = 'Competitive';
            if (job.salary_min && job.salary_max) {
              const currency = job.salary_currency || 'KES';
              salaryRange = `${currency} ${job.salary_min} - ${job.salary_max}`;
            }

            return {
              id: job.id as string,
              title: job.title as string,
              company: (job.company_name as string) || (job.company as string) || 'Unknown Company',
              company_logo: job.company_logo as string | undefined,
              location: (job.location as string) || 'Remote',
              employment_type: (job.employment_type as 'full-time' | 'part-time' | 'contract' | 'internship') || 'full-time',
              experience_level: (job.experience_level as 'entry' | 'mid' | 'senior' | 'lead') || 'mid',
              salary_range: salaryRange,
              description: (job.description as string) || '',
              requirements: (job.required_skills as string[]) || [],
              posted_date: formatPostedDate((job.posted_at as string) || (job.created_at as string) || ''),
              application_deadline: job.application_deadline as string | undefined,
              match_percentage: Math.round((matching.skill_match_percentage as number) || 0),
              matching_details: {
                matched_required_skills: (details?.matched_required_skills as string[]) || [],
                matched_preferred_skills: (details?.matched_preferred_skills as string[]) || [],
                missing_skills: (details?.missing_skills as string[]) || [],
                experience_match: (matching.experience_match as boolean) || false,
                location_match: (matching.location_match as boolean) || false,
                similarity_score: (matching.similarity_score as number) || 0,
              },
            };
          });

          setJobs(mappedJobs);
          return;
        }
      } catch (matchError) {
        // If matching fails (no resume), fall back to all jobs
        console.log('No resume found, fetching all jobs');
      }

      // Fallback: Fetch all jobs without matching
      const response = await api.get('/jobs');
      const responseData = response.data.data || {};
      const jobsData = responseData.items || [];

      // Map backend data to frontend structure
      const mappedJobs = jobsData.map((job: Record<string, unknown>) => {
        // Build salary range from min/max
        let salaryRange = 'Competitive';
        if (job.salary_min && job.salary_max) {
          const currency = job.salary_currency || 'KES';
          salaryRange = `${currency} ${job.salary_min} - ${job.salary_max}`;
        }

        return {
          id: job.id as string,
          title: job.title as string,
          company: (job.company_name as string) || (job.company as string) || 'Unknown Company',
          company_logo: job.company_logo as string | undefined,
          location: (job.location as string) || 'Remote',
          employment_type: (job.employment_type as 'full-time' | 'part-time' | 'contract' | 'internship') || 'full-time',
          experience_level: (job.experience_level as 'entry' | 'mid' | 'senior' | 'lead') || 'mid',
          salary_range: salaryRange,
          description: (job.description as string) || '',
          requirements: (job.required_skills as string[]) || [],
          posted_date: formatPostedDate((job.posted_at as string) || (job.created_at as string) || ''),
          application_deadline: job.application_deadline as string | undefined,
          match_percentage: 0, // No matching without resume
        };
      });

      setJobs(mappedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPostedDate = (date: string) => {
    if (!date) return 'Recently';
    const postedDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - postedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      !locationFilter ||
      job.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesEmploymentType =
      !employmentTypeFilter ||
      job.employment_type === employmentTypeFilter;

    const matchesExperienceLevel =
      !experienceLevelFilter ||
      job.experience_level === experienceLevelFilter;

    return matchesSearch && matchesLocation && matchesEmploymentType && matchesExperienceLevel;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setEmploymentTypeFilter('');
    setExperienceLevelFilter('');
  };

  const getMatchBadge = (percentage: number) => {
    let bgColor = 'bg-green-100';
    let textColor = 'text-green-800';
    let borderColor = 'border-green-200';

    if (percentage < 70) {
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
      borderColor = 'border-orange-200';
    }
    if (percentage < 50) {
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      borderColor = 'border-red-200';
    }

    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${bgColor} ${textColor} border ${borderColor} text-xs font-black uppercase`}>
        <TrendingUp size={12} />
        {percentage}% Match
      </div>
    );
  };

  const getEmploymentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'full-time': 'bg-blue-50 border-blue-200 text-blue-700',
      'part-time': 'bg-purple-50 border-purple-200 text-purple-700',
      'contract': 'bg-orange-50 border-orange-200 text-orange-700',
      'internship': 'bg-green-50 border-green-200 text-green-700',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md border ${colors[type]} text-xs font-black uppercase`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getDeadlineInfo = (deadline: string | undefined) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { text: 'EXPIRED', color: 'bg-gray-100 text-gray-600 border-gray-300', urgent: false };
    } else if (daysRemaining === 0) {
      return { text: 'CLOSES TODAY', color: 'bg-red-500 text-white border-red-600 animate-pulse', urgent: true };
    } else if (daysRemaining === 1) {
      return { text: 'CLOSES TOMORROW', color: 'bg-red-500 text-white border-red-600', urgent: true };
    } else if (daysRemaining <= 3) {
      return { text: `${daysRemaining} DAYS LEFT`, color: 'bg-orange-500 text-white border-orange-600', urgent: true };
    } else if (daysRemaining <= 7) {
      return { text: `${daysRemaining} DAYS LEFT`, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', urgent: false };
    } else {
      return { text: `${daysRemaining} DAYS LEFT`, color: 'bg-gray-100 text-gray-700 border-gray-300', urgent: false };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black mb-2">BROWSE JOBS</h1>
        <div className="flex items-center gap-3">
          <div className="meta-line"></div>
          <span className="meta-text">FIND YOUR PERFECT MATCH FROM {jobs.length} OPPORTUNITIES</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search jobs, companies, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-200 font-semibold"
            />
          </div>

          {/* Location Filter */}
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-200 font-semibold"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 font-black uppercase text-sm"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employment Type */}
              <div>
                <label className="block text-sm font-mono text-gray-600 mb-2 uppercase">Employment Type</label>
                <select
                  value={employmentTypeFilter}
                  onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black font-semibold focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-200"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-mono text-gray-600 mb-2 uppercase">Experience Level</label>
                <select
                  value={experienceLevelFilter}
                  onChange={(e) => setExperienceLevelFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black font-semibold focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-200"
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead/Principal</option>
                </select>
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="mt-4 text-black hover:text-gray-700 text-sm font-black flex items-center gap-1 transition-colors uppercase"
            >
              <X size={16} />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 font-mono text-sm uppercase">
          Showing {paginatedJobs.length} of {filteredJobs.length} jobs
        </p>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paginatedJobs.map((job) => (
          <div
            key={job.id}
            className="card hover:border-gray-400 hover:shadow-lg transition-all duration-300 group cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-black text-xl">
                    {job.company.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-black font-black text-lg group-hover:text-red-600 transition-colors">{job.title}</h3>
                  <p className="text-gray-600 text-sm font-semibold">{job.company}</p>
                </div>
              </div>
              {job.match_percentage > 0 && getMatchBadge(job.match_percentage)}
            </div>

            {/* Deadline Warning - Prominently displayed if urgent */}
            {(() => {
              const deadlineInfo = getDeadlineInfo(job.application_deadline);
              return deadlineInfo && deadlineInfo.urgent ? (
                <div className={`mb-4 px-4 py-3 rounded-lg border-2 ${deadlineInfo.color} flex items-center gap-2`}>
                  <Clock size={18} className={deadlineInfo.text.includes('TODAY') ? 'animate-pulse' : ''} />
                  <span className="font-black text-sm tracking-wide">⚠️ {deadlineInfo.text}</span>
                </div>
              ) : null;
            })()}

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <MapPin size={16} className="text-gray-400" />
                <span className="font-semibold">{job.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Briefcase size={16} className="text-gray-400" />
                <span>{getEmploymentTypeBadge(job.employment_type)}</span>
                <span className="text-gray-300">•</span>
                <span className="capitalize font-semibold">{job.experience_level} Level</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <DollarSign size={16} className="text-gray-400" />
                <span className="font-semibold">{job.salary_range}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Clock size={16} className="text-gray-400" />
                <span className="font-mono">Posted {job.posted_date}</span>
                {(() => {
                  const deadlineInfo = getDeadlineInfo(job.application_deadline);
                  return deadlineInfo && !deadlineInfo.urgent ? (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-black ${deadlineInfo.color}`}>
                        {deadlineInfo.text}
                      </span>
                    </>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{job.description}</p>

            {/* Matching Details - Only show if we have matching data */}
            {job.matching_details && job.match_percentage > 0 && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-black text-xs font-black uppercase">Match Breakdown</h4>
                  <div className="flex items-center gap-2 text-xs">
                    {job.matching_details.experience_match && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded border border-green-200 font-mono">
                        ✓ EXP
                      </span>
                    )}
                    {job.matching_details.location_match && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200 font-mono">
                        ✓ LOC
                      </span>
                    )}
                  </div>
                </div>

                {/* Matched Skills */}
                {job.matching_details.matched_required_skills.length > 0 && (
                  <div>
                    <p className="text-green-700 text-xs font-black mb-2 uppercase">
                      ✓ Your Matching Skills ({job.matching_details.matched_required_skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {job.matching_details.matched_required_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-50 border border-green-200 text-green-700 text-xs rounded font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {job.matching_details.missing_skills.length > 0 && (
                  <div>
                    <p className="text-orange-700 text-xs font-black mb-2 uppercase">
                      Skills to Learn ({job.matching_details.missing_skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {job.matching_details.missing_skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.matching_details.missing_skills.length > 3 && (
                        <span className="px-2 py-1 text-orange-700 text-xs font-mono">
                          +{job.matching_details.missing_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Similarity Score */}
                <div className="text-xs text-gray-500 font-mono pt-2 border-t border-gray-200">
                  SIMILARITY: {Math.round(job.matching_details.similarity_score * 100)}%
                </div>
              </div>
            )}

            {/* Requirements - Only show if no matching details */}
            {(!job.matching_details || job.match_percentage === 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {job.requirements.slice(0, 3).map((req, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-gray-700 text-xs font-semibold"
                  >
                    {req}
                  </span>
                ))}
                {job.requirements.length > 3 && (
                  <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-gray-500 text-xs font-mono">
                    +{job.requirements.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href={`/candidate/jobs/${job.id}`}
                className="flex-1 px-4 py-2 bg-black text-white font-black rounded-lg hover:bg-gray-800 transition-all duration-200 text-center uppercase text-sm"
              >
                View Details
              </Link>
              <button className="px-4 py-2 bg-gray-100 border border-gray-200 text-black rounded-lg hover:bg-gray-200 transition-all duration-200 font-black uppercase text-sm">
                Save
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft size={20} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg font-black transition-all duration-200 ${
                currentPage === page
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-200 text-black hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
