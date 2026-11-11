'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  Mail,
  Phone,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Star,
  Filter,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employment_type: string;
  experience_level: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  required_skills: string[];
  preferred_skills: string[];
  status: string;
  posted_at: string;
  application_deadline?: string;
  applications_count: number;
  views_count: number;
}

interface Candidate {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  candidate_location?: string;
  applied_date: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected';
  cover_letter: string;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  experience_match: boolean;
  location_match: boolean;
  resume_url?: string;
}

interface SuggestedCandidate {
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  candidate_location?: string;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  experience_match: boolean;
  location_match: boolean;
  similarity_score: number;
}

export default function EmployerJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'match' | 'date'>('match');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showSuggestedModal, setShowSuggestedModal] = useState(false);
  const [suggestedCandidates, setSuggestedCandidates] = useState<SuggestedCandidate[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    fetchCandidates();
  }, [jobId]);

  useEffect(() => {
    filterAndSortCandidates();
  }, [candidates, statusFilter, sortBy]);

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      setJob(response.data.data);
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/matching/job/${jobId}/applications`);
      const applicationsData = response.data.data || [];

      // Map backend data to frontend structure
      const mappedCandidates = applicationsData.map((app: Record<string, unknown>) => ({
        id: app.id as string,
        candidate_id: app.candidate_id as string,
        candidate_name: (app.candidate_name as string) || 'Unknown Candidate',
        candidate_email: (app.candidate_email as string) || '',
        candidate_phone: app.candidate_phone as string,
        candidate_location: app.candidate_location as string,
        applied_date: (app.created_at as string) || new Date().toISOString(),
        status: (app.status as 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected') || 'pending',
        cover_letter: (app.cover_letter as string) || '',
        match_percentage: (app.match_percentage as number) || 0,
        matched_skills: (app.matched_skills as string[]) || [],
        missing_skills: (app.missing_skills as string[]) || [],
        experience_match: (app.experience_match as boolean) || false,
        location_match: (app.location_match as boolean) || false,
        resume_url: app.resume_url as string,
      }));

      setCandidates(mappedCandidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCandidates = () => {
    let filtered = [...candidates];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Sort
    if (sortBy === 'match') {
      filtered.sort((a, b) => b.match_percentage - a.match_percentage);
    } else {
      filtered.sort((a, b) => new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime());
    }

    setFilteredCandidates(filtered);
  };

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      await api.patch(`/matching/application/${candidateId}`, { status: newStatus });

      // Update local state
      setCandidates(candidates.map(c =>
        c.id === candidateId ? { ...c, status: newStatus as 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected' } : c
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const fetchSuggestedCandidates = async () => {
    try {
      setLoadingSuggestions(true);
      const response = await api.get(`/matching/candidates?job_id=${jobId}&limit=20`);
      const matchesData = response.data.data?.matches || [];

      // Map to SuggestedCandidate format
      const mapped = matchesData.map((match: Record<string, unknown>) => {
        const candidate = match.candidate as Record<string, unknown>;
        const matching = match.matching as Record<string, unknown>;
        const resumeSummary = match.resume_summary as Record<string, unknown> | null;

        return {
          candidate_id: candidate.id as string,
          candidate_name: `${candidate.first_name} ${candidate.last_name}`,
          candidate_email: candidate.email as string,
          candidate_phone: candidate.phone as string | undefined,
          candidate_location: candidate.location as string | undefined,
          match_percentage: Math.round((matching.skill_match_percentage as number) || 0),
          matched_skills: resumeSummary?.skills as string[] || [],
          missing_skills: [],
          experience_match: matching.experience_match as boolean || false,
          location_match: matching.location_match as boolean || false,
          similarity_score: matching.similarity_score as number || 0,
        };
      });

      // Filter out candidates who have already applied
      const appliedCandidateIds = new Set(candidates.map(c => c.candidate_id));
      const filtered = mapped.filter((c: SuggestedCandidate) => !appliedCandidateIds.has(c.candidate_id));

      setSuggestedCandidates(filtered);
      setShowSuggestedModal(true);
    } catch (error) {
      console.error('Error fetching suggested candidates:', error);
      alert('Failed to fetch suggested candidates');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
      shortlisted: 'bg-purple-100 text-purple-800 border-purple-200',
      interviewed: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      offered: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || colors.pending;
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-700';
    if (percentage >= 60) return 'text-blue-700';
    if (percentage >= 40) return 'text-yellow-700';
    return 'text-orange-700';
  };

  const statusCounts = {
    all: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    reviewed: candidates.filter(c => c.status === 'reviewed').length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    interviewed: candidates.filter(c => c.status === 'interviewed').length,
    offered: candidates.filter(c => c.status === 'offered').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
  };

  if (loading && !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-black text-black mb-4">JOB NOT FOUND</h2>
          <Link href="/employer/jobs" className="text-black hover:text-gray-700 underline font-semibold">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/employer/jobs"
          className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-black mb-2">{job.title.toUpperCase()}</h1>
          <div className="flex items-center gap-3">
            <div className="meta-line"></div>
            <span className="meta-text">
              {candidates.length} APPLICATIONS • POSTED {new Date(job.posted_at).toLocaleDateString().toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSuggestedCandidates}
            disabled={loadingSuggestions}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-black uppercase text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={18} />
            {loadingSuggestions ? 'Loading...' : 'Find Candidates'}
          </button>
          <Link
            href={`/employer/jobs/${jobId}/edit`}
            className="px-6 py-3 bg-white border border-gray-200 text-black rounded-lg hover:border-gray-400 hover:shadow transition-all font-black uppercase text-sm"
          >
            Edit Job
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:border-gray-400 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-black rounded-lg">
              <Users className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-3xl font-black text-black">{candidates.length}</p>
              <p className="text-gray-600 text-xs font-mono uppercase tracking-wide">Total Applications</p>
            </div>
          </div>
        </div>

        <div className="card hover:border-gray-400 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-black rounded-lg">
              <CheckCircle className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-3xl font-black text-black">{statusCounts.shortlisted}</p>
              <p className="text-gray-600 text-xs font-mono uppercase tracking-wide">Shortlisted</p>
            </div>
          </div>
        </div>

        <div className="card hover:border-gray-400 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-black rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-3xl font-black text-black">
                {candidates.length > 0 ? Math.round(candidates.reduce((sum, c) => sum + c.match_percentage, 0) / candidates.length) : 0}%
              </p>
              <p className="text-gray-600 text-xs font-mono uppercase tracking-wide">Avg Match</p>
            </div>
          </div>
        </div>

        <div className="card hover:border-gray-400 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-black rounded-lg">
              <Eye className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-3xl font-black text-black">{job.views_count || 0}</p>
              <p className="text-gray-600 text-xs font-mono uppercase tracking-wide">Job Views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="card">
        <h2 className="text-xl font-black mb-2">JOB DETAILS</h2>
        <div className="flex items-center gap-3 mb-6">
          <div className="meta-line"></div>
          <span className="meta-text">POSITION OVERVIEW</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 text-gray-600">
            <MapPin size={18} className="text-black" />
            <span className="font-semibold">{job.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Briefcase size={18} className="text-black" />
            <span className="font-semibold capitalize">{job.employment_type.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <DollarSign size={18} className="text-black" />
            <span className="font-semibold">{job.salary_currency} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar size={18} className="text-black" />
            <span className="font-semibold">Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'Not set'}</span>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-black font-black mb-3 text-sm uppercase">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {job.required_skills.map((skill, idx) => (
              <span key={idx} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {job.preferred_skills && job.preferred_skills.length > 0 && (
          <div className="pt-6 border-t border-gray-200 mt-6">
            <h3 className="text-black font-black mb-3 text-sm uppercase">Preferred Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.preferred_skills.map((skill, idx) => (
                <span key={idx} className="px-4 py-2 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-black uppercase transition-all ${
                statusFilter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-black uppercase transition-all border ${
                statusFilter === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
              }`}
            >
              Pending ({statusCounts.pending})
            </button>
            <button
              onClick={() => setStatusFilter('shortlisted')}
              className={`px-4 py-2 rounded-lg text-sm font-black uppercase transition-all border ${
                statusFilter === 'shortlisted'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
              }`}
            >
              Shortlisted ({statusCounts.shortlisted})
            </button>
            <button
              onClick={() => setStatusFilter('interviewed')}
              className={`px-4 py-2 rounded-lg text-sm font-black uppercase transition-all border ${
                statusFilter === 'interviewed'
                  ? 'bg-cyan-100 text-cyan-800 border-cyan-200'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
              }`}
            >
              Interviewed ({statusCounts.interviewed})
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 text-sm font-mono uppercase">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'date')}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-black text-sm font-semibold focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
            >
              <option value="match">Match Score</option>
              <option value="date">Application Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-black">CANDIDATES</h2>
          <div className="meta-line"></div>
          <span className="meta-text">{filteredCandidates.length} RESULTS</span>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto"></div>
              <p className="text-gray-600 mt-4 font-mono text-sm">LOADING CANDIDATES...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="card text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-black font-black text-lg mb-2">NO CANDIDATES FOUND</p>
              <p className="text-gray-500 text-sm font-mono">Try adjusting your filters</p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="card hover:border-gray-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-lg bg-black flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                    {candidate.candidate_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-black">{candidate.candidate_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span className="font-semibold">{candidate.candidate_email}</span>
                      </div>
                      {candidate.candidate_phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          <span className="font-semibold">{candidate.candidate_phone}</span>
                        </div>
                      )}
                      {candidate.candidate_location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span className="font-semibold">{candidate.candidate_location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span className="font-mono text-xs">Applied {new Date(candidate.applied_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Match Score */}
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <Star className={getMatchColor(candidate.match_percentage)} size={20} fill="currentColor" />
                        <span className={`text-2xl font-black ${getMatchColor(candidate.match_percentage)}`}>
                          {candidate.match_percentage}%
                        </span>
                        <span className="text-gray-500 text-sm font-mono uppercase">Match</span>
                      </div>
                      {candidate.experience_match && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 text-xs rounded font-black uppercase">
                          ✓ Experience
                        </span>
                      )}
                      {candidate.location_match && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs rounded font-black uppercase">
                          ✓ Location
                        </span>
                      )}
                    </div>

                    {/* Skills */}
                    <div className="space-y-3">
                      {candidate.matched_skills.length > 0 && (
                        <div>
                          <p className="text-green-700 text-xs font-black mb-2 uppercase">
                            ✓ Matching Skills ({candidate.matched_skills.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.matched_skills.slice(0, 5).map((skill, idx) => (
                              <span key={idx} className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-sm rounded font-semibold">
                                {skill}
                              </span>
                            ))}
                            {candidate.matched_skills.length > 5 && (
                              <span className="px-3 py-1 text-green-700 text-sm font-mono">
                                +{candidate.matched_skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {candidate.missing_skills.length > 0 && (
                        <div>
                          <p className="text-orange-700 text-xs font-black mb-2 uppercase">
                            Missing Skills ({candidate.missing_skills.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.missing_skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded font-semibold">
                                {skill}
                              </span>
                            ))}
                            {candidate.missing_skills.length > 3 && (
                              <span className="px-3 py-1 text-orange-700 text-sm font-mono">
                                +{candidate.missing_skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      setShowCandidateModal(true);
                    }}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-black uppercase"
                  >
                    View Details
                  </button>

                  {candidate.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(candidate.id, 'shortlisted')}
                        className="px-6 py-2 bg-purple-100 text-purple-800 border border-purple-200 rounded-lg hover:bg-purple-200 transition-all text-sm font-black uppercase"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleStatusChange(candidate.id, 'rejected')}
                        className="px-6 py-2 bg-red-100 text-red-800 border border-red-200 rounded-lg hover:bg-red-200 transition-all text-sm font-black uppercase"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {candidate.status === 'shortlisted' && (
                    <button
                      onClick={() => handleStatusChange(candidate.id, 'interviewed')}
                      className="px-6 py-2 bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg hover:bg-cyan-200 transition-all text-sm font-black uppercase"
                    >
                      Interview
                    </button>
                  )}

                  {candidate.status === 'interviewed' && (
                    <button
                      onClick={() => handleStatusChange(candidate.id, 'offered')}
                      className="px-6 py-2 bg-green-100 text-green-800 border border-green-200 rounded-lg hover:bg-green-200 transition-all text-sm font-black uppercase"
                    >
                      Make Offer
                    </button>
                  )}

                  {candidate.resume_url && (
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all text-sm font-black uppercase flex items-center gap-2"
                    >
                      <Download size={16} />
                      Resume
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Suggested Candidates Modal */}
      {showSuggestedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-black mb-2">SUGGESTED CANDIDATES</h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">{suggestedCandidates.length} HIGH SIMILARITY MATCHES</span>
                </div>
              </div>
              <button
                onClick={() => setShowSuggestedModal(false)}
                className="text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>

            {suggestedCandidates.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-black font-black text-lg mb-2">NO NEW CANDIDATES FOUND</p>
                <p className="text-gray-500 text-sm font-mono">All matching candidates have already applied</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestedCandidates.map((candidate) => (
                  <div
                    key={candidate.candidate_id}
                    className="card hover:border-gray-400 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-lg bg-black flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                        {candidate.candidate_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black text-black">{candidate.candidate_name}</h3>
                          <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-xs font-black uppercase">
                            <Sparkles size={12} className="inline mr-1" />
                            Suggested
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Mail size={14} />
                            <span className="font-semibold">{candidate.candidate_email}</span>
                          </div>
                          {candidate.candidate_phone && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} />
                              <span className="font-semibold">{candidate.candidate_phone}</span>
                            </div>
                          )}
                          {candidate.candidate_location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} />
                              <span className="font-semibold">{candidate.candidate_location}</span>
                            </div>
                          )}
                        </div>

                        {/* Match Score */}
                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-2">
                            <Star className={getMatchColor(candidate.match_percentage)} size={20} fill="currentColor" />
                            <span className={`text-2xl font-black ${getMatchColor(candidate.match_percentage)}`}>
                              {candidate.match_percentage}%
                            </span>
                            <span className="text-gray-500 text-sm font-mono uppercase">Match</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="text-blue-600" size={16} />
                            <span className="text-sm font-mono text-gray-600">
                              Similarity: {Math.round(candidate.similarity_score * 100)}%
                            </span>
                          </div>
                          {candidate.experience_match && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 text-xs rounded font-black uppercase">
                              ✓ Experience
                            </span>
                          )}
                          {candidate.location_match && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs rounded font-black uppercase">
                              ✓ Location
                            </span>
                          )}
                        </div>

                        {/* Skills */}
                        {candidate.matched_skills.length > 0 && (
                          <div>
                            <p className="text-green-700 text-xs font-black mb-2 uppercase">
                              ✓ Skills ({candidate.matched_skills.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {candidate.matched_skills.slice(0, 8).map((skill, idx) => (
                                <span key={idx} className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-sm rounded font-semibold">
                                  {skill}
                                </span>
                              ))}
                              {candidate.matched_skills.length > 8 && (
                                <span className="px-3 py-1 text-green-700 text-sm font-mono">
                                  +{candidate.matched_skills.length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
                      <a
                        href={`mailto:${candidate.candidate_email}`}
                        className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-center font-black uppercase text-sm"
                      >
                        Contact Candidate
                      </a>
                      <button className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all font-black uppercase text-sm">
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowSuggestedModal(false)}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all font-black uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-black mb-2">{selectedCandidate.candidate_name.toUpperCase()}</h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">{selectedCandidate.candidate_email}</span>
                </div>
              </div>
              <button
                onClick={() => setShowCandidateModal(false)}
                className="text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Cover Letter */}
            <div className="mb-6">
              <h3 className="text-black font-black mb-3 flex items-center gap-2 text-sm uppercase">
                <FileText size={18} />
                Cover Letter
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedCandidate.cover_letter}</p>
              </div>
            </div>

            {/* Status Change */}
            <div className="mb-6">
              <h3 className="text-black font-black mb-3 text-sm uppercase">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {['pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      handleStatusChange(selectedCandidate.id, status);
                      setShowCandidateModal(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-black uppercase border transition-all ${
                      selectedCandidate.status === status
                        ? getStatusColor(status)
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:text-black hover:border-gray-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="flex gap-3">
              <a
                href={`mailto:${selectedCandidate.candidate_email}`}
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-center font-black uppercase"
              >
                Send Email
              </a>
              {selectedCandidate.resume_url && (
                <a
                  href={selectedCandidate.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all font-black uppercase flex items-center gap-2"
                >
                  <Download size={16} />
                  Resume
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
