import { Users, UserCheck, Clock, Search, Download, Filter, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const { students, auditLogs, setCurrentStudent, isLoading } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const branches = [...new Set(students.map(s => s.branch))];
  const academicYears = [...new Set(students.map(s => s.academicYear))];

  const handleVerify = (student: any) => {
    setCurrentStudent(student);
    navigate('/verify');
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
    XLSX.writeFile(workbook, 'MRDU_Students_Data.xlsx');
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
          <div key={i} className={`rounded-xl p-5 shadow-md ${stat.bgColor} flex items-center justify-between`}>
            <div>
              <div className={`text-3xl font-bold ${stat.color} drop-shadow-sm`}>{stat.value}</div>
              <div className="text-[13px] font-medium text-white/90 mt-1">{stat.label}</div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.iconBg}`}>
              <stat.icon className="w-6 h-6 drop-shadow-sm" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
          <div className="flex flex-col mb-4 pb-4 border-b border-slate-200 gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-800">Recent Students</h3>
              <div className="flex gap-2">
                 <button 
                  onClick={handleDownloadExcel}
                  title="Download Excel"
                  className="text-sm border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-3 py-2 rounded-md transition-colors flex items-center shrink-0"
                >
                  <Download className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button 
                  onClick={() => navigate('/add-student')}
                  className="text-sm bg-transparent border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold px-4 py-2 rounded-md transition-colors shrink-0"
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
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
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
                    <button 
                      onClick={() => handleVerify(student)}
                      className="text-[13px] text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {student.status === 'Verified' ? 'View/Print' : 'Verify Docs'}
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-slate-500 text-sm">
                    No matching students found based on current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* Audit Log Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-[500px] xl:h-auto overflow-hidden">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-800">Recent Activity Logs</h3>
          </div>
          
          <div className="overflow-y-auto flex-1 pr-2 space-y-4">
            {auditLogs.length > 0 ? auditLogs.map((log) => (
              <div key={log.id} className="text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-slate-800 text-[13px] inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wider">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600 text-[13px] leading-snug">{log.details}</p>
                <div className="text-[10px] text-slate-400 mt-1">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <hr className="mt-3 border-slate-100" />
              </div>
            )) : (
              <div className="text-center text-slate-500 text-sm mt-8">
                No recent activity.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
