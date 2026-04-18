import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { DocumentKey, Student } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export default function VerifyDocuments() {
  const { currentStudent, updateStudent, students, setCurrentStudent } = useAppContext();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  // If there's no current student, just pick the last one or redirect
  useEffect(() => {
    if (!currentStudent && students.length > 0) {
      setCurrentStudent(students[0]);
    } else if (!currentStudent && students.length === 0) {
      navigate('/add-student');
    }
  }, [currentStudent, students, navigate, setCurrentStudent]);

  if (!currentStudent) return null;

  const [docs, setDocs] = useState(currentStudent.documents);

  // Keep docs in sync if currentStudent changes
  useEffect(() => {
    setDocs(currentStudent.documents);
  }, [currentStudent]);

  const checklistItems: { key: DocumentKey; label: string }[] = [
    { key: 'ssc', label: '10th Class Memo (SSC)' },
    { key: 'schoolBonafide', label: '10th Class Bonafide' },
    { key: 'tc', label: 'Transfer Certificate (TC)' },
    { key: 'interBonafide', label: 'Inter/Diploma Bonafide' },
    { key: 'interPC', label: 'Inter/Diploma PC' },
    { key: 'degreeCMM', label: 'Degree/B.Tech CMM' },
    { key: 'degreePC', label: 'Degree/B.Tech PC' },
    { key: 'aadhaar', label: 'Aadhaar Card' },
    { key: 'rankCard', label: 'Rank Card (JEE/MAINS/CET)' },
  ];

  const handleToggle = (key: DocumentKey) => {
    setDocs((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleOthersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocs((prev) => ({
      ...prev,
      others: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    await updateStudent(currentStudent.id, {
      documents: docs,
      status: 'Verified',
    });
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/receipt');
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      
      {/* Verification Panel */}
      <div className="flex flex-col gap-5">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800">Current Student Verification</h2>
            <span className="text-[12px] text-emerald-600 font-semibold">● Active Session</span>
          </div>

          {/* Student Meta */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1 tracking-wider">Student Name</label>
              <span className="font-semibold text-sm text-slate-800">{currentStudent.name}</span>
            </div>
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1 tracking-wider">Admission No</label>
              <span className="font-semibold text-sm text-slate-800">{currentStudent.admissionNo}</span>
            </div>
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1 tracking-wider">Father's Name</label>
              <span className="font-semibold text-sm text-slate-800">{currentStudent.fatherName}</span>
            </div>
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1 tracking-wider">Branch</label>
              <span className="font-semibold text-sm text-slate-800">{currentStudent.branch}</span>
            </div>
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1 tracking-wider">Inter Hall Ticket</label>
              <span className="font-semibold text-sm text-slate-800">{currentStudent.interHallTicket}</span>
            </div>
            <div>
              <label className="block text-[11px] uppercase text-slate-500 mb-1 tracking-wider">Parent Phone</label>
              <span className="font-semibold text-sm text-slate-800">{currentStudent.parentPhone}</span>
            </div>
          </div>

          <label className="block text-[11px] uppercase text-slate-500 mb-2 tracking-wider">Checklist Documents Provided</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            {checklistItems.map((item) => (
              <label key={item.key} className="flex items-center gap-2.5 p-2.5 border border-slate-200 rounded-lg text-[13px] hover:border-slate-300 cursor-pointer transition-colors bg-white">
                <input
                  type="checkbox"
                  checked={!!docs[item.key as keyof typeof docs]}
                  onChange={() => handleToggle(item.key)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="font-medium text-slate-800">{item.label}</span>
              </label>
            ))}
            {/* Others input */}
            <div className="col-span-1 md:col-span-2 p-2.5 border border-slate-200 rounded-lg bg-white flex items-center gap-2.5 hover:border-slate-300 transition-colors">
              <span className="text-[13px] font-medium text-slate-800 shrink-0">Others (Specify):</span>
              <input
                type="text"
                value={docs.others}
                onChange={handleOthersChange}
                placeholder="Any additional documents"
                className="flex-1 px-2 text-[13px] outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 relative overflow-hidden">
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              Verify & Generate Receipt
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-transparent border border-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-50 active:scale-95 transition-all"
            >
              Hold Application
            </button>
            
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute inset-0 bg-emerald-50 text-emerald-700 flex items-center px-4 font-semibold text-sm rounded-md border border-emerald-200"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Successfully Verified! Preparing receipt...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Receipt Preview Sidebar */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-bold mb-2">Live Receipt Preview</div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col gap-3">
          
          <div className="border border-dashed border-slate-300 p-3 rounded bg-white text-[9px] leading-[1.4]">
            <div className="font-bold text-center border-b border-slate-100 pb-2 mb-2">
              <div className="text-[10px]">MALLA REDDY (MR)</div>
              <div className="text-[6px] font-normal text-slate-500 mt-1">Maisammaguda, Dhulapally, Secunderabad - 500100</div>
            </div>
            <p><strong>Name:</strong> {currentStudent.name}</p>
            <p><strong>Adm No:</strong> {currentStudent.admissionNo}</p>
            <p className="mt-1"><strong>Status:</strong> <span className="text-blue-600">PENDING RECEIPT</span></p>
            <div className="mt-12 pt-1 border-t border-slate-400 text-center">
              <p className="text-[7px] text-slate-800 font-bold uppercase tracking-wider">Authorized Signature</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mt-2">
          <div className="text-[11px] font-bold text-blue-800 mb-2 uppercase tracking-wider">Verification Guide</div>
          <p className="text-[10px] text-blue-700 leading-relaxed">
            Please ensure you have physically verified the original documents before checking them in the list. Once verified, the digital receipt will be generated for the student.
          </p>
        </div>
      </div>
    </div>
  );
}
