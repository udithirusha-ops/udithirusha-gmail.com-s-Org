import React, { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  Atom,
  Clock,
  Compass,
  CornerDownLeft,
  FlaskConical,
  MessageSquare,
  Radio,
  Send,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  deleteRealtimeMessage,
  sendRealtimeMessage,
  subscribeToRealtimeMessages,
} from '../firebase/firestoreSync';
import { StudyMessage } from '../types/study';
import { generateId } from '../utils/storage';

interface MessagesFeedProps {
  variant?: 'full' | 'compact';
  onNavigateToFull?: () => void;
  activeSubjectFilter?: string;
}

const SUBJECT_CONFIG: Record<
  StudyMessage['subject'],
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  physics: {
    label: 'Physics',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Atom,
  },
  chemistry: {
    label: 'Chemistry',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: FlaskConical,
  },
  combined_maths: {
    label: 'Combined Mathematics',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: Compass,
  },
  general: {
    label: 'General Study',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: BookOpenIcon,
  },
};

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function formatColomboTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Colombo',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoStr;
  }
}

export function MessagesFeed({
  variant = 'full',
  onNavigateToFull,
  activeSubjectFilter,
}: MessagesFeedProps) {
  const { user, signInWithGoogle } = useAuth();
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedSubject, setSelectedSubject] = useState<string>(
    activeSubjectFilter || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [messageText, setMessageText] = useState('');
  const [composerSubject, setComposerSubject] = useState<StudyMessage['subject']>(
    activeSubjectFilter &&
      ['physics', 'chemistry', 'combined_maths'].includes(activeSubjectFilter)
      ? (activeSubjectFilter as StudyMessage['subject'])
      : 'general'
  );
  const [customAuthorName, setCustomAuthorName] = useState(() => {
    try {
      return localStorage.getItem('studiess_guest_name') || '';
    } catch {
      return '';
    }
  });
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const filterId = useId();
  const composerId = useId();

  // Real-time Cloud Firestore subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToRealtimeMessages(
      (updated) => {
        setMessages(updated);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Failed to listen to real-time messages:', err);
        setError('Real-time connection paused. Check network connection.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || isSending) return;

    if (trimmed.length > 2000) {
      setSendError('Message exceeds maximum length of 2000 characters.');
      return;
    }

    const authorName = user?.displayName
      ? user.displayName
      : customAuthorName.trim() || 'Anonymous Student';

    if (!user && customAuthorName.trim()) {
      try {
        localStorage.setItem('studiess_guest_name', customAuthorName.trim());
      } catch {
        // ignore
      }
    }

    const newMessage: StudyMessage = {
      id: generateId('msg'),
      text: trimmed,
      authorId: user ? user.uid : generateId('guest'),
      authorName,
      authorPhotoURL: user?.photoURL || undefined,
      subject: composerSubject,
      createdAt: new Date().toISOString(),
    };

    setIsSending(true);
    setSendError(null);
    try {
      await sendRealtimeMessage(newMessage);
      setMessageText('');
    } catch (err: any) {
      console.error('Error sending real-time message:', err);
      setSendError(err?.message || 'Failed to send message to Cloud Firestore.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await deleteRealtimeMessage(msgId);
    } catch (err: any) {
      console.error('Error deleting message:', err);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (selectedSubject !== 'all' && m.subject !== selectedSubject) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.text.toLowerCase().includes(q) ||
        m.authorName.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const displayedMessages =
    variant === 'compact' ? filteredMessages.slice(0, 5) : filteredMessages;

  return (
    <div className="flex flex-col gap-4">
      {/* Live Header & Real-Time Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {variant === 'full' ? 'Live Study Messages & Discussions' : 'Real-Time Study Feed'}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Powered by Cloud Firestore · Instant real-time updates across all your devices
            </p>
          </div>
        </div>

        {variant === 'compact' && onNavigateToFull && (
          <button
            type="button"
            onClick={onNavigateToFull}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
          >
            Open Full Feed
            <CornerDownLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Search (Full view) */}
      {variant === 'full' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Messages' },
              { id: 'physics', label: 'Physics' },
              { id: 'chemistry', label: 'Chemistry' },
              { id: 'combined_maths', label: 'Combined Maths' },
              { id: 'general', label: 'General Study' },
            ].map((tab) => {
              const active = selectedSubject === tab.id;
              const count =
                tab.id === 'all'
                  ? messages.length
                  : messages.filter((m) => m.subject === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSubject(tab.id)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active
                        ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full sm:w-56 text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Message Composer */}
      <form
        onSubmit={handleSendMessage}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
            )}
            <div className="text-xs">
              {user ? (
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  {user.displayName || user.email}
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded font-normal">
                    Signed In
                  </span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customAuthorName}
                    onChange={(e) => setCustomAuthorName(e.target.value)}
                    placeholder="Your Name (or Student)"
                    maxLength={32}
                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36"
                  />
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Google Sign-In
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subject tag selector */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={`${composerId}-subject`}
              className="text-xs text-slate-500 dark:text-slate-400"
            >
              Subject:
            </label>
            <select
              id={`${composerId}-subject`}
              value={composerSubject}
              onChange={(e) =>
                setComposerSubject(e.target.value as StudyMessage['subject'])
              }
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="general">General Study</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="combined_maths">Combined Mathematics</option>
            </select>
          </div>
        </div>

        {/* Message input */}
        <div className="relative">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Share a study question, revision note, past paper observation, or tip in real-time... (Press Ctrl+Enter to send)"
            rows={variant === 'full' ? 3 : 2}
            maxLength={2000}
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-[11px] ${
                messageText.length > 1800
                  ? 'text-amber-600 font-semibold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {messageText.length} / 2000
            </span>

            <div className="flex items-center gap-2">
              {sendError && (
                <span className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {sendError}
                </span>
              )}
              <button
                type="submit"
                disabled={!messageText.trim() || isSending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send to Feed
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Messages List */}
      <div className="flex flex-col gap-2.5">
        {loading && messages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Connecting to Cloud Firestore live stream...
            </p>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 text-center">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mx-auto mb-1" />
            <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">{error}</p>
          </div>
        ) : displayedMessages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No real-time messages yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Post the first study message, formula query, or tip. It will sync and appear instantly across all your open tabs and devices!
            </p>
          </div>
        ) : (
          displayedMessages.map((msg) => {
            const subjectCfg = SUBJECT_CONFIG[msg.subject] || SUBJECT_CONFIG.general;
            const SubjectIcon = subjectCfg.icon;
            const isAuthor = Boolean(user && user.uid === msg.authorId);

            return (
              <div
                key={msg.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {msg.authorPhotoURL ? (
                      <img
                        src={msg.authorPhotoURL}
                        alt={msg.authorName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                        {msg.authorName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {msg.authorName}
                        </span>
                        {/* Subject Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${subjectCfg.bg} ${subjectCfg.text} ${subjectCfg.border}`}
                        >
                          <SubjectIcon className="w-2.5 h-2.5" />
                          {subjectCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatColomboTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {isAuthor && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg.id)}
                      title="Delete your message"
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Message Content */}
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pl-10">
                  {msg.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
