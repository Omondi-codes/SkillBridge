'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  UserCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
} from 'lucide-react';
import api from '@/lib/api';

interface Application {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  candidate_location?: string;
  job_id: string;
  job_title: string;
  job?: {
    id: string;
    title: string;
    location: string;
    employment_type: string;
    status: string;
  };
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected';
  applied_at: string;
  matching_score: number;
  skill_match_percentage: number;
  experience_match: boolean;
  location_match: boolean;
  match_details?: {
    matched_required_skills?: string[];
    missing_skills?: string[];
  };
  cover_letter?: string;
  resume_url?: string;
}

interface JobFilter {
  id: string;
  title: string;
}

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<JobFilter[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'match'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected application for modal
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterAndSortApplications();
  }, [applications, searchQuery, statusFilter, jobFilter, sortBy]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matching/employer/applications');
      const data = response.data.data || {};

      setApplications(data.applications || []);
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortApplications = () => {
    let filtered = [...applications];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.candidate_name?.toLowerCase().includes(query) ||
          app.candidate_email?.toLowerCase().includes(query) ||
          app.job_title?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Job filter
    if (jobFilter !== 'all') {
      filtered = filtered.filter((app) => app.job_id === jobFilter);
    }

    // Sort
    if (sortBy === 'match') {
      filtered.sort((a, b) => (b.matching_score || 0) - (a.matching_score || 0));
    } else {
      filtered.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
    }

    setFilteredApplications(filtered);
    setCurrentPage(1);
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await api.put(`/matching/application/${applicationId}`, { status: newStatus });

      // Update local state
      setApplications(applications.map((app) =>
        app.id === applicationId
          ? { ...app, status: newStatus as Application['status'] }
          : app
      ));

      // Close modal if open
      if (showModal) {
        setShowModal(false);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update application status');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} />;
      case 'reviewed':
        return <Eye size={14} />;
      case 'shortlisted':
        return <UserCheck size={14} />;
      case 'interviewed':
        return <Calendar size={14} />;
      case 'offered':
        return <CheckCircle size={14} />;
      case 'rejected':
        return <XCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-blue-700';
    if (score >= 40) return 'text-yellow-700';
    return 'text-orange-700';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Status counts
  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    reviewed: applications.filter((a) => a.status === 'reviewed').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    interviewed: applications.filter((a) => a.status === 'interviewed').length,
    offered: applications.filter((a) => a.status === 'offered').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <h1 className="text-3xl font-black mb-2">ALL APPLICATIONS</h1>
        <div className="flex items-center gap-3">
          <div className="meta-line"></div>
          <span className="meta-text">
            {applications.length} TOTAL APPLICATIONS ACROSS {jobs.length} JOBS
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`card text-center p-4 transition-all hover:border-gray-400 ${
              statusFilter === status ? 'border-black shadow-lg' : ''
            }`}
          >
            <p className="text-2xl font-black text-black">{count}</p>
            <p className="text-xs font-mono uppercase text-gray-600 mt-1">
              {status === 'all' ? 'Total' : status}
            </p>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search candidates, emails, jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-200 font-semibold"
            />
          </div>

          {/* Job Filter */}
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black font-semibold focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-200"
          >
            <option value="all">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'match')}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black font-semibold focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-200"
          >
            <option value="date">Sort by Date</option>
            <option value="match">Sort by Match</option>
          </select>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 font-black uppercase text-sm"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Status Filters - Inline */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-mono uppercase text-gray-600 mb-3">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected'].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-black uppercase transition-all border ${
                      statusFilter === status
                        ? status === 'all'
                          ? 'bg-black text-white border-black'
                          : getStatusColor(status)
                        : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
                    }`}
                  >
                    {status} ({statusCounts[status as keyof typeof statusCounts]})
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 font-mono text-sm uppercase">
          Showing {paginatedApplications.length} of {filteredApplications.length} applications
        </p>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {paginatedApplications.length === 0 ? (
          <div className="card text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-black font-black text-lg mb-2">NO APPLICATIONS FOUND</p>
            <p className="text-gray-500 text-sm font-mono">
              {applications.length === 0
                ? 'No applications have been received yet'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          paginatedApplications.map((application) => (
            <div
              key={application.id}
              className="card hover:border-gray-400 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Candidate Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                    {application.candidate_name?.charAt(0).toUpperCase() || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-black text-black truncate">
                        {application.candidate_name || 'Unknown Candidate'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase border flex items-center gap-1 ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {getStatusIcon(application.status)}
                        {application.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Mail size={14} />
                        <span className="font-semibold truncate">{application.candidate_email}</span>
                      </div>
                      {application.candidate_phone && (
                        <div className="flex items-center gap-1">
                          <Phone size={14} />
                          <span className="font-semibold">{application.candidate_phone}</span>
                        </div>
                      )}
                      {application.candidate_location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span className="font-semibold">{application.candidate_location}</span>
                        </div>
                      )}
                    </div>

                    {/* Job Info */}
                    <Link
                      href={`/employer/jobs/${application.job_id}`}
                      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
                    >
                      <Briefcase size={14} />
                      <span className="font-semibold">{application.job_title}</span>
                      {application.job?.location && (
                        <>
                          <span className="text-gray-400">|</span>
                          <span>{application.job.location}</span>
                        </>
                      )}
                    </Link>
                  </div>
                </div>

                {/* Match Score & Date */}
                <div className="flex items-center gap-6 lg:flex-shrink-0">
                  {/* Match Score */}
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star className={getMatchColor(application.matching_score || 0)} size={18} fill="currentColor" />
                      <span className={`text-2xl font-black ${getMatchColor(application.matching_score || 0)}`}>
                        {Math.round(application.matching_score || 0)}%
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-500 uppercase">Match</p>
                  </div>

                  {/* Applied Date */}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">
                      {formatDate(application.applied_at)}
                    </p>
                    <p className="text-xs font-mono text-gray-500 uppercase">Applied</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 lg:flex-shrink-0">
                  <button
                    onClick={() => {
                      setSelectedApplication(application);
                      setShowModal(true);
                    }}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-black uppercase"
                  >
                    View
                  </button>

                  {application.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(application.id, 'shortlisted')}
                        className="px-4 py-2 bg-purple-100 text-purple-800 border border-purple-200 rounded-lg hover:bg-purple-200 transition-all text-sm font-black uppercase"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleStatusChange(application.id, 'rejected')}
                        className="px-4 py-2 bg-red-100 text-red-800 border border-red-200 rounded-lg hover:bg-red-200 transition-all text-sm font-black uppercase"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {application.status === 'shortlisted' && (
                    <button
                      onClick={() => handleStatusChange(application.id, 'interviewed')}
                      className="px-4 py-2 bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg hover:bg-cyan-200 transition-all text-sm font-black uppercase"
                    >
                      Interview
                    </button>
                  )}

                  {application.status === 'interviewed' && (
                    <button
                      onClick={() => handleStatusChange(application.id, 'offered')}
                      className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-lg hover:bg-green-200 transition-all text-sm font-black uppercase"
                    >
                      Offer
                    </button>
                  )}
                </div>
              </div>

              {/* Match Details */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                {application.experience_match && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 text-xs rounded font-black uppercase">
                    Experience Match
                  </span>
                )}
                {application.location_match && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs rounded font-black uppercase">
                    Location Match
                  </span>
                )}
                <span className="text-xs font-mono text-gray-500">
                  Skill Match: {Math.round(application.skill_match_percentage || 0)}%
                </span>
              </div>
            </div>
          ))
        )}
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

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg font-black transition-all duration-200 ${
                  currentPage === pageNum
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200 text-black hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Application Detail Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-black mb-2">
                  {selectedApplication.candidate_name?.toUpperCase()}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">{selectedApplication.candidate_email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedApplication(null);
                }}
                className="text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Candidate Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} />
                <span className="font-semibold">{selectedApplication.candidate_email}</span>
              </div>
              {selectedApplication.candidate_phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} />
                  <span className="font-semibold">{selectedApplication.candidate_phone}</span>
                </div>
              )}
              {selectedApplication.candidate_location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={16} />
                  <span className="font-semibold">{selectedApplication.candidate_location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span className="font-semibold">Applied {formatDate(selectedApplication.applied_at)}</span>
              </div>
            </div>

            {/* Job Applied For */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs font-mono uppercase text-gray-600 mb-2">Applied For</p>
              <Link
                href={`/employer/jobs/${selectedApplication.job_id}`}
                className="text-lg font-black text-black hover:text-gray-700 transition-colors"
              >
                {selectedApplication.job_title}
              </Link>
              {selectedApplication.job && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedApplication.job.location} | {selectedApplication.job.employment_type}
                </p>
              )}
            </div>

            {/* Match Score */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs font-mono uppercase text-gray-600 mb-3">Match Analysis</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className={getMatchColor(selectedApplication.matching_score || 0)} size={24} fill="currentColor" />
                  <span className={`text-3xl font-black ${getMatchColor(selectedApplication.matching_score || 0)}`}>
                    {Math.round(selectedApplication.matching_score || 0)}%
                  </span>
                  <span className="text-gray-500 font-mono uppercase text-sm">Overall</span>
                </div>
                <div className="border-l border-gray-300 pl-6">
                  <span className="text-xl font-black text-gray-700">
                    {Math.round(selectedApplication.skill_match_percentage || 0)}%
                  </span>
                  <span className="text-gray-500 font-mono uppercase text-sm ml-2">Skills</span>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                {selectedApplication.experience_match && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 text-xs rounded font-black uppercase">
                    Experience Match
                  </span>
                )}
                {selectedApplication.location_match && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs rounded font-black uppercase">
                    Location Match
                  </span>
                )}
              </div>
            </div>

            {/* Cover Letter */}
            {selectedApplication.cover_letter && (
              <div className="mb-6">
                <h3 className="text-black font-black mb-3 flex items-center gap-2 text-sm uppercase">
                  <FileText size={18} />
                  Cover Letter
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedApplication.cover_letter}
                  </p>
                </div>
              </div>
            )}

            {/* Status Change */}
            <div className="mb-6">
              <h3 className="text-black font-black mb-3 text-sm uppercase">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {['pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected'].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedApplication.id, status)}
                      className={`px-4 py-2 rounded-lg text-sm font-black uppercase border transition-all ${
                        selectedApplication.status === status
                          ? getStatusColor(status)
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:text-black hover:border-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <a
                href={`mailto:${selectedApplication.candidate_email}`}
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-center font-black uppercase"
              >
                Send Email
              </a>
              {selectedApplication.resume_url && (
                <a
                  href={selectedApplication.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all font-black uppercase flex items-center gap-2"
                >
                  <Download size={16} />
                  Resume
                </a>
              )}
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedApplication(null);
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all font-black uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
