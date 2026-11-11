'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  UserCheck,
  CheckCircle,
  TrendingUp,
  Clock,
  Star,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '@/lib/api';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendUp,
}) => {
  return (
    <div className="card hover:border-gray-400 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-black rounded-lg">
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-black ${
              trendUp ? 'text-green-700' : 'text-red-700'
            }`}
          >
            <TrendingUp
              size={16}
              className={trendUp ? '' : 'rotate-180'}
            />
            {trend}
          </div>
        )}
      </div>
      <h3 className="text-gray-500 text-xs font-mono uppercase tracking-wide mb-2">{title}</h3>
      <p className="text-black text-3xl font-black">{value}</p>
    </div>
  );
};

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  matchScore: number;
}

interface TopApplicant {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experience: string;
  matchScore: number;
  avatar?: string;
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    filledPositions: 0,
  });

  const [trends, setTrends] = useState({
    activeJobs: { change: 0, percentage: 0, trend_up: true },
    totalApplications: { change: 0, percentage: 0, trend_up: true },
    shortlisted: { change: 0, percentage: 0, trend_up: true },
    filledPositions: { change: 0, percentage: 0, trend_up: true },
  });

  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [topApplicants, setTopApplicants] = useState<TopApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobPerformanceData, setJobPerformanceData] = useState<Array<{month: string; applications: number; views: number}>>([]);
  const [applicationStatusData, setApplicationStatusData] = useState<Array<{name: string; count: number}>>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch employer jobs
      const jobsRes = await api.get('/jobs/my-jobs');
      const jobs = jobsRes.data.data || [];
      const activeJobs = jobs.filter((job: Record<string, unknown>) => job.status === 'active').length;

      // Fetch applications for employer's jobs
      const applicationsRes = await api.get('/matching/employer/applications');
      const applications = applicationsRes.data.data?.applications || [];

      // Calculate stats
      const totalApplications = applications.length;
      const shortlisted = applications.filter(
        (app: Record<string, unknown>) => app.status === 'shortlisted'
      ).length;
      const filledPositions = jobs.filter((job: Record<string, unknown>) => job.status === 'filled').length;

      setStats({
        activeJobs,
        totalApplications,
        shortlisted,
        filledPositions,
      });

      // Map raw backend docs → typed Application objects
      const mappedApplications: Application[] = applications.map((app: Record<string, unknown>) => ({
        id: app.id as string,
        candidateName: (app.candidate_name as string) || 'Unknown Candidate',
        candidateEmail: (app.candidate_email as string) || '',
        jobTitle: (app.job_title as string) || ((app.job as Record<string, unknown>)?.title as string) || 'Unknown Position',
        appliedDate: (app.applied_at as string) || new Date().toISOString(),
        status: (app.status as Application['status']) || 'pending',
        matchScore: Math.round((app.matching_score as number) || (app.skill_match_percentage as number) || 0),
      }));

      // Set recent applications (limit to 4)
      setRecentApplications(mappedApplications.slice(0, 4));

      // Extract top applicants (by match score)
      const topCandidates = [...mappedApplications]
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3)
        .map((app) => ({
          id: app.id,
          name: app.candidateName,
          email: app.candidateEmail,
          skills: (applications.find((r: Record<string, unknown>) => r.id === app.id)?.candidate_skills as string[]) || [],
          experience: 'N/A',
          matchScore: app.matchScore,
        }));

      setTopApplicants(topCandidates);

      // Calculate application status breakdown
      const statusCounts = applications.reduce((acc: Array<{name: string; count: number}>, app: Record<string, unknown>) => {
        const status = (app.status as string) || 'pending';
        const statusName = status.charAt(0).toUpperCase() + status.slice(1);
        const existing = acc.find((item: {name: string; count: number}) => item.name === statusName);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ name: statusName, count: 1 });
        }
        return acc;
      }, []);

      setApplicationStatusData(statusCounts);

      // Fetch trend data
      try {
        const trendsRes = await api.get('/analytics/dashboard/trends?days=7');
        const trendsData = trendsRes.data.data?.trends || {};

        setTrends({
          activeJobs: trendsData.active_jobs || { change: 0, percentage: 0, trend_up: true },
          totalApplications: trendsData.total_applications || { change: 0, percentage: 0, trend_up: true },
          shortlisted: trendsData.shortlisted || { change: 0, percentage: 0, trend_up: true },
          filledPositions: trendsData.filled_positions || { change: 0, percentage: 0, trend_up: true },
        });
      } catch (trendError) {
        console.error('Error fetching trends:', trendError);
        // Keep default trends if fetch fails
      }

      // Build job performance chart — applications + views per job (top 6)
      const jobsWithStats = (jobs as Record<string, unknown>[])
        .slice(0, 6)
        .map((job) => ({
          month: ((job.title as string) || 'Job').substring(0, 12),
          applications: applications.filter(
            (a: Record<string, unknown>) => a.job_id === job.id
          ).length,
          views: (job.views_count as number) || 0,
        }));
      setJobPerformanceData(jobsWithStats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shortlisted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-2">EMPLOYER DASHBOARD</h1>
          <div className="flex items-center gap-3">
            <div className="meta-line"></div>
            <span className="meta-text">OVERVIEW & ANALYTICS</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Jobs"
          value={stats.activeJobs}
          icon={<Briefcase className="text-white" size={24} />}
          trend={trends.activeJobs.change !== 0 ? `${trends.activeJobs.change > 0 ? '+' : ''}${trends.activeJobs.change}` : undefined}
          trendUp={trends.activeJobs.trend_up}
        />
        <StatsCard
          title="Total Applications"
          value={stats.totalApplications}
          icon={<Users className="text-white" size={24} />}
          trend={trends.totalApplications.change !== 0 ? `${trends.totalApplications.change > 0 ? '+' : ''}${trends.totalApplications.percentage}%` : undefined}
          trendUp={trends.totalApplications.trend_up}
        />
        <StatsCard
          title="Shortlisted"
          value={stats.shortlisted}
          icon={<UserCheck className="text-white" size={24} />}
          trend={trends.shortlisted.change !== 0 ? `${trends.shortlisted.change > 0 ? '+' : ''}${trends.shortlisted.change}` : undefined}
          trendUp={trends.shortlisted.trend_up}
        />
        <StatsCard
          title="Filled Positions"
          value={stats.filledPositions}
          icon={<CheckCircle className="text-white" size={24} />}
          trend={trends.filledPositions.change !== 0 ? `${trends.filledPositions.change > 0 ? '+' : ''}${trends.filledPositions.change}` : undefined}
          trendUp={trends.filledPositions.trend_up}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Performance Chart */}
        <div className="card">
          <h2 className="text-xl font-black mb-2">JOB PERFORMANCE</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="meta-line"></div>
            <span className="meta-text">APPLICATIONS & VIEWS</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={jobPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#000000"
                strokeWidth={3}
                dot={{ fill: '#000000', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#6b7280"
                strokeWidth={3}
                dot={{ fill: '#6b7280', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Application Status Chart */}
        <div className="card">
          <h2 className="text-xl font-black mb-2">APPLICATION STATUS</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="meta-line"></div>
            <span className="meta-text">STATUS BREAKDOWN</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={applicationStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="count"
                fill="#000000"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Applications and Top Applicants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="card rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">
              Recent Applications
            </h2>
            <Link href="/employer/applications" className="text-red-600 text-sm hover:text-red-700 transition-colors">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentApplications.map((application) => (
              <div
                key={application.id}
                className="p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-red-600/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-black font-semibold">
                      {application.candidateName}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {application.jobTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded">
                    <Star size={14} className="text-red-600" />
                    <span className="text-red-600 text-sm font-semibold">
                      {application.matchScore}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      application.status
                    )}`}
                  >
                    {application.status.charAt(0).toUpperCase() +
                      application.status.slice(1)}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock size={14} />
                    {new Date(application.appliedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Applicants */}
        <div className="card rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Top Applicants</h2>
            <Link href="/employer/applications" className="text-red-600 text-sm hover:text-red-700 transition-colors">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {topApplicants.map((applicant, index) => (
              <div
                key={applicant.id}
                className="p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-red-600/50 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <span className="text-black font-bold text-lg">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-black font-semibold">
                          {applicant.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {applicant.experience} experience
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded">
                        <Star size={14} className="text-red-600" />
                        <span className="text-red-600 text-sm font-semibold">
                          {applicant.matchScore}%
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {applicant.skills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {applicant.skills.length > 3 && (
                        <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded">
                          +{applicant.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
