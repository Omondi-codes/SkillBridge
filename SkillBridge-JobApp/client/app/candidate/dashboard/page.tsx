'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Calendar,
  Eye,
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import api from '@/lib/api';
import { DeconstructedCard } from '@/components/Card';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  gradient: 'red' | 'cyan' | 'yellow' | 'green' | 'blue' | 'dark-blue';
}

interface Application {
  id: string;
  job_title: string;
  company: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected';
  applied_at: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range: string;
  match_percentage: number;
  posted_date: string;
}

export default function CandidateDashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: 'APPLICATIONS',
      value: '0',
      change: 'SUBMITTED',
      icon: Briefcase,
      gradient: 'red',
    },
    {
      title: 'INTERVIEWS',
      value: '0',
      change: 'SCHEDULED',
      icon: Calendar,
      gradient: 'cyan',
    },
    {
      title: 'PROFILE',
      value: '0',
      change: 'VIEWS',
      icon: Eye,
      gradient: 'blue',
    },
    {
      title: 'MATCHES',
      value: '0',
      change: 'FOUND',
      icon: Heart,
      gradient: 'dark-blue',
    },
  ]);

  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch applications
      const applicationsRes = await api.get('/matching/applications');
      const applications = applicationsRes.data.data?.applications || [];

      // Fetch AI-matched recommended jobs
      const jobsRes = await api.get('/matching/jobs?limit=3');
      const matchedJobs = jobsRes.data.data?.matches || [];

      // Extract job details from matches
      const jobs = matchedJobs.map((match: Record<string, unknown>) => {
        const job = (match.job as Record<string, unknown>) || {};
        const matching = match.matching as Record<string, unknown> | undefined;
        return {
          ...job,
          match_percentage: Math.round(((matching?.overall_score as number) || 0) * 100),
        };
      });

      // Calculate stats from applications
      const totalApplications = applications.length;
      const interviewedCount = applications.filter((app: Application) =>
        ['interviewed', 'offered'].includes(app.status)
      ).length;

      // Update stats
      setStats([
        {
          ...stats[0],
          value: totalApplications.toString(),
          change: `+${totalApplications} THIS MONTH`,
        },
        {
          ...stats[1],
          value: interviewedCount.toString(),
          change: 'SCHEDULED',
        },
        {
          ...stats[2],
          value: '127',
          change: 'VIEWS THIS WEEK',
        },
        {
          ...stats[3],
          value: jobs.length.toString(),
          change: 'FOUND',
        },
      ]);

      setRecentApplications(applications.slice(0, 5));
      setRecommendedJobs(jobs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewed':
        return <Eye className="w-4 h-4" />;
      case 'shortlisted':
      case 'offered':
        return <CheckCircle className="w-4 h-4" />;
      case 'interviewed':
        return <Calendar className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewed':
        return 'info';
      case 'shortlisted':
      case 'offered':
        return 'success';
      case 'interviewed':
        return 'primary';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="animate-fadeIn">
        <h1 className="text-4xl font-black mb-2" style={{ letterSpacing: '-0.02em' }}>
          DASHBOARD
        </h1>
        <div className="flex items-center gap-3">
          <div className="meta-line"></div>
          <p className="meta-text">CANDIDATE OVERVIEW</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <DeconstructedCard
              key={index}
              gradient={stat.gradient}
              className="h-64 w-full animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="card-layer card-content relative z-20 p-6 flex flex-col justify-between h-full text-white">
                <div className="content-fragment fragment-meta">
                  <div className="meta-line bg-white"></div>
                  <span className="meta-text text-white/80">{stat.change}</span>
                </div>

                <div className="content-fragment fragment-heading">
                  <h2 className="content-text text-white">{stat.title}</h2>
                  <h3 className="content-subtext text-white/70">{stat.value}</h3>
                </div>

                <div className="content-fragment">
                  <Icon className="w-8 h-8 text-white/60" />
                </div>
              </div>
            </DeconstructedCard>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="card animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-2xl font-black mb-2">RECENT APPLICATIONS</h2>
            <div className="flex items-center gap-3">
              <div className="meta-line"></div>
              <span className="meta-text">LAST 5 APPLICATIONS</span>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500 font-mono text-sm">LOADING...</p>
            ) : recentApplications.length > 0 ? (
              recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-black transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{app.job_title}</h3>
                      <p className="text-sm text-gray-600 font-mono">{app.company}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(app.status)}
                      <span className="text-xs font-mono uppercase">{app.status}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 font-mono mb-4">NO APPLICATIONS YET</p>
                <Link href="/candidate/jobs">
                  <button className="btn-accent">BROWSE JOBS</button>
                </Link>
              </div>
            )}
          </div>

          {recentApplications.length > 0 && (
            <Link href="/candidate/applications">
              <div className="cta-link mt-6">
                <div className="cta-box"></div>
                <span className="cta-text">VIEW ALL APPLICATIONS</span>
              </div>
            </Link>
          )}
        </div>

        {/* Recommended Jobs */}
        <div className="card animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-2xl font-black mb-2">RECOMMENDED JOBS</h2>
            <div className="flex items-center gap-3">
              <div className="meta-line"></div>
              <span className="meta-text">BASED ON YOUR PROFILE</span>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500 font-mono text-sm">LOADING...</p>
            ) : recommendedJobs.length > 0 ? (
              recommendedJobs.map((job) => (
                <Link key={job.id} href={`/candidate/jobs/${job.id}`}>
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-black transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 group-hover:text-red-600 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono">{job.company}</p>
                      </div>
                      {job.match_percentage && (
                        <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-mono text-xs font-bold">
                            {job.match_percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.salary_range}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 font-mono mb-4">NO RECOMMENDATIONS YET</p>
                <Link href="/candidate/resume">
                  <button className="btn-accent">UPLOAD RESUME</button>
                </Link>
              </div>
            )}
          </div>

          {recommendedJobs.length > 0 && (
            <Link href="/candidate/jobs">
              <div className="cta-link mt-6">
                <div className="cta-box"></div>
                <span className="cta-text">BROWSE ALL JOBS</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
