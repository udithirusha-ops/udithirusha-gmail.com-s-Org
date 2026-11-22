import React, { useState } from 'react';
import { Download, MoreVertical, PlusSquare, Share, WifiOff, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'full' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'full',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState<'ios' | 'android' | null>(null);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'compact'
            ? 'inline-flex items-center gap-1.5 rounded-lg border border-blue-600/30 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-2 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors min-h-[40px] whitespace-nowrap shrink-0'
            : 'w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2.5 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors min-h-[44px]'
        }
      >
        <Download size={14} aria-hidden="true" />
        <span>{variant === 'compact' ? 'Install' : 'Install Wedapala'}</span>
      </button>
    );
  }

  if (isIOS || (isAndroid && variant === 'full')) {
    const mode = isIOS ? 'ios' : 'android';
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(mode)}
          className={
            variant === 'compact'
              ? 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] whitespace-nowrap shrink-0'
              : 'w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]'
          }
        >
          <Download size={14} aria-hidden="true" />
          <span>
            {variant === 'compact'
              ? 'Install'
              : isIOS
                ? 'Install Wedapala on iPhone'
                : 'Install Wedapala on Android'}
          </span>
        </button>

        {showGuide && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowGuide(null);
            }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Install Wedapala Instructions"
          >
            <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/pwa-192x192.png"
                    alt="Wedapala"
                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {showGuide === 'ios'
                      ? 'Install Wedapala on iPhone'
                      : 'Install Wedapala on Android'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(null)}
                  aria-label="Close install instructions"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>

              {showGuide === 'ios' ? (
                <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <Share size={17} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      1. Tap the <strong>Share</strong> button in Safari&apos;s bottom toolbar.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <PlusSquare size={17} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      2. Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                    </span>
                  </li>
                </ol>
              ) : (
                <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <MoreVertical size={17} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      1. Open the browser menu (<strong>⋮</strong>) in Chrome.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Download size={17} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </span>
                  </li>
                </ol>
              )}

              <button
                type="button"
                onClick={() => setShowGuide(null)}
                className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 py-3 text-sm font-semibold text-white dark:text-slate-900 min-h-[44px]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff size={14} aria-hidden="true" />
      <span>Offline Mode — Changes saved locally</span>
    </div>
  );
};
