import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { DocumentKey, Student } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Users, UploadCloud, Eye, X, Maximize2, Minimize2, Move } from 'lucide-react';
import Draggable from 'react-draggable';
import { getChecklistItems } from '../constants';

export default function VerifyDocuments() {
  const { currentStudent, updateStudent, students, setCurrentStudent, isLoading } = useAppContext();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string, name: string } | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // If there's no current student, just pick the most recent one
  useEffect(() => {
    if (!currentStudent && students.length > 0) {
      const sorted = [...students].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const pending = sorted.find(s => s.status === 'Pending');
      setCurrentStudent(pending || sorted[0]);
    } else if (!currentStudent && students.length === 0 && !isLoading) {
      navigate('/add-student');
    }
  }, [currentStudent, students, navigate, setCurrentStudent, isLoading]);

  const [docs, setDocs] = useState(currentStudent?.documents || {} as Student['documents']);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>(currentStudent?.uploadedFiles || {});

  useEffect(() => {
    if (currentStudent) {
      setDocs(currentStudent.documents);
      setUploadedFiles(currentStudent.uploadedFiles || {});
    }
  }, [currentStudent?.id]);

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

  const checklistItems = getChecklistItems(currentStudent.program);

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

  const handleFileUpload = (key: DocumentKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be under 2MB for preview purposes.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setUploadedFiles(prev => ({ ...prev, [key]: evt.target?.result as string }));
          setDocs(prev => ({ ...prev, [key]: true }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openPreview = (key: DocumentKey, label: string) => {
    if (uploadedFiles[key]) {
      setPreviewDoc({ url: uploadedFiles[key], name: label });
    }
  };

  // Verification logic: All required documents MUST be true
  const isAllSubmitted = checklistItems.every(item => docs[item.key as keyof typeof docs]);
  const calculatedStatus = isAllSubmitted ? 'Verified' : 'Pending';

  const handleHold = async () => {
    const result = await updateStudent(currentStudent.id, {
      documents: docs,
      uploadedFiles,
      status: calculatedStatus,
    });
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert("Failed to update student:\n" + (result.errorMessage || "Unknown error"));
    }
  };

  const handleSubmit = async () => {
    const result = await updateStudent(currentStudent.id, {
      documents: docs,
      uploadedFiles,
      status: calculatedStatus,
    });
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/receipt');
      }, 1500);
    } else {
      alert("Failed to update student:\n" + (result.errorMessage || "Unknown error"));
    }
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
              <label className="block text-[11px] uppercase text-slate-500 mb-1 tracking-wider">Parent Phone</label>
              <span className="font-semibold text-sm text-slate-800">{currentStudent.parentPhone}</span>
            </div>
          </div>

          <label className="block text-[11px] uppercase text-slate-500 mb-2 tracking-wider">Checklist Documents Provided</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            {checklistItems.map((item) => {
              const isChecked = !!docs[item.key as keyof typeof docs];
              const hasFile = !!uploadedFiles[item.key];
              
              return (
                <div key={item.key} className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg text-[13px] hover:border-slate-300 transition-colors bg-white">
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(item.key)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="font-medium text-slate-800 truncate">{item.label}</span>
                  </label>
                  
                  <div className="flex items-center gap-1.5 ml-2">
                    {hasFile && (
                      <button 
                        onClick={() => openPreview(item.key, item.label)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <label 
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${hasFile ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                      title={hasFile ? "Change Document" : "Upload Document"}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(item.key, e)} 
                      />
                    </label>
                  </div>
                </div>
              );
            })}
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
              className={`px-5 py-2.5 ${isAllSubmitted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-semibold rounded-md active:scale-95 transition-all shadow-sm`}
            >
              Save as {calculatedStatus} & Generate Receipt
            </button>
            <button
              onClick={handleHold}
              className="px-5 py-2.5 bg-transparent border border-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-50 active:scale-95 transition-all"
            >
              Save & Return to Dashboard
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3 items-center">
             
           {/* Preview bounding box wrapping precisely the receipt element */}
           <div className="w-[180px] origin-top opacity-90 transition-transform flex flex-col h-[280px]">
              {/* Outer Labels */}
              <div className="font-black text-[7px] tracking-wide uppercase mb-1 text-left text-slate-800">
                 OFFICE / STUDENT COPY
              </div>

              {/* Main Container */}
              <div className="border-[1px] border-black p-2 flex flex-col bg-white flex-grow">
                
                {/* HEADER */}
                <div className="flex flex-col items-center text-center pb-1">
                   <img 
                      src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" 
                      alt="MRDU" 
                      className="h-6 w-6 object-contain mb-0.5" 
                      referrerPolicy="no-referrer"
                   />
                   <h1 className="text-[10px] font-black uppercase tracking-tight leading-none mb-0.5">MALLA REDDY (MR)</h1>
                   <p className="font-bold text-[5px] uppercase tracking-wide mb-0.5">(DEEMED TO BE UNIVERSITY)</p>
                   <p className="font-bold text-[4px] tracking-wide">Recognised Under Section 3 of The UGC Act, 1956.</p>
                </div>

                <div className="border-t-[0.5px] border-black mt-0.5 mb-[1.5px]"></div>
                <div className="text-center font-bold text-[4.5px] px-1 leading-snug">
                   Maisammaguda, Dhulapally - 500100, Telangana. | www.mrdu.edu.in
                </div>
                <div className="border-t-[0.5px] border-black mt-[1.5px] mb-3"></div>

                <div className="text-center font-extrabold text-[7px] uppercase underline underline-offset-2 mb-3 tracking-wide">
                   ADMISSIONS CERTIFICATION
                </div>

                <div className="flex flex-col gap-1 mb-4 px-1">
                   <div className="grid grid-cols-[60px_1fr] items-start text-[5px]">
                      <span className="font-bold">Enq.No</span>
                      <span className="font-bold">: {currentStudent.admissionNo}</span>
                   </div>
                   <div className="grid grid-cols-[60px_1fr] items-start text-[5px]">
                      <span className="font-bold">Student Name</span>
                      <span className="font-bold uppercase leading-[1.2]">: {currentStudent.name}</span>
                   </div>
                   <div className="grid grid-cols-[60px_1fr] items-start text-[5px]">
                      <span className="font-bold">Fathers' Name</span>
                      <span className="font-bold uppercase leading-[1.2]">: {currentStudent.fatherName}</span>
                   </div>
                   <div className="grid grid-cols-[60px_1fr] items-start text-[5px]">
                      <span className="font-bold">Academic Year</span>
                      <span className="font-bold uppercase leading-[1.2]">: {currentStudent.academicYear}</span>
                   </div>
                   <div className="grid grid-cols-[60px_1fr] items-start text-[5px]">
                      <span className="font-bold">Program</span>
                      <span className="font-bold uppercase leading-[1.2]">: {currentStudent.program}</span>
                   </div>
                   <div className="grid grid-cols-[60px_1fr] items-start text-[5px]">
                      <span className="font-bold">Course Name</span>
                      <span className="font-bold uppercase leading-[1.2]">: {currentStudent.branch}</span>
                   </div>
                </div>

                <div className="font-extrabold text-[5.5px] uppercase underline underline-offset-1 mb-2 px-1 tracking-wide">
                   DOCUMENTS CHECKLIST:
                </div>

                <div className="flex flex-col gap-[2px] px-1 mb-4 flex-grow">
                   {checklistItems.map(item => {
                      const isGiven = !!docs[item.key as keyof typeof docs];
                      
                      const renderLabelWithSuperscript = (label: string) => {
                        if (label.includes('10TH')) {
                          return <span key={label}>10<sup className="text-[3.5px] lowercase font-black">th</sup>{label.substring(4)}</span>;
                        }
                        if (label.includes('6TH') && label.includes('9TH')) {
                           return <span key={label}>BONAFIDE FROM 6<sup className="text-[3.5px] lowercase font-black">th</sup> TO 9<sup className="text-[3.5px] lowercase font-black">th</sup> CLASS</span>;
                        }
                        return label;
                      };

                      return (
                        <div key={item.key} className="flex items-center gap-1.5">
                           <div className="w-[6px] h-[6px] border-[0.5px] border-black rounded-full flex justify-center items-center bg-white shrink-0 overflow-hidden">
                             {isGiven && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-[4px] h-[4px] text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                           </div>
                           <span className="font-bold text-black uppercase text-[4.5px] truncate">{renderLabelWithSuperscript(item.label)}</span>
                        </div>
                      );
                   })}
                   
                   <div className="flex items-end gap-1.5 mt-0.5">
                      <div className="w-[6px] h-[6px] border-[0.5px] border-black rounded-full flex justify-center items-center bg-white shrink-0 overflow-hidden mb-[1px]">
                         {docs.others && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-[4px] h-[4px] text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <div className="font-bold text-black uppercase text-[4.5px] flex flex-1 items-end gap-1">
                         <span className="shrink-0 mb-[1px]">OTHERS:</span>
                         <div className="flex-1 border-b-[0.5px] border-black pb-[1px] min-w-0">
                             <span className="px-1 line-clamp-1">{docs.others || '\u00A0'}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-auto">
                   <div className="flex justify-end mb-2 px-2 pt-4">
                      <div className="flex flex-col items-center">
                         <div className="w-16 border-b-[0.5px] border-black mb-0.5"></div>
                         <span className="font-bold text-[4.5px] uppercase tracking-wide">Authorized Signature</span>
                      </div>
                   </div>

                   <div className="border-[0.5px] border-black px-1.5 py-1 bg-slate-50 text-justify">
                      <p className="font-bold text-[4px] leading-[1.3] text-left">
                         <span className="font-black uppercase mr-0.5">Note:</span>
                         Parents are requested to preserve this receipt for future clarifications in
                         respect of fee paid by you. Fee once paid will not be refunded.
                      </p>
                   </div>
                </div>

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

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <Draggable handle=".drag-handle" disabled={isMaximized}>
              <div 
                className={`pointer-events-auto absolute bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border border-slate-300 ${isMaximized ? 'inset-4 !transform-none' : 'bottom-8 right-8 w-full max-w-2xl h-[70vh] min-h-[500px]'}`}
              >
                <div className="drag-handle flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50 cursor-move border-t-2 border-t-blue-500">
                  <div className="flex items-center gap-3 pl-1">
                    <Move className="w-5 h-5 text-slate-400" />
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">{previewDoc.name}</h3>
                      <p className="text-[11px] text-slate-500 uppercase tracking-tight">{currentStudent.name} • {currentStudent.admissionNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pr-1">
                    <a 
                      href={previewDoc.url}
                      download={previewDoc.name}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors shadow-sm"
                    >
                      Download
                    </a>
                    <button 
                      onClick={() => setIsMaximized(!isMaximized)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded transition-colors bg-white shadow-sm border border-slate-200"
                    >
                      {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => {
                        setPreviewDoc(null);
                        setIsMaximized(false);
                      }}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-rose-500 rounded transition-colors bg-white shadow-sm border border-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-0 overflow-auto bg-slate-100 flex-1 flex justify-center items-center">
                  {previewDoc.url.startsWith('data:application/pdf') ? (
                    <iframe src={previewDoc.url} className="w-full h-full bg-white" title={previewDoc.name} />
                  ) : (
                    <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-[100%] object-contain" />
                  )}
                </div>
              </div>
            </Draggable>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
