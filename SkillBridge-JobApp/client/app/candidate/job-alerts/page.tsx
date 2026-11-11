'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface JobAlert {
  id: string;
  keywords: string[];
  location: string | null;
  category: string | null;
  employment_type: string | null;
  experience_level: string | null;
  min_salary: number | null;
  remote_only: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  is_active: boolean;
  created_at: string;
  last_sent_at: string | null;
}

export default function JobAlertsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    keywords: '',
    location: '',
    category: '',
    employment_type: '',
    experience_level: '',
    min_salary: '',
    remote_only: false,
    frequency: 'instant' as 'instant' | 'daily' | 'weekly'
  });

  useEffect(() => {
    if (!user || user.role !== 'candidate') {
      router.push('/login');
      return;
    }

    fetchAlerts();
  }, [user, router]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/job-alerts');
      const data = response.data.data;
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k);

      await api.post('/job-alerts', {
        keywords,
        location: formData.location || null,
        category: formData.category || null,
        employment_type: formData.employment_type || null,
        experience_level: formData.experience_level || null,
        min_salary: formData.min_salary ? parseInt(formData.min_salary) : null,
        remote_only: formData.remote_only,
        frequency: formData.frequency
      });

      // Reset form
      setFormData({
        keywords: '',
        location: '',
        category: '',
        employment_type: '',
        experience_level: '',
        min_salary: '',
        remote_only: false,
        frequency: 'instant'
      });

      setShowCreateForm(false);
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create job alert');
    }
  };

  const handleToggleAlert = async (alertId: string) => {
    try {
      await api.post(`/job-alerts/${alertId}/toggle`);
      fetchAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await api.delete(`/job-alerts/${alertId}`);
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black mx-auto"></div>
          <p className="text-gray-600 mt-4 font-mono">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black">JOB ALERTS</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary"
          >
            {showCreateForm ? 'CANCEL' : 'CREATE ALERT'}
          </button>
        </div>

        {/* Create Alert Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border-2 border-black">
            <h2 className="text-xl font-black mb-4">CREATE NEW ALERT</h2>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-black mb-2">
                  KEYWORDS (comma-separated) *
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="input-field"
                  placeholder="e.g. React, TypeScript, Frontend"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black mb-2">LOCATION</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Nairobi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black mb-2">CATEGORY</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Categories</option>
                    <option value="software_development">Software Development</option>
                    <option value="data_science">Data Science</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black mb-2">EMPLOYMENT TYPE</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Any Type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black mb-2">MIN SALARY (KES)</label>
                  <input
                    type="number"
                    value={formData.min_salary}
                    onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 100000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black mb-2">FREQUENCY</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'instant' | 'daily' | 'weekly' })}
                    className="input-field"
                  >
                    <option value="instant">Instant (when job is posted)</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.remote_only}
                      onChange={(e) => setFormData({ ...formData, remote_only: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="font-black text-sm">REMOTE ONLY</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                CREATE ALERT
              </button>
            </form>
          </div>
        )}

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border-2 border-black">
              <p className="text-gray-600 font-black">NO JOB ALERTS YET</p>
              <p className="text-sm text-gray-500 mt-2">
                Create an alert to get notified when matching jobs are posted
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-lg p-6 border-2 border-black shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-black">
                        {alert.keywords.length > 0
                          ? alert.keywords.join(', ')
                          : 'General Alert'}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-black rounded ${
                          alert.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {alert.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {alert.location && (
                        <span className="font-black">📍 {alert.location}</span>
                      )}
                      {alert.employment_type && (
                        <span className="font-black">💼 {alert.employment_type}</span>
                      )}
                      {alert.min_salary && (
                        <span className="font-black">💰 Min: KES {alert.min_salary}</span>
                      )}
                      {alert.remote_only && (
                        <span className="font-black">🏠 Remote Only</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Frequency: {alert.frequency} • Created: {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAlert(alert.id)}
                      className={`px-4 py-2 font-black text-sm rounded transition-colors ${
                        alert.is_active
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {alert.is_active ? 'PAUSE' : 'ACTIVATE'}
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-black text-sm rounded transition-colors"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
