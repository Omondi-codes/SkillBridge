'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Eye,
  CheckCircle,
  Calendar,
  Award,
  XCircle,
  FileText,
  MapPin,
  Briefcase,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import api from '@/lib/api';

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  company_logo: string | null;
  company_website: string | null;
  company_description: string | null;
  location: string;
  salary_range: string;
  employment_type: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected' | 'withdrawn';
  applied_date: string;
  updated_date: string;
  cover_letter: string;
  timeline: TimelineEvent[];
}

interface TimelineEvent {
  status: string;
  date: string;
  description: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (appId: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This cannot be undone.')) return;
    try {
      setWithdrawing(appId);
      await api.post(`/matching/application/${appId}/withdraw`);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: 'withdrawn' as Application['status'] } : a))
      );
    } catch (error) {
      console.error('Withdraw error:', error);
      alert('Failed to withdraw application. Please try again.');
    } finally {
      setWithdrawing(null);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matching/applications');
      const responseData = response.data.data || {};
      const applicationsData = responseData.applications || [];

      // Map backend data to frontend structure
      const mappedApplications = applicationsData.map((app: Record<string, unknown>) => {
        const job = app.job as Record<string, unknown> | undefined;

        return {
          id: app.id,
          job_id: app.job_id,
          job_title: job?.title as string || 'Unknown Position',
          company: job?.company_name as string || 'Unknown Company',
          company_logo: (job?.company_logo ?? (job?.employer as Record<string, unknown>)?.company_logo) as string | null || null,
          company_website: (job?.company_website ?? (job?.employer as Record<string, unknown>)?.company_website) as string | null || null,
          company_description: ((job?.employer as Record<string, unknown>)?.company_description) as string | null || null,
          location: job?.location as string || 'Remote',
          salary_range: job?.salary_min && job?.salary_max
            ? `${job.salary_currency || 'KES'} ${job.salary_min} - ${job.salary_max}`
            : 'Not specified',
          employment_type: job?.employment_type as string || 'Full-time',
          status: app.status as string || 'pending',
          applied_date: app.applied_at as string || new Date().toISOString(),
          updated_date: app.updated_at as string || app.applied_at as string || new Date().toISOString(),
          cover_letter: app.cover_letter as string || 'No cover letter provided',
          timeline: generateTimeline(app),
        };
      });

      setApplications(mappedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeline = (app: Record<string, unknown>) => {
    const timeline: TimelineEvent[] = [];

    timeline.push({
      status: 'Applied',
      date: (app.applied_at as string) || (app.created_at as string) || '',
      description: 'Application submitted successfully',
    });

    if (app.status === 'reviewed' || app.status === 'shortlisted' || app.status === 'interviewed' || app.status === 'offered') {
      timeline.push({
        status: 'Reviewed',
        date: (app.updated_at as string) || (app.created_at as string) || '',
        description: 'Your application is under review by the hiring team',
      });
    }

    if (app.status === 'shortlisted' || app.status === 'interviewed' || app.status === 'offered') {
      timeline.push({
        status: 'Shortlisted',
        date: (app.updated_at as string) || (app.created_at as string) || '',
        description: 'You have been shortlisted for interview',
      });
    }

    if (app.status === 'interviewed' || app.status === 'offered') {
      timeline.push({
        status: 'Interviewed',
        date: (app.updated_at as string) || (app.created_at as string) || '',
        description: 'Interview completed',
      });
    }

    if (app.status === 'offered') {
      timeline.push({
        status: 'Offered',
        date: (app.updated_at as string) || (app.created_at as string) || '',
        description: 'Job offer extended',
      });
    }

    if (app.status === 'rejected') {
      timeline.push({
        status: 'Rejected',
        date: (app.updated_at as string) || (app.created_at as string) || '',
        description: 'Application not selected at this time',
      });
    }

    return timeline;
  };

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const filteredApplications = statusFilter
    ? applications.filter((app) => app.status === statusFilter)
    : applications;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      pending: { bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400', icon: Clock },
      reviewed: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', icon: Eye },
      shortlisted: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', icon: CheckCircle },
      interviewed: { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-400', icon: Calendar },
      offered: { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400', icon: Award },
      rejected: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', icon: XCircle },
      withdrawn: { bg: 'bg-zinc-500/10 border-zinc-500/20', text: 'text-zinc-400', icon: XCircle },
    };
    return configs[status] || configs.pending;
  };

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${config.bg} ${config.text} text-xs font-medium`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    reviewed: applications.filter((a) => a.status === 'reviewed').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    interviewed: applications.filter((a) => a.status === 'interviewed').length,
    offered: applications.filter((a) => a.status === 'offered').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
    withdrawn: applications.filter((a) => a.status === 'withdrawn').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Status Filter Tabs */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              statusFilter === ''
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
            }`}
          >
            ALL ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              statusFilter === 'pending'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
            }`}
          >
            PENDING ({statusCounts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('reviewed')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              statusFilter === 'reviewed'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
            }`}
          >
            REVIEWED ({statusCounts.reviewed})
          </button>
          <button
            onClick={() => setStatusFilter('shortlisted')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              statusFilter === 'shortlisted'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
            }`}
          >
            SHORTLISTED ({statusCounts.shortlisted})
          </button>
          <button
            onClick={() => setStatusFilter('interviewed')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              statusFilter === 'interviewed'
                ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
            }`}
          >
            INTERVIEWED ({statusCounts.interviewed})
          </button>
          <button
            onClick={() => setStatusFilter('offered')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              statusFilter === 'offered'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
            }`}
          >
            OFFERED ({statusCounts.offered})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              statusFilter === 'rejected'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
            }`}
          >
            REJECTED ({statusCounts.rejected})
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((app) => (
          <div
            key={app.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-200"
          >
            {/* Application Header */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xl">
                      {app.company.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">{app.job_title}</h3>
                    <p className="text-zinc-400 text-sm">{app.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(app.status)}
                  <button
                    onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all duration-200"
                  >
                    {expandedApp === app.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <MapPin size={16} />
                  <span>{app.location}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Briefcase size={16} />
                  <span>{app.employment_type}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <DollarSign size={16} />
                  <span>{app.salary_range}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Applied: {new Date(app.applied_date).toLocaleDateString()}</span>
                <span>Updated: {new Date(app.updated_date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedApp === app.id && (
              <div className="border-t border-zinc-800 p-6 bg-zinc-800/30">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Timeline */}
                  <div>
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Calendar size={18} />
                      Application Timeline
                    </h4>
                    <div className="space-y-4">
                      {app.timeline.map((event, index) => {
                        const config = getStatusConfig(event.status.toLowerCase());
                        const Icon = config.icon;
                        const isLast = index === app.timeline.length - 1;

                        return (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`p-2 rounded-lg ${config.bg} ${config.text}`}>
                                <Icon size={16} />
                              </div>
                              {!isLast && (
                                <div className="w-0.5 h-full bg-zinc-700 my-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-white font-medium text-sm mb-1">{event.status}</p>
                              <p className="text-zinc-400 text-xs mb-1">{event.description}</p>
                              <p className="text-zinc-500 text-xs">
                                {new Date(event.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <FileText size={18} />
                      Cover Letter
                    </h4>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                      <p className="text-zinc-300 text-sm leading-relaxed">{app.cover_letter}</p>
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="mt-6 bg-zinc-900 border border-zinc-700 rounded-xl p-5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Briefcase size={18} />
                    Company Details
                  </h4>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                      {app.company_logo ? (
                        <img src={app.company_logo} alt={app.company} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-2xl">{app.company.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-base">{app.company}</p>
                      {app.location && (
                        <p className="text-zinc-400 text-sm flex items-center gap-1 mt-1">
                          <MapPin size={13} />
                          {app.location}
                        </p>
                      )}
                      {app.company_description && (
                        <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{app.company_description}</p>
                      )}
                      {app.company_website && (
                        <a
                          href={app.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm mt-2 transition-colors"
                        >
                          <ExternalLink size={13} />
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <a
                    href={`/candidate/jobs/${app.job_id}`}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    View Job Posting
                  </a>
                  {!['withdrawn', 'rejected', 'offered'].includes(app.status) && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      disabled={withdrawing === app.id}
                      className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg hover:bg-red-900/40 hover:border-red-700 hover:text-red-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawing === app.id ? 'Withdrawing...' : 'Withdraw Application'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="text-zinc-400" size={32} />
            </div>
            <h3 className="text-white font-semibold mb-2">No applications found</h3>
            <p className="text-zinc-400 text-sm">
              {statusFilter ? `No applications with status: ${statusFilter}` : 'Start applying to jobs to see them here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
 