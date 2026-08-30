'use client';

import { useActionState, useState } from 'react';
import { login } from '@/app/actions/auth';
import { 
  Compass, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle
} from 'lucide-react';

const initialState = {
  error: '',
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Background ambient lighting and dot pattern */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* Floating Card Container */}
      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.07)] p-8 sm:p-10 transition-all">
          
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-13 w-13 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-4 ring-indigo-50 mb-4 hover:scale-105 transition-transform">
              <Compass className="h-6 w-6" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Data <span className="text-indigo-600">Manage</span>
            </h1>
          </div>

          {/* Login Form */}
          <form action={formAction} className="space-y-4">
            
            {/* Username Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="username" 
                className="block text-xs font-semibold text-slate-700"
              >
                Username
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  className="block w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-slate-900 text-sm placeholder-slate-400 hover:bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all shadow-2xs"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Field with Custom Reveal Toggle */}
            <div className="space-y-1.5">
              <label 
                htmlFor="password" 
                className="block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="block w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-11 text-slate-900 text-sm placeholder-slate-400 hover:bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all shadow-2xs"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {state?.error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 flex items-center gap-2.5 text-xs font-semibold text-rose-700 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-sm font-semibold text-white shadow-sm hover:shadow-md shadow-indigo-600/25 focus:outline-none focus:ring-4 focus:ring-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-75 transition-all group cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
}
