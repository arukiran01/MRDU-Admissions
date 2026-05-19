import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Student } from '../types';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

export default function AddStudent() {
  const { addStudent, dbStatus, students } = useAppContext();
  const navigate = useNavigate();

  const generateHallTicket = () => {
    return 'HT2025' + Math.floor(1000 + Math.random() * 9000);
  };

  const [formData, setFormData] = useState({
    name: '',
    admissionNo: '',
    fatherName: '',
    program: 'UG' as 'UG' | 'PG' | 'PHD',
    branch: '',
    parentPhone: '',
    academicYear: '2026-2027',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const programs = ['UG', 'PG'];

  const getBranches = (program: string) => {
    switch (program) {
      case 'UG':
        return ['CSE', 'CSE-AI&ML', 'CSE-DS', 'CSE-CS', 'ECE', 'EEE', 'CIVIL', 'MECH', 'BBA', 'BCA', 'BIO-TECHNOLOGY'];
      case 'PG':
        return ['CSE', 'ELECTRICAL POWER SYSTEMS', 'STRUCTURAL ENGINEERING', 'VLSI & EMBEDDED SYSTEMS', 'THERMAL ENGINEERING', 'MBA', 'MCA'];
      default:
        return [];
    }
  };

  const validatePhone = (phone: string) => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Constraints logic
    if (name === 'admissionNo') {
      // Numbers only
      if (value !== '' && !/^\d+$/.test(value)) return;
    }
    
    if (name === 'name' || name === 'fatherName') {
      // Text and spaces only (including uppercase automatic transformation)
      if (value !== '' && !/^[a-zA-Z\s]+$/.test(value)) return;
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // Reset branch if program changes
      if (name === 'program') {
        newData.branch = '';
      }
      
      return newData;
    });
    
    if (name === 'parentPhone') {
      if (value.length > 0 && !validatePhone(value)) {
        setPhoneError(true);
      } else {
        setPhoneError(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final checks
    if (!formData.name.trim() || !formData.admissionNo.trim() || !formData.branch) {
      alert("Please fill all required fields correctly.");
      return;
    }

    // Check for duplicates in local state first
    const isDuplicate = students.some(s => s.admissionNo.toLowerCase() === formData.admissionNo.trim().toLowerCase());
    if (isDuplicate) {
      alert("Validation Error: A student with this Admission/Enquiry Number already exists in the system.");
      return;
    }

    if (!validatePhone(formData.parentPhone)) {
      setPhoneError(true);
      alert("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsSubmitting(true);
    
    const newStudent: Student = {
      id: crypto.randomUUID(),
      ...formData,
      name: formData.name.trim().toUpperCase(),
      admissionNo: formData.admissionNo.trim(),
      fatherName: formData.fatherName.trim().toUpperCase(),
      parentPhone: formData.parentPhone.trim(),
      academicYear: formData.academicYear.trim(),
      documents: {
        sscMemo: false,
        sscBonafide: false,
        schoolBonafide6to9: false,
        tc: false,
        interPC: false,
        interBonafide: false,
        aadhaar: false,
        degreeCMM: false,
        degreePC: false,
        degreeBonafide: false,
        pgCMM: false,
        pgPC: false,
        pgBonafide: false,
        others: '',
      },
      status: 'Unverified',
      createdAt: new Date().toISOString(),
    };

    const result = await addStudent(newStudent);
    setIsSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert("Failed to add student:\n" + (result.errorMessage || "Unknown error"));
    }
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

      {(dbStatus === 'memory' || dbStatus === 'error') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-sm mb-4"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Local Memory Mode Active</p>
            <p className="text-xs font-medium opacity-80 leading-relaxed mt-0.5">
              The backend is not connected to a persistent Supabase database. 
              Any students you register now will be <strong>lost</strong> if the server restarts or if you refresh the page.
            </p>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Student Full Name (Text only)
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
                Admission / Enquiry No. (Numbers only)
              </label>
              <input
                type="text"
                name="admissionNo"
                pattern="[0-9]+"
                title="Only Numbers Allowed"
                value={formData.admissionNo}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. 2332"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Father's Name (Text only)
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
                Program
              </label>
              <select
                name="program"
                value={formData.program}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none"
              >
                {programs.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
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
                {getBranches(formData.program).map(b => (
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
                maxLength={10}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 outline-none transition-all ${
                  phoneError 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                    : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="10-digit mobile number"
              />
              {phoneError && (
                <p className="text-[10px] text-red-600 mt-1.5 font-semibold">
                  Please enter a valid 10-digit mobile number starting with 6-9
                </p>
              )}
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
