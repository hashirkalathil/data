'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  Menu, 
  Plus, 
  ChevronRight, 
  LogOut, 
  Home, 
  RotateCw, 
  Calendar,
  Sparkles,
  UserCheck
} from 'lucide-react';
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
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const getPageInfo = () => {
    if (pathname === '/') {
      return {
        title: 'Candidate Database',
        badge: 'Live Data',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      };
    }
    if (pathname.startsWith('/add')) {
      return {
        title: 'New Candidate Intake',
        badge: 'Step 1-5',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      };
    }
    if (pathname.startsWith('/edit')) {
      return {
        title: 'Modify Candidate',
        badge: 'Editing',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/60',
      };
    }
    return {
      title: 'Travel Data Management',
      badge: 'Protected',
      badgeColor: 'bg-slate-50 text-slate-600 border-slate-200',
    };
  };

  const pageInfo = getPageInfo();
  const displayName = user?.name || user?.username || 'User';
  const displayInitial = (displayName[0] || 'U').toUpperCase();

  // Current formatted date
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      
      {/* Left side: Mobile menu toggle + Modern Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors hidden sm:flex items-center justify-center"
            title="Dashboard Home"
          >
            <Home className="h-4 w-4" />
          </Link>

          <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:inline shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
              {pageInfo.title}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${pageInfo.badgeColor} hidden sm:inline`}>
              {pageInfo.badge}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Tools, Date & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Date Display Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-600 shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{today}</span>
        </div>

        {/* Refresh Sync Button */}
        <button
          type="button"
          onClick={handleRefresh}
          className="p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 shadow-2xs transition-colors group relative"
          title="Refresh table data"
        >
          <RotateCw className={`h-4 w-4 transition-transform duration-500 ${isRefreshing ? 'animate-spin text-indigo-600' : 'group-hover:rotate-45'}`} />
        </button>

        {/* Add Candidate quick button (if not already on /add) */}
        {pathname !== '/add' && (
          <Link
            href="/add"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm hover:shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Candidate</span>
          </Link>
        )}

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Badge Pill */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2">
          <div className="flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-indigo-500/10 shadow-xs shrink-0">
              {displayInitial}
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                Admin
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
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
