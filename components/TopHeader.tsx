'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Plus, ChevronRight, UserCircle, LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

interface TopHeaderProps {
  onOpenMobile: () => void;
  user?: {
    name?: string;
    username?: string;
  } | null;
}

export function TopHeader({ onOpenMobile, user }: TopHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/') return 'Candidates Dashboard';
    if (pathname.startsWith('/add')) return 'Add New Candidate';
    if (pathname.startsWith('/edit')) return 'Edit Candidate Record';
    return 'Travel Data Management';
  };

  const getBreadcrumb = () => {
    if (pathname === '/') return null;
    if (pathname.startsWith('/add')) return 'Add Candidate';
    if (pathname.startsWith('/edit')) return 'Edit Candidate';
    return null;
  };

  const breadcrumb = getBreadcrumb();
  const displayName = user?.name || user?.username || 'User';

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left side: Mobile menu toggle + breadcrumbs / title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/"
            className="hover:text-indigo-600 font-medium transition-colors hidden sm:inline"
          >
            Dashboard
          </Link>
          {breadcrumb && (
            <>
              <ChevronRight className="h-4 w-4 text-slate-400 hidden sm:inline" />
              <span className="font-semibold text-slate-900 truncate">
                {breadcrumb}
              </span>
            </>
          )}
          {!breadcrumb && (
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h1>
          )}
        </div>
      </div>

      {/* Right side: Quick actions & profile */}
      <div className="flex items-center gap-3">
        {pathname !== '/add' && (
          <Link
            href="/add"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Candidate</span>
          </Link>
        )}

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
            {(displayName[0] || 'U').toUpperCase()}
          </div>
          <span className="text-xs sm:text-sm font-medium text-slate-700 hidden md:inline truncate max-w-[120px]">
            {displayName}
          </span>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
