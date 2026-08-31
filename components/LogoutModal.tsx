'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X, Loader2 } from 'lucide-react';
import { logout } from '@/app/actions/auth';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoggingOut) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoggingOut, onClose]);

  if (!isOpen || !mounted) return null;

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={!isLoggingOut ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Close X button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoggingOut}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          {/* Icon Badge */}
          <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
            <LogOut className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Sign Out Confirmation
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Are you sure you want to sign out? You will need to re-enter your credentials to access the system again.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-sm hover:shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <span>Yes, Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
