import { Users, UserCheck, Clock, Search, Download, Filter, Edit, X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import React, { useState } from 'react';
import { Student } from '../types';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { students, setCurrentStudent, updateStudent, deleteStudent, isLoading } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const branches = [...new Set(students.map(s => s.branch))];
  const academicYears = [...new Set(students.map(s => s.academicYear))];

  const handleVerify = (student: Student) => {
    setCurrentStudent(student);
    if (student.status === 'Verified') {
      navigate('/receipt');
    } else {
      navigate('/verify');
    }
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
    setIsDeleting(true);
    await deleteStudent(studentToDelete.id);
    setIsDeleting(false);
    setStudentToDelete(null);
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
        'Branch': s.branch,
        'Parent Phone': s.parentPhone,
        'Academic Year': s.academicYear,
        'Status': s.status,
        'Docs Verified': [
          docs.ssc && 'SSC',
          docs.schoolBonafide && 'School Bonafide',
          docs.interBonafide && 'Inter Bonafide',
          docs.tc && 'TC',
          docs.interPC && 'Inter PC',
          docs.degreeCMM && 'Degree CMM',
          docs.degreePC && 'Degree PC',
          docs.aadhaar && 'Aadhaar',
          docs.rankCard && 'Rank Card',
        ].filter(Boolean).join(', '),
        'Registration Date': new Date(s.createdAt).toLocaleDateString()
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'admissionslip.xlsx');
  };

  const filteredStudents = students.filter(
    (s) => {
      const searchMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.interHallTicket.toLowerCase().includes(searchTerm.toLowerCase());
      
      const branchMatch = branchFilter ? s.branch === branchFilter : true;
      const statusMatch = statusFilter ? s.status === statusFilter : true;
      const yearMatch = yearFilter ? s.academicYear === yearFilter : true;
      
      return searchMatch && branchMatch && statusMatch && yearMatch;
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
              className="text-[13px] border border-slate-200 bg-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[13px] border border-slate-200 bg-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>

            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="text-[13px] border border-slate-200 bg-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">All Years</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
              <th className="px-2 py-3 font-semibold">Adm No.</th>
              <th className="px-2 py-3 font-semibold">Hall Ticket</th>
              <th className="px-2 py-3 font-semibold">Student Name</th>
              <th className="px-2 py-3 font-semibold">Branch</th>
              <th className="px-2 py-3 font-semibold">Year</th>
              <th className="px-2 py-3 font-semibold">Status</th>
              <th className="px-2 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
               <tr>
                <td colSpan={7} className="px-2 py-8 text-center bg-white text-slate-500 text-sm">
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
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-2 py-3 text-sm font-semibold text-slate-800">{student.admissionNo}</td>
                    <td className="px-2 py-3 text-sm text-slate-500">{student.interHallTicket}</td>
                    <td className="px-2 py-3 text-sm text-slate-700">{student.name}</td>
                    <td className="px-2 py-3 text-sm text-slate-700">{student.branch}</td>
                    <td className="px-2 py-3 text-sm text-slate-500">{student.academicYear}</td>
                    <td className="px-2 py-3 text-sm">
                      <span 
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          student.status === 'Verified' 
                            ? 'text-emerald-600 bg-emerald-50' 
                            : 'text-amber-600 bg-amber-50'
                        }`}
                      >
                        {student.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
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
                          onClick={() => handleVerify(student)}
                          className="px-3 py-1 text-[12px] text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded font-semibold transition-all ml-1"
                        >
                          {student.status === 'Verified' ? 'View/Print' : 'Verify'}
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
                <td colSpan={7} className="px-2 py-8 text-center text-slate-500 text-sm">
                  No matching students found based on current filters.
                </td>
              </motion.tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
      {/* Edit Modal */}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Full Name</label>
                    <input 
                      type="text" 
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
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
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Academic Year</label>
                    <input 
                      type="text" 
                      value={editingStudent.academicYear}
                      onChange={(e) => setEditingStudent({...editingStudent, academicYear: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Branch</label>
                    <input 
                      type="text" 
                      value={editingStudent.branch}
                      onChange={(e) => setEditingStudent({...editingStudent, branch: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
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
