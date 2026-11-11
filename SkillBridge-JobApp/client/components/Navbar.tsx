'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, User, ChevronDown, Check, CheckCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    status?: string;
    job_title?: string;
    company_name?: string;
  };
}

interface NavbarProps {
  userName?: string;
  userEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  userName = 'User',
  userEmail = 'user@example.com',
}) => {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved === 'dark' || (!saved && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.data?.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await api.get('/notifications?limit=10');
      setNotifications(response.data.data?.notifications || []);
      setUnreadCount(response.data.data?.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        setNotifications(notifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    if (notification.type === 'application_status' && notification.metadata?.job_title) {
      setShowNotifications(false);
      router.push('/candidate/applications');
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

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/login');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800';
      case 'interviewed':
        return 'bg-cyan-100 text-cyan-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : userName;
  const displayEmail = user?.email || userEmail;

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-64 h-16 z-20" style={{ backgroundColor: 'var(--color-nav-bg)', borderBottom: '1px solid var(--color-nav-border)' }}>
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search jobs, companies, skills..."
              className="
                w-full bg-white border border-gray-200 rounded-lg
                pl-10 pr-4 py-2 text-black placeholder-gray-400
                focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4 ml-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
                if (!showNotifications) {
                  fetchNotifications();
                }
              }}
              className="relative p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-black text-sm">NOTIFICATIONS</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-mono text-gray-600 hover:text-black flex items-center gap-1"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-black mx-auto"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notif.is_read ? 'bg-red-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-black text-sm font-semibold">{notif.title}</p>
                              {notif.metadata?.status && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(notif.metadata.status)}`}>
                                  {notif.metadata.status}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs">{notif.message}</p>
                            {notif.metadata?.company_name && (
                              <p className="text-gray-500 text-xs mt-1">at {notif.metadata.company_name}</p>
                            )}
                            <p className="text-gray-400 text-xs mt-1 font-mono">{formatTime(notif.created_at)}</p>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2 h-2 bg-red-600 rounded-full mt-1 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 text-center border-t border-gray-200">
                  <Link
                    href="/candidate/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-red-600 text-xs font-mono font-semibold hover:text-red-700 transition-colors"
                  >
                    VIEW ALL NOTIFICATIONS
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-black text-sm font-semibold">{displayName}</p>
                <p className="text-gray-500 text-xs font-mono">{displayEmail}</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-bold text-sm">{displayName}</p>
                  <p className="text-gray-500 text-xs font-mono">{displayEmail}</p>
                </div>
                <div className="py-2">
                  <a
                    href="/profile"
                    className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    PROFILE SETTINGS
                  </a>
                  <a
                    href="/settings"
                    className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    ACCOUNT SETTINGS
                  </a>
                  <a
                    href="/help"
                    className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    HELP & SUPPORT
                  </a>
                </div>
                <div className="border-t border-gray-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    LOGOUT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </nav>
  );
};
