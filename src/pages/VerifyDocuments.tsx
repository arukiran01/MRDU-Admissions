import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { DocumentKey, Student } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Users } from 'lucide-react';

export default function VerifyDocuments() {
  const { currentStudent, updateStudent, students, setCurrentStudent, isLoading } = useAppContext();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  // If there's no current student, just pick the most recent one
  useEffect(() => {
    if (!currentStudent && students.length > 0) {
      // Sort by date to get the most recent unsynced one if needed
      const sorted = [...students].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Prefer a pending one
      const pending = sorted.find(s => s.status === 'Pending');
      setCurrentStudent(pending || sorted[0]);
    } else if (!currentStudent && students.length === 0 && !isLoading) {
      navigate('/add-student');
    }
  }, [currentStudent, students, navigate, setCurrentStudent, isLoading]);

  if (!currentStudent) {
    const pendingStudents = students.filter(s => s.status === 'Pending');
    
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Document Verification</h2>
            <p className="text-sm text-slate-500 mt-1">Select a student from the list below to begin document verification.</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-all"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingStudents.length > 0 ? (
            pendingStudents.map(student => (
              <motion.div 
                key={student.id}
                whileHover={{ y: -4, shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 transition-all group"
                onClick={() => setCurrentStudent(student)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {student.name.charAt(0)}
                  </div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-amber-50 text-amber-600 rounded">Pending</span>
                </div>
                <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{student.name}</h3>
                <p className="text-[11px] text-slate-500 font-semibold mb-3">Adm No: {student.admissionNo}</p>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-medium">{student.branch}</span>
                  <span className="text-[11px] text-blue-600 font-bold group-hover:underline">Start Verification →</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-white rounded-xl border border-slate-200 border-dashed text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-600 font-bold">No Pending Verifications</h3>
              <p className="text-slate-400 text-sm mt-1">All registered students have been verified or there are no new registrations.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const [docs, setDocs] = useState(currentStudent.documents);

  // Keep docs in sync if currentStudent changes
  useEffect(() => {
    setDocs(currentStudent.documents);
  }, [currentStudent?.id]); // Use id to avoid infinite loop

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

  const handleHold = async () => {
    await updateStudent(currentStudent.id, {
      documents: docs,
      status: 'Pending',
    });
    navigate('/dashboard');
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
              onClick={handleHold}
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
        <div className="text-xs font-bold mb-2 uppercase tracking-widest text-slate-500">Live Receipt Preview</div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3">
          
            <div className="border-[1.5px] border-slate-900 p-2 rounded bg-white text-[7px] leading-[1.2] font-black print:text-black">
              <div className="text-center pb-1 mb-1 border-b border-slate-200">
                <div className="text-[10px] font-black uppercase leading-none">MALLA REDDY (MR)</div>
                <div className="text-[6.5px] font-black text-slate-800 mt-0.5">(DEEMED TO BE UNIVERSITY)</div>
                <div className="text-[5px] font-bold text-slate-500 mt-0.5 leading-tight">Maisammaguda, Dhulapally, Secunderabad - 500100</div>
              </div>
              
              <div className="flex justify-center mb-1">
                <span className="text-[8px] underline font-black uppercase tracking-wider">ADMISSIONS CERTIFICATION</span>
              </div>
  
              <div className="grid grid-cols-[60px_5px_1fr] gap-y-0.5 text-[7px] font-black">
                <span>Enq.No</span><span>:</span><span className="uppercase">{currentStudent.admissionNo}</span>
                <span>Name</span><span>:</span><span className="uppercase">{currentStudent.name}</span>
                <span>Father's Name</span><span>:</span><span className="uppercase">{currentStudent.fatherName}</span>
                <span>Year</span><span>:</span><span className="uppercase">{currentStudent.academicYear}</span>
                <span>Course</span><span>:</span><span className="uppercase">{currentStudent.branch}</span>
              </div>
  
              <div className="mt-2 pt-1 border-t border-slate-100">
                 <p className="text-[6px] font-black underline mb-0.5 uppercase">Documents Submitted:</p>
                 <div className="flex flex-wrap gap-1">
                   {Object.entries(docs).map(([key, value]) => {
                     if (value === true && key !== 'others') {
                       const label = checklistItems.find(i => i.key === key)?.label || key;
                       return <span key={key} className="bg-slate-50 px-0.5 rounded-[1px] text-[5px] uppercase border-[0.5px] border-slate-200 shrink-0">✓ {label}</span>;
                     }
                     if (key === 'others' && typeof value === 'string' && value.trim() !== '') {
                       return <span key="others-val" className="bg-slate-50 px-0.5 rounded-[1px] text-[5px] uppercase border-[0.5px] border-slate-200 shrink-0">✓ Other: {value}</span>;
                     }
                     return null;
                   })}
                 </div>
              </div>
  
              <div className="mt-3 pt-1 border-t border-slate-200 text-right">
                <p className="text-[6px] text-slate-900 font-black uppercase tracking-wider">Authorized Signature</p>
              </div>

              <div className="mt-1.5 border border-slate-900 p-1 text-[5px] leading-tight font-bold bg-slate-50/30">
                <span className="font-black">Note:</span> Parents are requested to preserve this receipt for future clarifications...
              </div>
            </div>
        </div>
        
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mt-2 shadow-sm">
          <div className="text-[11px] font-bold text-blue-800 mb-2 uppercase tracking-wider flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
             Verification Guide
          </div>
          <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
            Please ensure you have physically verified the original documents before checking them in the list. The receipt will list all relevant documents.
          </p>
        </div>
      </div>
    </div>
  );
}
