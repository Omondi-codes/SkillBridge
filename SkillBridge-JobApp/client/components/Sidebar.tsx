'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  userRole?: 'candidate' | 'employer';
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole = 'candidate' }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const candidateNavItems = [
    { name: 'Dashboard', href: '/candidate/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', href: '/candidate/jobs', icon: Briefcase },
    { name: 'Applications', href: '/candidate/applications', icon: FileText },
    { name: 'Resume', href: '/candidate/resume', icon: FileText },
    { name: 'Notifications', href: '/candidate/notifications', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const employerNavItems = [
    { name: 'Dashboard', href: '/employer/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', href: '/employer/jobs', icon: Briefcase },
    { name: 'Post Job', href: '/employer/jobs/create', icon: FileText },
    { name: 'Applications', href: '/employer/applications', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const navItems = userRole === 'candidate' ? candidateNavItems : employerNavItems;

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-black flex items-center justify-center">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <div>
            <h1 className="text-xl font-black">SKILLBRIDGE</h1>
            <p className="text-xs font-mono text-gray-500">CONNECT & GROW</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 font-semibold text-sm
                ${isActive
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }
              `}
              onClick={() => setIsOpen(false)}
            >
              <Icon size={20} />
              <span>{item.name.toUpperCase()}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-red-600 hover:bg-red-50 font-semibold text-sm
            transition-all duration-200
          "
        >
          <LogOut size={20} />
          <span>LOGOUT</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col shadow-xl
        `}
      >
        <NavContent />
      </aside>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30">
        <NavContent />
      </aside>
    </>
  );
};
