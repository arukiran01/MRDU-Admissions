import { Users, UserCheck, Clock, Search, Download, Filter, Edit, X, Save, Trash2, AlertTriangle, CheckCircle2, FileText, Send, Upload, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import React, { useState, useRef } from 'react';
import { Student } from '../types';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { getChecklistItems } from '../constants';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { students, setCurrentStudent, updateStudent, deleteStudent, isLoading, fetchStudents } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [actionStudent, setActionStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const branches = [...new Set(students.map(s => s.branch))];
  const academicYears = [...new Set(students.map(s => s.academicYear))];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsUploading(true);
        const dataBuffer = evt.target?.result;
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const studentsToInsert = data.map((row: any) => {
          const interHallTicket = String(row['Inter Hall Ticket'] || row['Hall Ticket'] || row['interHallTicket'] || '');
          return {
            id: crypto.randomUUID(),
            admissionNo: row['Admission No'] || row['Admission Number'] || row['admissionNo'] || '',
            name: row['Student Name'] || row['Name'] || row['name'] || '',
            fatherName: row['Father Name'] || row['fatherName'] || '',
            program: row['Program'] || 'UG',
            branch: row['Branch'] || '',
            parentPhone: String(row['Parent Phone'] || row['Phone'] || row['parentPhone'] || ''),
            interHallTicket: interHallTicket,
            academicYear: row['Academic Year'] || row['Year'] || new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
            status: 'Pending',
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
              others: ""
            }
          };
        }).filter((s: any) => s.name && s.admissionNo);
        
        if (studentsToInsert.length > 0) {
          if (supabase) {
            const { error } = await supabase.from('students').insert(studentsToInsert);
            if (error) {
               console.error("Bulk upload error:", error);
               if (error.code === '23505') {
                 alert("Upload blocked: Some students physically already exist or interHallTicket uniqueness violation. Remove duplicates from excel.");
               } else {
                 alert("Upload failed: " + error.message);
               }
            } else {
               await fetchStudents();
               alert(`Successfully bulk-imported ${studentsToInsert.length} students!`);
            }
          }
        } else {
          alert('No valid student entries found. Ensure columns match: "Admission No", "Student Name", "Inter Hall Ticket".');
        }
      } catch (err: any) {
        console.error("Parsing error:", err);
        alert("Error parsing excel file: " + (err.message || 'unknown element'));
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const handleAction = (student: Student) => {
    setActionStudent(student);
  };

  const handleChangeStatus = async (status: 'Pending' | 'Verified') => {
    if (!actionStudent) return;
    setIsUpdatingStatus(true);
    await updateStudent(actionStudent.id, { status });
    setIsUpdatingStatus(false);
    setActionStudent(null);
  };

  const handleVerifyNavigate = () => {
    if (!actionStudent) return;
    setCurrentStudent(actionStudent);
    navigate('/verify');
    setActionStudent(null);
  };

  const handlePrintNavigate = () => {
    if (!actionStudent) return;
    setCurrentStudent(actionStudent);
    navigate('/receipt');
    setActionStudent(null);
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent({ ...student });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    await updateStudent(editingStudent.id, editingStudent);
    setEditingStudent(null);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      setIsDeleting(true);
      console.log(`Dashboard: Initiating deletion for student ${studentToDelete.name} (${studentToDelete.id})`);
      await deleteStudent(studentToDelete.id);
      console.log(`Dashboard: Deletion successful for ${studentToDelete.id}`);
      setStudentToDelete(null);
    } catch (error) {
      console.error("Dashboard: Deletion failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadExcel = () => {
    // Transform students data to a flat format for Excel
    const data = students.map((s) => {
      const docs = s.documents;
      return {
        'Admission No': s.admissionNo,
        'Inter Hall Ticket': s.interHallTicket,
        'Student Name': s.name,
        'Father Name': s.fatherName,
        'Program': s.program,
        'Branch': s.branch,
        'Parent Phone': s.parentPhone,
        'Academic Year': s.academicYear,
        'Status': s.status,
        'Docs Checklist': getChecklistItems(s.program).map(item => {
          const isGiven = !!s.documents[item.key as keyof typeof s.documents];
          return `${item.label}: ${isGiven ? 'GIVEN' : 'NOT GIVEN'}`;
        }).join(' | ') + (s.documents.others ? ` | OTHER: ${s.documents.others} (GIVEN)` : ''),
        'Registration Date': new Date(s.createdAt).toLocaleDateString()
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'admissionslip.xlsx');
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Admission No': '24/CS/101',
        'Student Name': 'John Doe',
        'Father Name': 'Richard Doe',
        'Program': 'UG',
        'Branch': 'CSE',
        'Parent Phone': '9876543210',
        'Inter Hall Ticket': 'HT12345678',
        'Academic Year': '2024-2025'
      },
      {
        'Admission No': '24/EC/102',
        'Student Name': 'Jane Smith',
        'Father Name': 'Robert Smith',
        'Program': 'UG',
        'Branch': 'ECE',
        'Parent Phone': '9876543211',
        'Inter Hall Ticket': 'HT12345679',
        'Academic Year': '2024-2025'
      }
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Admission No
      { wch: 25 }, // Student Name
      { wch: 25 }, // Father Name
      { wch: 10 }, // Program
      { wch: 10 }, // Branch
      { wch: 15 }, // Parent Phone
      { wch: 20 }, // Inter Hall Ticket
      { wch: 15 }, // Academic Year
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
  };

  const filteredStudents = students.filter(
    (s) => {
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = s.name.toLowerCase().includes(searchLower) ||
                          s.admissionNo.toLowerCase().includes(searchLower) ||
                          s.interHallTicket.toLowerCase().includes(searchLower) ||
                          s.parentPhone.toLowerCase().includes(searchLower) ||
                          (s.fatherName && s.fatherName.toLowerCase().includes(searchLower)) ||
                          (s.program && s.program.toLowerCase().includes(searchLower)) ||
                          (s.branch && s.branch.toLowerCase().includes(searchLower));
      
      const branchMatch = branchFilter ? s.branch === branchFilter : true;
      const statusMatch = statusFilter ? s.status === statusFilter : true;
      const programMatch = programFilter ? s.program === programFilter : true;
      const yearMatch = yearFilter ? s.academicYear === yearFilter : true;
      
      return searchMatch && branchMatch && statusMatch && programMatch && yearMatch;
    }
  );

  const stats = [
    { 
      label: 'Total Students', 
      value: students.length, 
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200',
      iconBg: 'bg-white/20 text-white'
    },
    { 
      label: 'Verified', 
      value: students.filter((s) => s.status === 'Verified').length, 
      icon: UserCheck,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200',
      iconBg: 'bg-white/20 text-white'
    },
    { 
      label: 'Pending', 
      value: students.filter((s) => s.status === 'Pending').length, 
      icon: Clock,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200',
      iconBg: 'bg-white/20 text-white'
    },
  ];

  return (
    <div className="space-y-5">
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ scale: 1.02, translateY: -2 }}
            className={`rounded-xl p-5 shadow-md ${stat.bgColor} flex items-center justify-between cursor-default transition-all`}
          >
            <div>
              <div className={`text-3xl font-bold ${stat.color} drop-shadow-sm`}>{stat.value}</div>
              <div className="text-[13px] font-medium text-white/90 mt-1">{stat.label}</div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.iconBg}`}>
              <stat.icon className="w-6 h-6 drop-shadow-sm" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
        <div className="flex flex-col mb-4 pb-4 border-b border-slate-200 gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-800">All Registered Students</h3>
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                onClick={handleDownloadTemplate}
                title="Download Template"
                className="text-sm border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 font-semibold px-3 py-2 rounded-md transition-all flex items-center shrink-0"
              >
                <Download className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Template</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Import Excel"
                className="text-sm border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100 font-semibold px-3 py-2 rounded-md transition-all flex items-center shrink-0"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-blue-700/30 border-t-blue-700 rounded-full animate-spin sm:mr-1.5" />
                ) : (
                  <Upload className="w-4 h-4 sm:mr-1.5" />
                )}
                <span className="hidden sm:inline">{isUploading ? 'Importing...' : 'Import'}</span>
              </button>
              <button 
                onClick={handleDownloadExcel}
                title="Download Excel"
                className="text-sm border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 font-semibold px-3 py-2 rounded-md transition-all flex items-center shrink-0"
              >
                <Download className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button 
                onClick={() => navigate('/add-student')}
                className="text-sm bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition-all shrink-0"
              >
                + Add New
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap gap-3 items-center">
            <div className="flex items-center text-slate-500 mr-2 shrink-0">
              <Filter className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Filters:</span>
            </div>
            
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Name, Adm No, HT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select 
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-[13px] border border-slate-200 bg-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-700"
            >
              <option value="">Search Branch</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[13px] border border-slate-200 bg-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-700"
            >
              <option value="">Search Status</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>

            <select 
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="text-[13px] border border-slate-200 bg-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-700"
            >
              <option value="">By Program</option>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>

            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="text-[13px] border border-slate-200 bg-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-700"
            >
              <option value="">By Year</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            
            {(branchFilter || statusFilter || programFilter || yearFilter) && (
              <button 
                onClick={() => {
                  setBranchFilter('');
                  setStatusFilter('');
                  setProgramFilter('');
                  setYearFilter('');
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight flex items-center"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
              <th className="px-2 py-3 font-semibold">Adm No.</th>
              <th className="px-2 py-3 font-semibold">Hall Ticket</th>
              <th className="px-2 py-3 font-semibold">Student Name</th>
              <th className="px-2 py-3 font-semibold">Program</th>
              <th className="px-2 py-3 font-semibold">Branch</th>
              <th className="px-2 py-3 font-semibold">Year</th>
              <th className="px-2 py-3 font-semibold">Status</th>
              <th className="px-2 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
               <tr>
                <td colSpan={8} className="px-2 py-8 text-center bg-white text-slate-500 text-sm">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    Loading database...
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {filteredStudents.map((student, index) => (
                  <motion.tr 
                    key={student.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.5) }}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setViewStudent(student)}
                  >
                    <td className="px-2 py-3 text-sm font-semibold text-slate-800">{student.admissionNo}</td>
                    <td className="px-2 py-3 text-sm text-slate-500">{student.interHallTicket}</td>
                    <td className="px-2 py-3 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        {student.name}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm font-bold text-blue-600">{student.program}</td>
                    <td className="px-2 py-3 text-sm text-slate-700">{student.branch}</td>
                    <td className="px-2 py-3 text-sm text-slate-500">{student.academicYear}</td>
                    <td className="px-2 py-3 text-sm">
                      <span 
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          student.status === 'Verified' 
                            ? 'text-emerald-700 bg-emerald-100 border border-emerald-200 shadow-sm' 
                            : 'text-amber-700 bg-amber-100 border border-amber-200 shadow-sm'
                        }`}
                      >
                        {student.status === 'Verified' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        {student.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(student)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-md transition-all"
                          title="Edit Student"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setStudentToDelete(student)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-md transition-all"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleAction(student)}
                          className={`px-3 py-1 text-[12px] font-bold rounded transition-all ml-1 ${
                            student.status === 'Verified'
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          {student.status === 'Verified' ? 'View Slip' : 'Take Action'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
            {!isLoading && filteredStudents.length === 0 && (
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <td colSpan={8} className="px-2 py-8 text-center text-slate-500 text-sm">
                  No matching students found based on current filters.
                </td>
              </motion.tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
      {/* Action Selection Modal */}
      <AnimatePresence>
        {actionStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionStudent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  actionStudent.status === 'Verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Choose Action</h3>
                <p className="text-xs text-slate-500 mt-1">
                  How would you like to proceed with <span className="font-bold text-slate-800">{actionStudent.name}</span>?
                </p>
              </div>

              <div className="p-4 space-y-2">
                {actionStudent.status === 'Verified' ? (
                  <>
                    <button 
                      onClick={handlePrintNavigate}
                      className="w-full flex items-center justify-between px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all group font-semibold shadow-md shadow-emerald-100"
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 mr-3 opacity-80" />
                        <span>View / Print Receipt</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleChangeStatus('Pending')}
                      disabled={isUpdatingStatus}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all font-medium"
                    >
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-3 text-amber-500" />
                        <span>Mark as Pending</span>
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleVerifyNavigate}
                      className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all group font-semibold shadow-md shadow-blue-100"
                    >
                      <div className="flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-3 opacity-80" />
                        <span>Verify Documents Now</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleChangeStatus('Verified')}
                      disabled={isUpdatingStatus}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all font-medium"
                    >
                      <div className="flex items-center">
                        <UserCheck className="w-5 h-5 mr-3 text-emerald-500" />
                        <span>Quick Mark as Verified</span>
                      </div>
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => setActionStudent(null)}
                  className="w-full py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewStudent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Student Details
                </h3>
                <button 
                  onClick={() => setViewStudent(null)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                    <p className="text-sm font-semibold text-slate-800">{viewStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Father's Name</p>
                    <p className="text-sm font-semibold text-slate-800">{viewStudent.fatherName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Admission No</p>
                    <p className="text-sm font-semibold text-slate-800">{viewStudent.admissionNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Inter Hall Ticket</p>
                    <p className="text-sm font-semibold text-slate-800">{viewStudent.interHallTicket || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Program & Branch</p>
                    <p className="text-sm font-semibold text-slate-800">{viewStudent.program} - {viewStudent.branch}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <span 
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        viewStudent.status === 'Verified' 
                          ? 'text-emerald-700 bg-emerald-100 border border-emerald-200 shadow-sm' 
                          : 'text-amber-700 bg-amber-100 border border-amber-200 shadow-sm'
                      }`}
                    >
                      {viewStudent.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Documents Checklist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getChecklistItems(viewStudent.program).map(item => {
                      const isGiven = !!viewStudent.documents[item.key];
                      const uploadedUrl = viewStudent.uploadedFiles?.[item.key];
                      return (
                        <div key={item.key} className="flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50">
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${isGiven ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 border-slate-300'}`}>
                              {isGiven && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold uppercase ${isGiven ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</p>
                            </div>
                          </div>
                          {uploadedUrl && (
                            <div className="mt-2 ml-6">
                              <a href={uploadedUrl} download={`${item.key}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-md transition-colors shadow-sm w-fit">
                                <Download className="w-3.5 h-3.5" /> Download Document
                              </a>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {viewStudent.documents.others && (
                      <div className="flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50 col-span-1 sm:col-span-2">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border bg-emerald-500 border-emerald-500">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold uppercase text-slate-800">Others: {viewStudent.documents.others}</p>
                            </div>
                          </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end">
                 <button 
                   onClick={() => setViewStudent(null)}
                   className="px-6 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                 >
                   Close
                 </button>
                 <button 
                    onClick={() => {
                      setViewStudent(null);
                      handleAction(viewStudent);
                    }}
                    className={`ml-3 px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                      viewStudent.status === 'Verified'
                        ? 'text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                        : 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200'
                    }`}
                  >
                    {viewStudent.status === 'Verified' ? 'View Slip' : 'Take Action'}
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingStudent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Edit Student Details
                </h3>
                <button 
                  onClick={() => setEditingStudent(null)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpdateStudent} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-1">
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Full Name</label>
                    <input 
                      type="text" 
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Father's Name</label>
                    <input 
                      type="text" 
                      value={editingStudent.fatherName || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, fatherName: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Admission No</label>
                    <input 
                      type="text" 
                      value={editingStudent.admissionNo}
                      onChange={(e) => setEditingStudent({...editingStudent, admissionNo: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Inter Hall Ticket</label>
                    <input 
                      type="text" 
                      value={editingStudent.interHallTicket || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, interHallTicket: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Program</label>
                    <select
                      value={editingStudent.program || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, program: e.target.value as 'UG' | 'PG'})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="UG">UG</option>
                      <option value="PG">PG</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Branch</label>
                    <input 
                      type="text" 
                      value={editingStudent.branch}
                      onChange={(e) => setEditingStudent({...editingStudent, branch: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Parent Phone</label>
                    <input 
                      type="text" 
                      value={editingStudent.parentPhone}
                      onChange={(e) => setEditingStudent({...editingStudent, parentPhone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Academic Year</label>
                    <input 
                      type="text" 
                      value={editingStudent.academicYear}
                      onChange={(e) => setEditingStudent({...editingStudent, academicYear: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStudentToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Student?</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to remove <span className="font-bold text-slate-800">{studentToDelete.name}</span>? 
                  This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="px-6 py-4 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setStudentToDelete(null)}
                  className="flex-1 py-2 text-sm font-semibold text-slate-600 hover:bg-white border border-slate-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteStudent}
                  disabled={isDeleting}
                  className="flex-1 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-lg shadow-md shadow-rose-100 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
