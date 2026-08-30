'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Compass, 
  Search,
  Plus,
  Radio,
  X,
  Sparkles,
  Shield
} from 'lucide-react';
import { logout } from '@/app/actions/auth';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  user?: {
    name?: string;
    username?: string;
  } | null;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleQuickSearchClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname]);

  const handleQuickSearchClick = () => {
    if (pathname !== '/') {
      router.push('/');
    }
    // Small timeout to allow render/focus
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }, 150);
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
  ];

  const displayName = user?.name || user?.username || 'User';
  const displayInitial = (displayName[0] || 'U').toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200/90 shadow-[1px_0_10px_rgba(0,0,0,0.015)] select-none">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 bg-white">
        <Link href="/" className="flex items-center gap-3 overflow-hidden group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/25 shrink-0 group-hover:scale-105 transition-transform">
            <Compass className="h-5 w-5" />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-extrabold text-slate-900 text-base tracking-tight truncate transition-opacity duration-200">
              Data <span className="text-indigo-600">Manage</span>
            </span>
          )}
        </Link>

        {mobileOpen ? (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Top CTA & Search Bar */}
      <div className="p-3 space-y-2">
        {/* + New Candidate Primary Button */}
        {(!collapsed || mobileOpen) ? (
          <Link
            href="/add"
            onClick={() => {
              if (mobileOpen && onCloseMobile) onCloseMobile();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm hover:shadow-md shadow-indigo-600/25 transition-all group"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Candidate</span>
          </Link>
        ) : (
          <Link
            href="/add"
            className="flex items-center justify-center h-10 w-10 mx-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/25 transition-all group relative"
            title="Add New Candidate"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
              Add New Candidate
            </div>
          </Link>
        )}

        {/* Quick Search Shortcut Trigger */}
        {(!collapsed || mobileOpen) ? (
          <button
            type="button"
            onClick={handleQuickSearchClick}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-slate-500 hover:text-slate-800 text-xs transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
              <span className="text-xs">Quick search...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-200 text-slate-400 group-hover:text-slate-600 shadow-xs">
              Ctrl K
            </kbd>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleQuickSearchClick}
            className="flex items-center justify-center h-10 w-10 mx-auto rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-500 hover:text-indigo-600 transition-colors group relative cursor-pointer"
            title="Search candidates (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
              Search (Ctrl+K)
            </div>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-2 px-3 space-y-1 overflow-y-auto">
        {(!collapsed || mobileOpen) && (
          <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (mobileOpen && onCloseMobile) onCloseMobile();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'bg-indigo-50/90 text-indigo-700 font-semibold border border-indigo-100 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={collapsed && !mobileOpen ? item.label : undefined}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-150 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {(!collapsed || mobileOpen) && (
                <span className="truncate">{item.label}</span>
              )}

              {/* Tooltip for collapsed state on desktop */}
              {collapsed && !mobileOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Google Sheets Live Sync Health Badge */}
      <div className="px-3 pb-3">
        {(!collapsed || mobileOpen) ? (
          <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-700 truncate">
                  Google Sheets
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  Live Connected
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-100">
              Sync
            </span>
          </div>
        ) : (
          <div 
            className="h-9 w-9 mx-auto rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center group relative cursor-help"
            title="Google Sheets: Live Connected"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
              Google Sheets Live
            </div>
          </div>
        )}
      </div>

      {/* User Profile Card & Logout Footer */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className={`flex items-center ${collapsed && !mobileOpen ? 'justify-center' : 'justify-between'} gap-2 p-2 rounded-2xl ${collapsed && !mobileOpen ? '' : 'bg-slate-50/80 border border-slate-200/80 shadow-xs'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-xs ring-2 ring-indigo-500/20 flex items-center justify-center shrink-0 shadow-xs">
              {displayInitial}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {displayName}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200/60 leading-none">
                    Admin
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    @{user?.username || 'user'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => logout()}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ${
              collapsed && !mobileOpen ? 'hidden' : 'block'
            }`}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 z-50 md:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
