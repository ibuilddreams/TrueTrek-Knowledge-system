"use client";

import { useState } from 'react';
import { Search, Filter, BookOpen, Eye, Edit, Trash, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CURRICULUM_TIERS, DRILL_QUESTIONS } from '@/data/curriculum';
import { getDaysSinceLastDrill } from '@/lib/dates';
import CloseButton from '@/components/ui/CloseButton';

export default function EnrollmentScoresTab({ students, setStudents, onEditStudent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [quickViewStudent, setQuickViewStudent] = useState(null);

  const handleDeleteStudent = (id, name) => {
    const confirmed = window.confirm(`Are you sure you want to withdraw ${name} from active TrueTrek curriculum slots?`);
    if (confirmed) {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategoryFilter === 'all' || student.category === selectedCategoryFilter;
    const matchesTier = selectedTierFilter === 'all' || student.activeTierId === selectedTierFilter;

    return matchesSearch && matchesCategory && matchesTier;
  });

  return (
    <div className="space-y-6">

      {/* Filter controls row */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Search Bar */}
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-450">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-600 transition"
            placeholder="Search candidate name, email, or institution..."
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/90 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-stone-605 border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Specialties</option>
              <option value="Academic">Academic</option>
              <option value="Athletic">Athletic</option>
              <option value="Professional">Professional</option>
              <option value="Legacy">Legacy</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/90 rounded-xl px-3 py-1.5">
            <BookOpen className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-stone-605 border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Tiers</option>
              {CURRICULUM_TIERS.map(tier => (
                <option key={tier.id} value={tier.id}>{tier.number} ({tier.tag})</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Roster Database Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">

            <thead>
              <tr className="bg-stone-50 text-stone-450 font-mono text-[10px] uppercase tracking-wider border-b border-stone-200/80">
                <th className="py-4 px-6 font-semibold">Student Name / Email</th>
                <th className="py-4 px-6 font-semibold">Institution</th>
                <th className="py-4 px-6 font-semibold">Category</th>
                <th className="py-4 px-6 font-semibold text-center">Active Class Tier</th>
                <th className="py-4 px-6 font-semibold text-center">Average Score</th>
                <th className="py-4 px-6 font-semibold">Progress Ratio</th>
                <th className="py-4 px-6 font-semibold text-center">Streak</th>
                <th className="py-4 px-6 font-semibold text-center">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Faculty Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-stone-702 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const activeTier = CURRICULUM_TIERS.find(t => t.id === student.activeTierId);
                  const daysSinceLast = getDaysSinceLastDrill(student.lastDrillDate);
                  const isAtRisk = daysSinceLast > 3;
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-amber-50/10 transition-colors ${selectedStudent?.id === student.id ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs shadow-inner shrink-0">
                            {student.avatarText}
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                              <button
                                onClick={() => setQuickViewStudent(student)}
                                className="font-serif font-black text-stone-900 hover:text-amber-800 transition-colors cursor-pointer hover:underline text-left block"
                                title={`Quick View compliance progress for ${student.name}`}
                                aria-label={`Quick View compliance progress for ${student.name}`}
                              >
                                {student.name}
                              </button>
                              {isAtRisk && (
                                <span
                                  className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/50 rounded-md px-1.5 py-0.5 text-[8.5px] font-mono font-bold animate-pulse"
                                  title={`Alert: Inactive for ${daysSinceLast === 999 ? 'over 7' : daysSinceLast} days without completed drills`}
                                >
                                  <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                                  RISK: {daysSinceLast === 999 ? '>7' : daysSinceLast}D
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-stone-400 mt-0.5">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4.5 px-6 font-normal text-stone-600">
                        {student.institution}
                      </td>

                      <td className="py-4.5 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-bold ${
                          student.category === 'Athletic' ? 'bg-emerald-55 text-emerald-700 border border-emerald-200/50' :
                          student.category === 'Academic' ? 'bg-indigo-55 text-indigo-700 border border-indigo-200/50' :
                          student.category === 'Professional' ? 'bg-amber-55 text-amber-700 border border-amber-200/50' :
                          'bg-stone-100 text-stone-700'
                        }`}>
                          {student.category}
                        </span>
                      </td>

                      <td className="py-4.5 px-6 text-center text-stone-850 font-mono font-semibold">
                        {activeTier ? activeTier.number : 'N/A'}
                        <span className="block text-[8px] font-light text-stone-400 font-sans mt-0.5 tracking-tight truncate max-w-[120px]">
                          {activeTier ? activeTier.title : ''}
                        </span>
                      </td>

                      <td className="py-4.5 px-6 text-center font-mono font-bold text-stone-900">
                        <span className={`inline-block px-2 py-0.5 rounded-md ${
                          student.averageScore >= 90 ? 'text-emerald-700 bg-emerald-50' :
                          student.averageScore >= 80 ? 'text-amber-700 bg-amber-50' :
                          'text-rose-700 bg-rose-50'
                        }`}>
                          {student.averageScore}/100
                        </span>
                      </td>

                      <td className="py-4.5 px-6">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                            <span>{student.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${student.progressPercent >= 80 ? 'bg-emerald-500' : 'bg-amber-650'}`}
                              style={{ width: `${student.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4.5 px-6 text-center font-mono text-amber-700 font-bold">
                        {student.streakDays}d
                      </td>

                      <td className="py-4.5 px-6 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          student.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                          student.status === 'Complete' ? 'bg-amber-600' :
                          'bg-amber-400'
                        }`} title={student.status} />
                        <span className="block text-[8px] font-mono text-stone-400 uppercase mt-0.5 tracking-wider">{student.status}</span>
                      </td>

                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            title="View Student Dossier & Test Details"
                            aria-label="View Student Dossier & Test Details"
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditStudent(student)}
                            title="Edit Scores & Class Enrollment"
                            aria-label="Edit Scores & Class Enrollment"
                            className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                            title="Withdraw Candidate Slot"
                            aria-label="Withdraw Candidate Slot"
                            className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400 font-light">
                    <span className="block font-mono text-xs uppercase text-amber-700 mb-1">NO RECORDS FOUND</span>
                    No student dossiers match the selected active directory filter criteria.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Drawer Detail Panel for Student Analysis */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-lg bg-white h-screen shadow-2xl p-6 sm:p-8 overflow-y-auto flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Upper Details Header */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-600/10 border border-amber-600/30 rounded-2xl flex items-center justify-center font-bold text-amber-750 text-base">
                      {selectedStudent.avatarText}
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-xl text-stone-900 flex items-center flex-wrap gap-2">
                        {selectedStudent.name}
                        {getDaysSinceLastDrill(selectedStudent.lastDrillDate) > 3 && (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/50 rounded-md px-2 py-0.5 text-[9px] font-mono font-bold animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            RISK ALERT
                          </span>
                        )}
                      </h3>
                      <p className="text-xs font-mono text-stone-400 mt-0.5">{selectedStudent.email}</p>
                    </div>
                  </div>

                  <CloseButton
                    onClick={() => setSelectedStudent(null)}
                    className="p-1.5 border border-stone-200 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition"
                    iconClassName="w-4.5 h-4.5"
                  />
                </div>

                {/* Metadata blocks */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Institution</p>
                    <p className="text-xs text-stone-800 font-medium mt-1">{selectedStudent.institution}</p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Last Active Drill</p>
                    <p className={`text-xs font-bold mt-1 ${getDaysSinceLastDrill(selectedStudent.lastDrillDate) > 3 ? 'text-rose-700' : 'text-stone-850'}`}>
                      {selectedStudent.lastDrillDate ? `${selectedStudent.lastDrillDate} (${getDaysSinceLastDrill(selectedStudent.lastDrillDate)}d ago)` : 'Never'}
                    </p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Active Curriculum Placement</p>
                    <p className="text-xs text-stone-800 font-bold mt-1">
                      {CURRICULUM_TIERS.find(t => t.id === selectedStudent.activeTierId)?.number}
                      <span className="font-normal font-sans text-stone-500 block text-[10px] truncate">
                        {CURRICULUM_TIERS.find(t => t.id === selectedStudent.activeTierId)?.title}
                      </span>
                    </p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Class Standings Score</p>
                    <p className="text-xs font-bold text-stone-900 mt-1 flex items-center gap-1.5">
                      <span className="text-amber-700 text-sm">{selectedStudent.averageScore}/100</span>
                      <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">PASSED</span>
                    </p>
                  </div>
                </div>

                {/* Drill records status checklist of test scores */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">COMPLETED ASSESSMENTS & DRILLS</h4>

                  {DRILL_QUESTIONS.map((drill, index) => {
                    const isCompleted = selectedStudent.completedDrillIds.includes(drill.id);
                    return (
                      <div
                        key={drill.id}
                        className={`p-4.5 rounded-xl border transition duration-200 ${
                          isCompleted ? 'bg-emerald-58/5 border-emerald-200/60' : 'bg-stone-50 border-stone-200/40 text-stone-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[9px] font-mono uppercase block mb-1 font-bold">
                              Drill #{index + 1} - {isCompleted ? 'CERTIFIED COMPLIANT' : 'OUTSTANDING'}
                            </span>
                            <p className="text-xs font-serif font-med line-clamp-2 leading-relaxed">
                              {drill.scenario}
                            </p>
                          </div>
                          <div className="shrink-0 pt-0.5">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-stone-300"></div>
                            )}
                          </div>
                        </div>
                        {isCompleted && (
                          <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-emerald-800">Scored: {selectedStudent.averageScore} / 100</span>
                            <span className="text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">VERIFIED ENTRY</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Lower Actions Section in Drawer */}
              <div className="pt-6 border-t border-stone-200 flex gap-3">
                <button
                  onClick={() => {
                    onEditStudent(selectedStudent);
                    setSelectedStudent(null);
                  }}
                  className="flex-grow py-2.5 bg-stone-900 border hover:bg-stone-850 text-stone-100 text-xs font-mono uppercase font-bold rounded-xl tracking-wider text-center"
                >
                  EDIT RECORD
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-650 text-xs font-mono uppercase font-semibold rounded-xl"
                >
                  CLOSE
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPACT STUDENT QUICK VIEW MODAL */}
      <AnimatePresence>
        {quickViewStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setQuickViewStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white border border-stone-250 w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with avatar & main stats */}
              <div className="flex items-start justify-between pb-3.5 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center font-bold text-amber-750 text-sm shrink-0">
                    {quickViewStudent.avatarText}
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-base text-stone-900 flex items-center flex-wrap gap-1.5">
                      {quickViewStudent.name}
                      {getDaysSinceLastDrill(quickViewStudent.lastDrillDate) > 3 && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/50 rounded-md px-1.5 py-0.5 text-[8.5px] font-mono font-bold animate-pulse">
                          <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                          RISK
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] font-mono text-stone-400 mt-0.5">{quickViewStudent.email}</p>
                  </div>
                </div>
                <CloseButton
                  onClick={() => setQuickViewStudent(null)}
                  className="p-1 border border-stone-200 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition shrink-0"
                  iconClassName="w-4 h-4"
                  title="Close Quick View"
                />
              </div>

              {/* Brief Metadata Context */}
              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100 font-mono text-[10px]">
                <div>
                  <span className="text-stone-400 uppercase block">Institution</span>
                  <span className="text-stone-850 font-bold font-sans truncate block mt-0.5">{quickViewStudent.institution}</span>
                </div>
                <div>
                  <span className="text-stone-400 uppercase block">Category</span>
                  <span className="text-stone-850 font-bold block mt-0.5">{quickViewStudent.category}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-stone-200/50">
                  <span className="text-stone-400 uppercase block">Last Active Drill</span>
                  <span className={`font-bold block mt-0.5 ${getDaysSinceLastDrill(quickViewStudent.lastDrillDate) > 3 ? 'text-rose-700' : 'text-stone-850'}`}>
                    {quickViewStudent.lastDrillDate ? `${quickViewStudent.lastDrillDate} (${getDaysSinceLastDrill(quickViewStudent.lastDrillDate)} days ago)` : 'No recorded activity'}
                  </span>
                </div>
              </div>

              {/* Progress and Score breakdown */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                    <span className="text-stone-450 uppercase font-semibold">Course Velocity & Progress</span>
                    <span className="text-amber-850 font-bold">{quickViewStudent.progressPercent}%</span>
                  </div>

                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden relative">
                    <motion.div
                      className="bg-gradient-to-r from-amber-500 to-amber-700 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${quickViewStudent.progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                    <span className="text-stone-450 uppercase font-semibold">Compliance Assessment Rating</span>
                    <span className="text-emerald-700 font-bold">{quickViewStudent.averageScore}/100</span>
                  </div>

                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden relative">
                    <motion.div
                      className="bg-emerald-600 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${quickViewStudent.averageScore}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Completed drills summary checklist */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">DRILLED SYLLABUS SYNC</h4>
                <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-stone-200">
                  {DRILL_QUESTIONS.map((drill, index) => {
                    const isCompleted = quickViewStudent.completedDrillIds.includes(drill.id);
                    return (
                      <div
                        key={drill.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between text-[10.5px] leading-relaxed transition ${
                          isCompleted ? 'bg-emerald-50/20 border-emerald-100 text-stone-800' : 'bg-stone-50/50 border-stone-200/30 text-stone-400'
                        }`}
                      >
                        <span className="font-serif truncate max-w-[280px]">
                          {index + 1}. {drill.scenario}
                        </span>
                        {isCompleted ? (
                          <span className="text-[8px] font-mono bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded shrink-0 font-bold">CERTIFIED</span>
                        ) : (
                          <span className="text-[8px] font-mono bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded shrink-0 font-medium">PENDING</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-3 border-t border-stone-100 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedStudent(quickViewStudent);
                    setQuickViewStudent(null);
                  }}
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase font-bold rounded-lg transition text-center"
                  title="Open full student dossier with detailed diagnostic history"
                >
                  Open Full Dossier
                </button>
                <button
                  onClick={() => setQuickViewStudent(null)}
                  className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-650 font-mono text-[10px] uppercase font-semibold rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
