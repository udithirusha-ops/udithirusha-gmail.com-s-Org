import React, { useState } from 'react';
import { BookMarked, Check, Plus, Star, Trash2 } from 'lucide-react';
import {
  Course,
  Notebook,
  NotebookConfidence,
  NoteType,
  StudyNote,
  SubjectId,
} from '../types/study';
import { CategoryIcon } from './SubjectBadge';

interface NotesNotebooksPageProps {
  notes: StudyNote[];
  notebooks: Notebook[];
  courses: Course[];
  todayStr: string;
  onAddNotebook: (nb: Omit<Notebook, 'id'>) => void;
  onUpdateNotebook: (nb: Notebook) => void;
  onDeleteNotebook: (id: string) => void;
  onAddNote: (note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (note: StudyNote) => void;
  onDeleteNote: (id: string) => void;
}

const NOTE_TYPES: NoteType[] = ['Lecture', 'Cornell', 'QEC', 'Feynman', 'Outline'];
const CONFIDENCE_LEVELS: NotebookConfidence[] = [
  'Not Confident',
  'Somewhat Confident',
  'Confident',
];

export const NotesNotebooksPage: React.FC<NotesNotebooksPageProps> = ({
  notes,
  notebooks,
  courses,
  todayStr,
  onAddNotebook,
  onUpdateNotebook,
  onDeleteNotebook,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [filterType, setFilterType] = useState<NoteType | 'all'>('all');
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>('all');
  const [showNbForm, setShowNbForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<StudyNote | null>(null);

  // Notebook form
  const [nbTitle, setNbTitle] = useState('');
  const [nbSubject, setNbSubject] = useState<SubjectId | 'general'>('physics');
  const [nbCourseId, setNbCourseId] = useState('');
  const [nbConfidence, setNbConfidence] = useState<NotebookConfidence>('Somewhat Confident');
  const [nbDesc, setNbDesc] = useState('');

  // Note form
  const [nTitle, setNTitle] = useState('');
  const [nType, setNType] = useState<NoteType>('Lecture');
  const [nSubject, setNSubject] = useState<SubjectId | 'general'>('physics');
  const [nCourseId, setNCourseId] = useState('');
  const [nNotebookId, setNNotebookId] = useState('');
  const [nContent, setNContent] = useState('');
  const [nCues, setNCues] = useState('');
  const [nSummary, setNSummary] = useState('');
  const [nQuestion, setNQuestion] = useState('');
  const [nEvidence, setNEvidence] = useState('');
  const [nConclusion, setNConclusion] = useState('');
  const [nRelatedIds, setNRelatedIds] = useState<string[]>([]);

  const openCreateNote = () => {
    setEditingNote(null);
    setNTitle('');
    setNType('Lecture');
    setNSubject('physics');
    setNCourseId('');
    setNNotebookId(selectedNotebookId !== 'all' ? selectedNotebookId : '');
    setNContent('');
    setNCues('');
    setNSummary('');
    setNQuestion('');
    setNEvidence('');
    setNConclusion('');
    setNRelatedIds([]);
    setShowNoteForm(true);
  };

  const openEditNote = (note: StudyNote) => {
    setEditingNote(note);
    setNTitle(note.title);
    setNType(note.type);
    setNSubject(note.subject);
    setNCourseId(note.courseId);
    setNNotebookId(note.notebookId);
    setNContent(note.content);
    setNCues(note.cues ?? '');
    setNSummary(note.summary ?? '');
    setNQuestion(note.question ?? '');
    setNEvidence(note.evidence ?? '');
    setNConclusion(note.conclusion ?? '');
    setNRelatedIds(note.relatedNoteIds);
    setShowNoteForm(true);
  };

  const handleSaveNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nbTitle.trim()) return;
    onAddNotebook({
      title: nbTitle.trim(),
      courseId: nbCourseId,
      subject: nbSubject,
      confidence: nbConfidence,
      description: nbDesc.trim(),
    });
    setNbTitle('');
    setNbDesc('');
    setShowNbForm(false);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nTitle.trim()) return;
    if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: nTitle.trim(),
        type: nType,
        subject: nSubject,
        courseId: nCourseId,
        notebookId: nNotebookId,
        content: nContent,
        cues: nCues,
        summary: nSummary,
        question: nQuestion,
        evidence: nEvidence,
        conclusion: nConclusion,
        relatedNoteIds: nRelatedIds,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddNote({
        title: nTitle.trim(),
        type: nType,
        subject: nSubject,
        courseId: nCourseId,
        notebookId: nNotebookId,
        content: nContent,
        cues: nCues,
        summary: nSummary,
        question: nQuestion,
        evidence: nEvidence,
        conclusion: nConclusion,
        favourite: false,
        lastReviewedDate: todayStr,
        relatedNoteIds: nRelatedIds,
      });
    }
    setShowNoteForm(false);
    setEditingNote(null);
  };

  const visibleNotes = notes.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (onlyFavourites && !n.favourite) return false;
    if (selectedNotebookId !== 'all' && n.notebookId !== selectedNotebookId) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Notebooks */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Notebooks
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Organise study notes by course and track topic confidence
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNbForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold min-h-[40px]"
          >
            <Plus size={14} aria-hidden="true" />
            <span>{showNbForm ? 'Close' : 'New Notebook'}</span>
          </button>
        </div>

        {showNbForm && (
          <form onSubmit={handleSaveNotebook} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              required
              value={nbTitle}
              onChange={(e) => setNbTitle(e.target.value)}
              placeholder="Notebook Title *"
              aria-label="Notebook Title"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
            <select
              value={nbSubject}
              onChange={(e) => setNbSubject(e.target.value as SubjectId | 'general')}
              aria-label="Notebook Subject"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="combined_maths">Combined Mathematics</option>
              <option value="general">General</option>
            </select>
            <select
              value={nbCourseId}
              onChange={(e) => setNbCourseId(e.target.value)}
              aria-label="Notebook Course"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="">No Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={nbConfidence}
              onChange={(e) => setNbConfidence(e.target.value as NotebookConfidence)}
              aria-label="Notebook Confidence"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              {CONFIDENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
            >
              Create Notebook
            </button>
          </form>
        )}

        {notebooks.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No notebooks created yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {notebooks.map((nb) => {
              const nbNotesCount = notes.filter((n) => n.notebookId === nb.id).length;
              const active = selectedNotebookId === nb.id;
              return (
                <div
                  key={nb.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    active
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedNotebookId(active ? 'all' : nb.id)
                      }
                      className="text-left flex-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon category={nb.subject} size={14} />
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {nb.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {nbNotesCount} {nbNotesCount === 1 ? 'note' : 'notes'}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNotebook(nb.id)}
                      aria-label={`Delete notebook "${nb.title}"`}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <select
                      value={nb.confidence}
                      aria-label={`Confidence level for ${nb.title}`}
                      onChange={(e) =>
                        onUpdateNotebook({
                          ...nb,
                          confidence: e.target.value as NotebookConfidence,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs"
                    >
                      {CONFIDENCE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Notes Section */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Notes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports Lecture, Cornell, QEC, Feynman, and Outline methods
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold min-h-[40px]"
          >
            <Plus size={14} aria-hidden="true" />
            <span>New Note</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              filterType === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Types
          </button>
          {NOTE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                filterType === t
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOnlyFavourites((v) => !v)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              onlyFavourites
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Star size={12} aria-hidden="true" />
            <span>Favourites</span>
          </button>
        </div>

        {showNoteForm && (
          <form onSubmit={handleSaveNote} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                type="text"
                required
                value={nTitle}
                onChange={(e) => setNTitle(e.target.value)}
                placeholder="Note Title *"
                aria-label="Note Title"
                className="lg:col-span-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <select
                value={nType}
                onChange={(e) => setNType(e.target.value as NoteType)}
                aria-label="Note Type"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                {NOTE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={nSubject}
                onChange={(e) => setNSubject(e.target.value as SubjectId | 'general')}
                aria-label="Note Subject"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="combined_maths">Combined Mathematics</option>
                <option value="general">General</option>
              </select>
              <select
                value={nNotebookId}
                onChange={(e) => setNNotebookId(e.target.value)}
                aria-label="Note Notebook"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="">No Notebook</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    {nb.title}
                  </option>
                ))}
              </select>
            </div>

            {nType === 'Cornell' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <textarea
                  rows={4}
                  value={nCues}
                  onChange={(e) => setNCues(e.target.value)}
                  placeholder="Cues / Key Questions"
                  aria-label="Cornell Cues"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs"
                />
                <textarea
                  rows={4}
                  value={nContent}
                  onChange={(e) => setNContent(e.target.value)}
                  placeholder="Main Notes"
                  aria-label="Cornell Notes"
                  className="sm:col-span-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs"
                />
                <textarea
                  rows={2}
                  value={nSummary}
                  onChange={(e) => setNSummary(e.target.value)}
                  placeholder="Summary"
                  aria-label="Cornell Summary"
                  className="sm:col-span-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs"
                />
              </div>
            )}

            {nType === 'QEC' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <textarea
                  rows={3}
                  value={nQuestion}
                  onChange={(e) => setNQuestion(e.target.value)}
                  placeholder="Question"
                  aria-label="QEC Question"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs"
                />
                <textarea
                  rows={3}
                  value={nEvidence}
                  onChange={(e) => setNEvidence(e.target.value)}
                  placeholder="Evidence / Derivation"
                  aria-label="QEC Evidence"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs"
                />
                <textarea
                  rows={3}
                  value={nConclusion}
                  onChange={(e) => setNConclusion(e.target.value)}
                  placeholder="Conclusion"
                  aria-label="QEC Conclusion"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs"
                />
              </div>
            )}

            {(nType === 'Lecture' || nType === 'Feynman' || nType === 'Outline') && (
              <textarea
                rows={4}
                value={nContent}
                onChange={(e) => setNContent(e.target.value)}
                placeholder={
                  nType === 'Feynman'
                    ? 'Explain this concept in simple terms, then list knowledge gaps...'
                    : nType === 'Outline'
                      ? '1. Main Topic\n  a. Subtopic...'
                      : 'Lecture notes...'
                }
                aria-label="Note Content"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="note-course-select" className="text-slate-600 dark:text-slate-400">
                  Course:
                </label>
                <select
                  id="note-course-select"
                  value={nCourseId}
                  onChange={(e) => setNCourseId(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                >
                  <option value="">None</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoteForm(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
                >
                  {editingNote ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </div>
          </form>
        )}

        {visibleNotes.length === 0 ? (
          <div className="py-8 text-center">
            <BookMarked size={24} className="mx-auto text-slate-300 dark:text-slate-700" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">
              No notes found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create Lecture, Cornell, QEC, Feynman, or Outline notes to organise your revision.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleNotes.map((note) => {
              const nb = notebooks.find((b) => b.id === note.notebookId);
              return (
                <article
                  key={note.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <CategoryIcon category={note.subject} size={13} />
                          <span>{note.type}</span>
                          {nb && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{nb.title}</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {note.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateNote({ ...note, favourite: !note.favourite })
                          }
                          aria-label={
                            note.favourite
                              ? `Remove "${note.title}" from favourites`
                              : `Favourite "${note.title}"`
                          }
                          className={`p-1.5 rounded-lg ${
                            note.favourite
                              ? 'text-amber-500'
                              : 'text-slate-400 hover:text-amber-500'
                          }`}
                        >
                          <Star
                            size={14}
                            fill={note.favourite ? 'currentColor' : 'none'}
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label={`Delete note "${note.title}"`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-line">
                      {note.type === 'QEC'
                        ? [note.question, note.evidence, note.conclusion].filter(Boolean).join(' — ')
                        : note.content || note.summary || 'No content yet.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    <span className="font-mono tabular-nums">
                      {note.lastReviewedDate
                        ? `Reviewed ${note.lastReviewedDate}`
                        : 'Not reviewed'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateNote({ ...note, lastReviewedDate: todayStr })
                        }
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        <Check size={12} aria-hidden="true" />
                        <span>Reviewed Today</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditNote(note)}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
