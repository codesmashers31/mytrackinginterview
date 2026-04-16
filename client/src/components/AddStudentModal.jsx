import React, { useState } from 'react';
import { X, User, Phone, GraduationCap, Calendar, Briefcase, Globe, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddStudentModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    degree: '',
    passedOutYear: new Date().getFullYear(),
    currentStatus: 'Pending',
    companyName: '',
    packages: '',
    jobGetMode: 'Not Applicable'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-xl" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl glass-panel rounded-[3rem] shadow-ambient overflow-hidden border border-white/5 z-10"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
            
            <header className="px-12 py-10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-1 block">Entry Protocol</span>
                <h3 className="text-3xl font-display font-black text-on-surface tracking-tight">Register New Node</h3>
              </div>
              <button 
                onClick={onClose} 
                className="h-12 w-12 glass-panel flex items-center justify-center rounded-xl hover:bg-error/10 hover:text-error transition-all group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="px-12 pb-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {/* Field Group */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <User size={12} className="text-primary" />
                    Full Identity
                  </label>
                  <input 
                    name="name" value={formData.name} onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                    placeholder="Candidate Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Phone size={12} className="text-primary" />
                    Secure Link
                  </label>
                  <input 
                    name="mobile" value={formData.mobile} onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm tabular-nums"
                    placeholder="+91 00000 00000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <GraduationCap size={12} className="text-primary" />
                    Accreditation
                  </label>
                  <input 
                    name="degree" value={formData.degree} onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                    placeholder="Degree / Major"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Calendar size={12} className="text-primary" />
                    Batch Year
                  </label>
                  <input 
                    name="passedOutYear" type="number" value={formData.passedOutYear} onChange={handleChange} required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm tabular-nums"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Briefcase size={12} className="text-primary" />
                    Deployment Status
                  </label>
                  <select 
                    name="currentStatus" value={formData.currentStatus} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm appearance-none"
                  >
                    <option value="Pending" className="bg-surface">Pending</option>
                    <option value="Reviewing" className="bg-surface">Reviewing</option>
                    <option value="Interviewing" className="bg-surface">Interviewing</option>
                    <option value="Placed" className="bg-surface">Placed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Globe size={12} className="text-primary" />
                    Routing Mode
                  </label>
                  <select 
                    name="jobGetMode" value={formData.jobGetMode} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm appearance-none"
                  >
                    <option value="Not Applicable" className="bg-surface">Not Applicable</option>
                    <option value="Campus" className="bg-surface">Campus</option>
                    <option value="Referral" className="bg-surface">Referral</option>
                    <option value="Off-Campus" className="bg-surface">Off-Campus</option>
                    <option value="Direct" className="bg-surface">Direct</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    Organization Assignment
                  </label>
                  <input 
                    name="companyName" value={formData.companyName} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                    placeholder="Company Name (Leave blank if pending)"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <DollarSign size={12} className="text-primary" />
                    Valuation (LPA)
                  </label>
                  <input 
                    name="packages" value={formData.packages} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm tabular-nums"
                    placeholder="Ex. 12.5 LPA"
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full bg-primary text-white py-6 rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-lg shadow-primary/20 hover:bg-primary-dim transition-all mt-6"
              >
                Inject Node into Network
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
