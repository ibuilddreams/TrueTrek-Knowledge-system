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
          className="fixed inset-0 bg-cn-p-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onSubmit={handleSubmit}
            className="bg-cn-p-card border border-cn-p-line w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5"
          >

            <div className="flex items-center justify-between pb-3 border-b border-cn-p-line">
              <div>
                <h3 className="font-black text-lg text-cn-p-ink">
                  {editingStudent ? 'Adjust Scholar-Athlete Metrics' : 'Enroll Candidate into Registry'}
                </h3>
                <p className="text-xs text-cn-p-ink-2 mt-0.5">Cool Nerdz Cohort validation slot allocation</p>
              </div>
              <CloseButton
                onClick={onClose}
                className="p-1 border border-cn-p-line rounded-full text-cn-p-ink-2 hover:bg-cn-p-page"
                iconClassName="w-4 h-4"
              />
            </div>

            <div className="space-y-4 text-sm">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-cn-p-ink-2 mb-1.5 font-bold">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-cn-p-page border border-cn-p-line rounded-lg px-3 py-2 focus:outline-none focus:border-cn-p-accent font-sans"
                    placeholder="e.g. Richard Pierce"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-cn-p-ink-2 mb-1.5 font-bold">Advisor Notification Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-cn-p-page border border-cn-p-line rounded-lg px-3 py-2 focus:outline-none focus:border-cn-p-accent font-sans"
                    placeholder="e.g. r_pierce@crimson.ua.edu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-cn-p-ink-2 mb-1.5 font-bold">Institution / Affiliated Academy *</label>
                  <input
                    type="text"
                    required
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full bg-cn-p-page border border-cn-p-line rounded-lg px-3 py-2 focus:outline-none focus:border-cn-p-accent font-sans"
                    placeholder="e.g. Auburn University"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-cn-p-ink-2 mb-1.5 font-bold">Specialty Focus Tract</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="cn-p-select w-full rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3 py-2 text-sm text-cn-p-ink outline-none focus:border-cn-p-accent"
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
                  <label className="block text-[11px] text-cn-p-ink-2 mb-1.5 font-bold">Curriculum Placement Tier</label>
                  <select
                    value={formData.activeTierId}
                    onChange={(e) => setFormData({ ...formData, activeTierId: e.target.value })}
                    className="cn-p-select w-full rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3 py-2 text-sm text-cn-p-ink outline-none focus:border-cn-p-accent"
                  >
                    {CURRICULUM_TIERS.map(t => (
                      <option key={t.id} value={t.id}>{t.number}: {t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-cn-p-ink-2 mb-1.5 font-bold">Enrollment Standing Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="cn-p-select w-full rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3 py-2 text-sm text-cn-p-ink outline-none focus:border-cn-p-accent"
                  >
                    <option value="Active">Active Student</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Complete">Complete (Tier Alumni)</option>
                  </select>
                </div>
              </div>

              <div className="bg-cn-p-page p-4 rounded-xl border border-cn-p-line gap-4 space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-[11px] text-cn-p-ink-2 font-bold mb-1">
                    <span>VERIFIED COMPLIANCE DRILL SCORE</span>
                    <span className="text-cn-p-soft-ink">{formData.averageScore} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.averageScore}
                    onChange={(e) => setFormData({ ...formData, averageScore: Number(e.target.value) })}
                    className="w-full accent-cn-p-accent cursor-pointer"
                  />
                  <p className="text-[10px] text-cn-p-ink-2 font-sans tracking-tight">Updates the aggregate test score on the active database profile</p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[11px] text-cn-p-ink-2 font-bold mb-1">
                    <span>CURRICULUM MODULES PROGRESS PROGRESSION</span>
                    <span className="text-cn-p-soft-ink">{formData.progressPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progressPercent}
                    onChange={(e) => setFormData({ ...formData, progressPercent: Number(e.target.value) })}
                    className="w-full accent-cn-p-accent cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-cn-p-ink-2 mb-1 font-bold">Continuous Learning Streak (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.streakDays}
                    onChange={(e) => setFormData({ ...formData, streakDays: Number(e.target.value) })}
                    className="w-full bg-cn-p-card border border-cn-p-line rounded-lg px-3 py-1.5 focus:outline-none placeholder:text-cn-p-muted font-sans"
                  />
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cn-p-line text-sm">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent hover:bg-cn-p-page text-cn-p-ink border border-cn-p-line rounded-cn-p-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white font-bold rounded-cn-p-sm"
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
