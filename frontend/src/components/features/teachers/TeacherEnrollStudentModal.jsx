"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CURRICULUM_TIERS } from '@/data/curriculum';
import CloseButton from '@/components/ui/CloseButton';

const EMPTY_FORM = {
  name: '',
  email: '',
  institution: '',
  category: 'Academic',
  activeTierId: 'tier-1',
  progressPercent: 50,
  averageScore: 85,
  streakDays: 5,
  status: 'Active',
};

export default function TeacherEnrollStudentModal({ isOpen, editingStudent, onClose, onSubmit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) return;

    if (editingStudent) {
      setFormData({
        name: editingStudent.name,
        email: editingStudent.email,
        institution: editingStudent.institution,
        category: editingStudent.category,
        activeTierId: editingStudent.activeTierId,
        progressPercent: editingStudent.progressPercent,
        averageScore: editingStudent.averageScore,
        streakDays: editingStudent.streakDays,
        status: editingStudent.status,
      });
    } else {
      setFormData({ ...EMPTY_FORM, progressPercent: 10, averageScore: 80, streakDays: 0 });
    }
  }, [isOpen, editingStudent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, editingStudent);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.form
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onSubmit={handleSubmit}
            className="bg-white border border-stone-250 w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5"
          >

            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-serif font-black text-lg text-stone-950">
                  {editingStudent ? 'Adjust Scholar-Athlete Metrics' : 'Enroll Candidate into Registry'}
                </h3>
                <p className="text-[11px] text-stone-450 mt-0.5">TrueTrek Cohort validation slot allocation</p>
              </div>
              <CloseButton
                onClick={onClose}
                className="p-1 border border-stone-200 rounded-full text-stone-450 hover:bg-stone-50"
                iconClassName="w-4 h-4"
              />
            </div>

            <div className="space-y-4 text-xs font-mono">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-650 font-sans"
                    placeholder="e.g. Richard Pierce"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Advisor Notification Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-650 font-sans"
                    placeholder="e.g. r_pierce@crimson.ua.edu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Institution / Affiliated Academy *</label>
                  <input
                    type="text"
                    required
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-650 font-sans"
                    placeholder="e.g. Auburn University"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Specialty Focus Tract</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Athletic">Athletic</option>
                    <option value="Professional">Professional</option>
                    <option value="Legacy">Legacy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Curriculum Placement Tier</label>
                  <select
                    value={formData.activeTierId}
                    onChange={(e) => setFormData({ ...formData, activeTierId: e.target.value })}
                    className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    {CURRICULUM_TIERS.map(t => (
                      <option key={t.id} value={t.id}>{t.number}: {t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-stone-450 uppercase mb-1.5 font-bold">Enrollment Standing Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-stone-52 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    <option value="Active">Active Student</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Complete">Complete (Tier Alumni)</option>
                  </select>
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 gap-4 space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold mb-1">
                    <span>VERIFIED COMPLIANCE DRILL SCORE</span>
                    <span className="text-amber-800 font-mono">{formData.averageScore} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.averageScore}
                    onChange={(e) => setFormData({ ...formData, averageScore: Number(e.target.value) })}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <p className="text-[9px] text-stone-400 font-sans tracking-tight">Updates the aggregate test score on the active database profile</p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold mb-1">
                    <span>CURRICULUM MODULES PROGRESS PROGRESSION</span>
                    <span className="text-amber-800 font-mono">{formData.progressPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progressPercent}
                    onChange={(e) => setFormData({ ...formData, progressPercent: Number(e.target.value) })}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-stone-450 uppercase mb-1 font-bold">Continuous Learning Streak (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.streakDays}
                    onChange={(e) => setFormData({ ...formData, streakDays: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none placeholder:text-stone-300 font-sans"
                  />
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 font-mono text-xs">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-stone-900 border hover:bg-stone-850 text-stone-100 font-bold rounded-xl"
              >
                {editingStudent ? 'SAVE CHANCES' : 'ENROLL CANDIDATE'}
              </button>
            </div>

          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
