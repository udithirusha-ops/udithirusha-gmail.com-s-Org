import React, { useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SyncState } from '../hooks/useFirestoreSync';

interface AuthButtonProps {
  syncState?: SyncState;
  variant?: 'header' | 'sidebar';
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  syncState = 'offline',
  variant = 'header',
}) => {
  const { user, loading, authError, signInWithGoogle, logout, clearAuthError } =
    useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400">
        <RefreshCw size={13} className="animate-spin" />
        <span className="hidden sm:inline">Checking auth...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-xl transition-all ${
            variant === 'sidebar'
              ? 'w-full p-2.5 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800'
              : 'p-1 sm:px-2.5 sm:py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60'
          }`}
          aria-label="User profile and sync options"
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-300 dark:ring-slate-600"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          <div className="text-left hidden sm:block max-w-[120px] lg:max-w-[140px] truncate">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {user.displayName || 'Wedapala User'}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncState === 'live'
                    ? 'bg-emerald-500 animate-pulse'
                    : syncState === 'connecting'
                      ? 'bg-amber-500 animate-spin'
                      : 'bg-slate-400'
                }`}
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {syncState === 'live'
                  ? 'Real-time Sync'
                  : syncState === 'connecting'
                    ? 'Syncing...'
                    : 'Offline cache'}
              </span>
            </div>
          </div>
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className={`absolute z-50 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 space-y-2.5 ${
                variant === 'sidebar' ? 'bottom-full mb-2 left-0' : 'right-0 top-full mt-2'
              }`}
            >
              <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user.displayName || 'Google Account'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>

              <div className="px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Cloud size={14} className="text-emerald-500 shrink-0" />
                <span>
                  {syncState === 'live'
                    ? 'Live Firestore Real-Time Sync active'
                    : 'Connecting to Firestore...'}
                </span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={signingIn}
        className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 transition-colors min-h-[40px] whitespace-nowrap shadow-xs ${
          variant === 'sidebar' ? 'w-full justify-center' : ''
        }`}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{signingIn ? 'Signing in...' : 'Sign in with Google'}</span>
      </button>

      {authError && (
        <div className="absolute right-4 top-16 z-50 max-w-sm rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300 shadow-xl flex items-start justify-between gap-2">
          <span>{authError}</span>
          <button
            type="button"
            onClick={clearAuthError}
            className="text-red-500 font-bold hover:underline"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
