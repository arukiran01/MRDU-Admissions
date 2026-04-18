import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Student } from '../types';
import { motion } from 'motion/react';

export default function AddStudent() {
  const { addStudent } = useAppContext();
  const navigate = useNavigate();

  const generateHallTicket = () => {
    return 'HT2025' + Math.floor(1000 + Math.random() * 9000);
  };

  const [formData, setFormData] = useState({
    name: '',
    admissionNo: '',
    fatherName: '',
    branch: '',
    parentPhone: '',
    interHallTicket: '',
    academicYear: '2026-2027',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const branches = [
    'CSE',
    'CSE (AIML)',
    'CSE (Data Science)',
    'ECE',
    'EEE',
    'Mechanical',
    'Civil',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newStudent: Student = {
      // Using interHallTicket as the primary key ID per user request
      id: formData.interHallTicket,
      ...formData,
      documents: {
        ssc: false,
        schoolBonafide: false,
        interBonafide: false,
        interPC: false,
        degreeCMM: false,
        degreePC: false,
        tc: false,
        aadhaar: false,
        rankCard: false,
        others: '',
      },
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    await addStudent(newStudent);
    setIsSubmitting(false);
    navigate('/verify');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto space-y-5"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-800">Register New Student</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Student Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase outline-none"
                placeholder="e.g. JOHN DOE"
              />
            </div>
            
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Inter Hall Ticket (Primary Key)
              </label>
              <input
                type="text"
                name="interHallTicket"
                value={formData.interHallTicket}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter Inter Hall Ticket No"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Admission / Enquiry No.
              </label>
              <input
                type="text"
                name="admissionNo"
                value={formData.admissionNo}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="2332"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Father's Name
              </label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase outline-none"
                placeholder="Father's Full Name"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Branch / Course
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none"
              >
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Parent Phone No.
              </label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="10-digit number"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Academic Year
              </label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="2026-2027"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-transparent border border-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save & Verify Documents'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
