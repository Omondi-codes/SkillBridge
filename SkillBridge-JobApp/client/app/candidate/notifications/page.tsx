'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Star,
  Briefcase,
  CheckCheck,
  Trash2,
  Filter,
} from 'lucide-react';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  application_id?: string;
  job_id?: string;
  metadata?: {
    status?: string;
    job_title?: string;
    company_name?: string;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'unread' ? '?unread_only=true' : '';
      const response = await api.get(`/notifications${params}`);
      const data = response.data.data || {};
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setTotal(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setTotal(0);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'shortlisted':
        return <Star className="text-purple-600" size={20} />;
      case 'interviewed':
        return <Calendar className="text-cyan-600" size={20} />;
      case 'offered':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-600" size={20} />;
      case 'reviewed':
        return <Clock className="text-blue-600" size={20} />;
      default:
        return <Bell className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'interviewed':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'offered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">NOTIFICATIONS</h1>
          <div className="flex items-center gap-3">
            <div className="meta-line"></div>
            <span className="meta-text">
              {unreadCount} UNREAD OF {total} TOTAL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-black uppercase flex items-center gap-2"
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-100 text-red-800 border border-red-200 rounded-lg hover:bg-red-200 transition-all text-sm font-black uppercase flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-black uppercase transition-all ${
                filter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-black'
              }`}
            >
              All ({total})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-black uppercase transition-all ${
                filter === 'unread'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-black'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="card text-center py-16">
            <Bell size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-black font-black text-xl mb-2">NO NOTIFICATIONS</p>
            <p className="text-gray-500 text-sm font-mono">
              {filter === 'unread'
                ? "You're all caught up!"
                : "You don't have any notifications yet"}
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card hover:border-gray-400 hover:shadow-lg transition-all duration-300 ${
                !notification.is_read ? 'border-l-4 border-l-red-600 bg-red-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-3 bg-gray-100 rounded-lg flex-shrink-0">
                  {getStatusIcon(notification.metadata?.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-black text-black">{notification.title}</h3>
                    {notification.metadata?.status && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getStatusColor(
                          notification.metadata.status
                        )}`}
                      >
                        {notification.metadata.status}
                      </span>
                    )}
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-gray-600 mb-2">{notification.message}</p>

                  {notification.metadata?.company_name && (
                    <p className="text-gray-500 text-sm flex items-center gap-2 mb-2">
                      <Briefcase size={14} />
                      {notification.metadata.company_name}
                    </p>
                  )}

                  <p className="text-gray-400 text-xs font-mono">{formatTime(notification.created_at)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Mark as read"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* View Application Link */}
              {notification.type === 'application_status' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href="/candidate/applications"
                    className="text-sm font-black text-black hover:text-red-600 transition-colors uppercase"
                  >
                    View Application →
                  </Link>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
