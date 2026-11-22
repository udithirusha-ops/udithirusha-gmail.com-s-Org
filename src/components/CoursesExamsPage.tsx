import React, { useState } from 'react';
import { ArrowRight, BookOpen, Calendar, Plus, Trash2 } from 'lucide-react';
import { SUBJECT_THEMES } from '../constants/subjects';
import {
  ActivePage,
  AssignmentExam,
  AssignmentStatus,
  AssignmentType,
  Course,
  Notebook,
  StudyNote,
  SubjectId,
} from '../types/study';
import { calculateCourseStats, calculateDaysLeft } from '../utils/calculations';
import { getColomboTodayStr } from '../utils/colomboTime';
import { CategoryIcon } from './SubjectBadge';

interface CoursesExamsPageProps {
  courses: Course[];
  assignments: AssignmentExam[];
  notes: StudyNote[];
  notebooks: Notebook[];
  todayStr: string;
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onDeleteCourse: (id: string) => void;
  onAddAssignment: (asg: Omit<AssignmentExam, 'id'>) => void;
  onUpdateAssignment: (asg: AssignmentExam) => void;
  onDeleteAssignment: (id: string) => void;
  onNavigate: (page: ActivePage) => void;
}

export const CoursesExamsPage: React.FC<CoursesExamsPageProps> = ({
  courses,
  assignments,
  notes,
  notebooks,
  todayStr,
  onAddCourse,
  onDeleteCourse,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onNavigate,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showAsgForm, setShowAsgForm] = useState(false);

  // Course form fields
  const [cName, setCName] = useState('');
  const [cCode, setCCode] = useState('');
  const [cProf, setCProf] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cLocation, setCLocation] = useState('');
  const [cTime, setCTime] = useState('');
  const [cSemester, setCSemester] = useState('');
  const [cStatus, setCStatus] = useState<Course['status']>('Active');
  const [cSubject, setCSubject] = useState<SubjectId | 'general'>('physics');
  const [cSyllabus, setCSyllabus] = useState('');
  const [cSummary, setCSummary] = useState('');

  // Assignment form fields
  const [aTitle, setATitle] = useState('');
  const [aType, setAType] = useState<AssignmentType>('Assignment');
  const [aStatus, setAStatus] = useState<AssignmentStatus>('Not Started');
  const [aDueDate, setADueDate] = useState(getColomboTodayStr());
  const [aCourseId, setACourseId] = useState('');
  const [aSubject, setASubject] = useState<SubjectId | 'general'>('physics');
  const [aNotes, setANotes] = useState('');

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;
    onAddCourse({
      name: cName.trim(),
      courseCode: cCode.trim(),
      professor: cProf.trim(),
      email: cEmail.trim(),
      location: cLocation.trim(),
      time: cTime.trim(),
      semester: cSemester.trim(),
      status: cStatus,
      syllabus: cSyllabus.trim(),
      summary: cSummary.trim(),
      subject: cSubject,
    });
    setCName('');
    setCCode('');
    setCProf('');
    setCEmail('');
    setCLocation('');
    setCTime('');
    setCSemester('');
    setCSyllabus('');
    setCSummary('');
    setShowCourseForm(false);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aTitle.trim()) return;
    const linkedCourse = courses.find((c) => c.id === aCourseId);
    onAddAssignment({
      title: aTitle.trim(),
      type: aType,
      status: aStatus,
      dueDate: aDueDate || todayStr,
      courseId: aCourseId,
      subject: linkedCourse ? linkedCourse.subject : aSubject,
      notes: aNotes.trim(),
    });
    setATitle('');
    setANotes('');
    setShowAsgForm(false);
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;

  return (
    <div className="space-y-6">
      {/* Courses Header */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Courses
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Course directory with computed assignment progress, exams, notes, and notebooks
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCourseForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold min-h-[40px]"
          >
            <Plus size={14} aria-hidden="true" />
            <span>{showCourseForm ? 'Close Form' : 'Add Course'}</span>
          </button>
        </div>

        {showCourseForm && (
          <form onSubmit={handleSaveCourse} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="Course Name *"
                aria-label="Course Name"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={cCode}
                onChange={(e) => setCCode(e.target.value)}
                placeholder="Course Code (e.g. PHY-201)"
                aria-label="Course Code"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
              />
              <select
                value={cSubject}
                onChange={(e) => setCSubject(e.target.value as SubjectId | 'general')}
                aria-label="Course Subject"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="combined_maths">Combined Mathematics</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={cProf}
                onChange={(e) => setCProf(e.target.value)}
                placeholder="Professor / Lecturer"
                aria-label="Professor"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <input
                type="email"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                placeholder="Professor Email"
                aria-label="Professor Email"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={cLocation}
                onChange={(e) => setCLocation(e.target.value)}
                placeholder="Location"
                aria-label="Location"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={cTime}
                onChange={(e) => setCTime(e.target.value)}
                placeholder="Class Time (e.g. Tue 10:00)"
                aria-label="Class Time"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={cSemester}
                onChange={(e) => setCSemester(e.target.value)}
                placeholder="Semester / Term"
                aria-label="Semester"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <select
                value={cStatus}
                onChange={(e) => setCStatus(e.target.value as Course['status'])}
                aria-label="Course Status"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="Active">Active</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={cSyllabus}
                onChange={(e) => setCSyllabus(e.target.value)}
                placeholder="Syllabus topics"
                aria-label="Syllabus"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={cSummary}
                onChange={(e) => setCSummary(e.target.value)}
                placeholder="Course summary"
                aria-label="Summary"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
              >
                Save Course
              </button>
            </div>
          </form>
        )}

        {courses.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
            No courses added yet. Add a course above or import from Notion.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((course) => {
              const stats = calculateCourseStats(
                course,
                assignments,
                notes,
                notebooks,
                todayStr
              );
              return (
                <div
                  key={course.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={course.subject} size={15} />
                        <span className="text-xs font-mono text-slate-500">
                          {course.courseCode || 'COURSE'} · {course.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {course.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteCourse(course.id)}
                      aria-label={`Delete course "${course.name}"`}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    {course.professor && <div>Prof: {course.professor}</div>}
                    {course.location && <div>Location: {course.location} {course.time ? `· ${course.time}` : ''}</div>}
                    {course.semester && <div>Semester: {course.semester}</div>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Assignment progress</span>
                      <span className="font-mono tabular-nums font-semibold">
                        {stats.completedAssignments}/{stats.totalAssignments} ({stats.assignmentProgress}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${stats.assignmentProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>
                      {stats.upcomingExams} upcoming exams · {stats.notesCount} notes · {stats.notebooksCount} notebooks
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCourseId(
                          selectedCourseId === course.id ? null : course.id
                        )
                      }
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedCourseId === course.id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedCourse && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {selectedCourse.name} ({selectedCourse.courseCode || 'No code'})
              </h4>
              <button
                type="button"
                onClick={() => onNavigate('notes')}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
              >
                <BookOpen size={13} />
                <span>Open Notes &amp; Notebooks</span>
                <ArrowRight size={13} />
              </button>
            </div>
            {selectedCourse.email && <p>Email: {selectedCourse.email}</p>}
            {selectedCourse.syllabus && <p><strong>Syllabus:</strong> {selectedCourse.syllabus}</p>}
            {selectedCourse.summary && <p><strong>Summary:</strong> {selectedCourse.summary}</p>}
          </div>
        )}
      </section>

      {/* Assignments & Exams Section */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Assignments &amp; Exams
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Track deadlines with live Days Left calculation in Asia/Colombo
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAsgForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold min-h-[40px]"
          >
            <Plus size={14} aria-hidden="true" />
            <span>{showAsgForm ? 'Close Form' : 'Add Assignment / Exam'}</span>
          </button>
        </div>

        {showAsgForm && (
          <form onSubmit={handleSaveAssignment} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={aTitle}
                onChange={(e) => setATitle(e.target.value)}
                placeholder="Assignment or Exam Title *"
                aria-label="Assignment Title"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <select
                value={aType}
                onChange={(e) => setAType(e.target.value as AssignmentType)}
                aria-label="Assignment Type"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="Assignment">Assignment</option>
                <option value="Exam">Exam</option>
                <option value="Quiz">Quiz</option>
                <option value="Lab">Lab</option>
                <option value="Practical">Practical</option>
              </select>
              <select
                value={aStatus}
                onChange={(e) => setAStatus(e.target.value as AssignmentStatus)}
                aria-label="Assignment Status"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="date"
                value={aDueDate}
                onChange={(e) => setADueDate(e.target.value)}
                aria-label="Due Date"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
              />
              <select
                value={aCourseId}
                onChange={(e) => setACourseId(e.target.value)}
                aria-label="Related Course"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="">No specific course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={aSubject}
                onChange={(e) => setASubject(e.target.value as SubjectId | 'general')}
                aria-label="Assignment Subject"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="combined_maths">Combined Mathematics</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={aNotes}
                onChange={(e) => setANotes(e.target.value)}
                placeholder="Notes or scope..."
                aria-label="Assignment Notes"
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
              >
                Save Deadline
              </button>
            </div>
          </form>
        )}

        {assignments.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
            No assignments or exams scheduled yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4 font-semibold">Title</th>
                  <th className="py-2.5 pr-4 font-semibold">Type</th>
                  <th className="py-2.5 pr-4 font-semibold">Course</th>
                  <th className="py-2.5 pr-4 font-semibold">Status</th>
                  <th className="py-2.5 pr-4 font-semibold">Due Date</th>
                  <th className="py-2.5 pr-4 font-semibold text-right">Days Left</th>
                  <th className="py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...assignments]
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .map((asg) => {
                    const daysLeft = calculateDaysLeft(asg.dueDate, todayStr);
                    const course = courses.find((c) => c.id === asg.courseId);
                    const subjColor =
                      asg.subject !== 'general'
                        ? SUBJECT_THEMES[asg.subject].color
                        : '#475569';
                    return (
                      <tr
                        key={asg.id}
                        className="border-b border-slate-100 dark:border-slate-800/80 last:border-b-0"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">
                          <div>{asg.title}</div>
                          {asg.notes && (
                            <div className="text-[11px] text-slate-500">{asg.notes}</div>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-medium" style={{ color: subjColor }}>
                          {asg.type}
                        </td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                          {course ? course.name : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={asg.status}
                            aria-label={`Status for ${asg.title}`}
                            onChange={(e) =>
                              onUpdateAssignment({
                                ...asg,
                                status: e.target.value as AssignmentStatus,
                              })
                            }
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 text-xs"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Complete">Complete</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} aria-hidden="true" />
                            {asg.dueDate}
                          </span>
                        </td>
                        <td
                          className={`py-3 pr-4 font-mono tabular-nums text-right font-semibold ${
                            asg.status === 'Complete'
                              ? 'text-emerald-600'
                              : daysLeft < 0
                                ? 'text-red-600'
                                : daysLeft <= 3
                                  ? 'text-amber-600'
                                  : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {asg.status === 'Complete'
                            ? 'Done'
                            : daysLeft < 0
                              ? `${Math.abs(daysLeft)}d overdue`
                              : daysLeft === 0
                                ? 'Today'
                                : `${daysLeft}d`}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteAssignment(asg.id)}
                            aria-label={`Delete "${asg.title}"`}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
