'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary: {
    min: number;
    max: number;
  };
  status: 'active' | 'closed' | 'draft';
  applicationsCount: number;
  viewsCount: number;
  postedDate: string;
  deadline: string;
  skills: string[];
}

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'draft'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jobs/my-jobs');
      const responseData = response.data.data || {};
      const jobsData = Array.isArray(responseData) ? responseData : (responseData.items || responseData.jobs || []);

      // Map backend data to frontend structure
      const mappedJobs = jobsData.map((job: Record<string, unknown>) => ({
        id: job.id as string,
        title: job.title as string,
        description: (job.description as string) || '',
        location: (job.location as string) || 'Remote',
        type: (job.employment_type as 'full-time' | 'part-time' | 'contract' | 'internship') || 'full-time',
        salary: {
          min: (job.salary_min as number) || 0,
          max: (job.salary_max as number) || 0,
        },
        status: (job.status as 'active' | 'closed' | 'draft') || 'active',
        applicationsCount: (job.applications_count as number) || 0,
        viewsCount: (job.views_count as number) || 0,
        postedDate: (job.posted_at as string) || (job.created_at as string) || new Date().toISOString(),
        deadline: (job.application_deadline as string) || '',
        skills: (job.required_skills as string[]) || [],
      }));

      setJobs(mappedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job posting');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200 font-black';
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200 font-black';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 font-black';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 font-black';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time':
        return 'bg-blue-100 text-blue-800 border border-blue-200 font-black';
      case 'part-time':
        return 'bg-purple-100 text-purple-800 border border-purple-200 font-black';
      case 'contract':
        return 'bg-pink-100 text-pink-800 border border-pink-200 font-black';
      case 'internship':
        return 'bg-orange-100 text-orange-800 border border-orange-200 font-black';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200 font-black';
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (jobId: string, newStatus: Job['status']) => {
    try {
      await api.patch(`/jobs/${jobId}`, { status: newStatus });
      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );
      setShowActionMenu(null);
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">MANAGE JOBS</h1>
          <div className="flex items-center gap-3">
            <div className="meta-line"></div>
            <span className="meta-text">ALL JOB POSTINGS</span>
          </div>
        </div>
        <Link
          href="/employer/jobs/create"
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-black uppercase text-sm"
        >
          <Plus size={20} />
          Create New Job
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card rounded-lg p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
              size={20}
            />
            <input
              type="text"
              placeholder="Search jobs by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'closed' | 'draft')}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black hover:border-red-600 transition-all duration-200"
            >
              <Filter size={20} />
              Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-black">
              {jobs.filter((j) => j.status === 'active').length}
            </p>
            <p className="text-gray-600 text-sm">Active Jobs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-black">
              {jobs.reduce((sum, job) => sum + job.applicationsCount, 0)}
            </p>
            <p className="text-gray-600 text-sm">Total Applications</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-black">
              {jobs.reduce((sum, job) => sum + job.viewsCount, 0)}
            </p>
            <p className="text-gray-600 text-sm">Total Views</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-black">
              {jobs.filter((j) => j.status === 'draft').length}
            </p>
            <p className="text-gray-600 text-sm">Drafts</p>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="card rounded-lg p-12 border border-gray-200 text-center">
            <p className="text-gray-600 text-lg">No jobs found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="card rounded-lg p-6 border border-gray-200 hover:border-red-600/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/employer/jobs/${job.id}`}>
                          <h3 className="text-xl font-bold text-black hover:text-red-600 transition-colors cursor-pointer">
                            {job.title}
                          </h3>
                        </Link>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status.charAt(0).toUpperCase() +
                            job.status.slice(1)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                            job.type
                          )}`}
                        >
                          {job.type
                            .split('-')
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2">
                        {job.description}
                      </p>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowActionMenu(
                            showActionMenu === job.id ? null : job.id
                          )
                        }
                        className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {showActionMenu === job.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-gray-50 border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                            <Link
                              href={`/jobs/${job.id}/edit`}
                              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
                            >
                              <Edit size={16} />
                              Edit Job
                            </Link>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  job.id,
                                  job.status === 'active' ? 'closed' : 'active'
                                )
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
                            >
                              <Eye size={16} />
                              {job.status === 'active'
                                ? 'Close Job'
                                : 'Activate Job'}
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={16} />
                              Delete Job
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin size={16} />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      KES {job.salary.min.toLocaleString()} - KES {job.salary.max.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar size={16} />
                      Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-red-600" />
                      <span className="text-black font-semibold">
                        {job.applicationsCount}
                      </span>
                      <span className="text-gray-600 text-sm">
                        Applications
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye size={16} className="text-blue-400" />
                      <span className="text-black font-semibold">
                        {job.viewsCount}
                      </span>
                      <span className="text-gray-600 text-sm">Views</span>
                    </div>
                    <div className="text-gray-500 text-sm">
                      Posted {new Date(job.postedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
