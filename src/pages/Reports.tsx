import React from 'react';
import { useAppContext } from '../store/AppContext';
import { motion } from 'motion/react';
import { BarChart3, PieChart, Users, FileDown, Download, CheckCircle2, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { students } = useAppContext();

  const totalStudents = students.length;
  const verifiedCount = students.filter(s => s.status === 'Verified').length;
  const pendingCount = students.filter(s => s.status === 'Pending').length;

  // Branch statistics
  const branchCounts = students.reduce((acc: Record<string, number>, s) => {
    acc[s.branch] = (acc[s.branch] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const branchStats = Object.entries(branchCounts).map(([name, count]) => ({
    name,
    count: count as number,
    percentage: (((count as number) / (totalStudents || 1)) * 100).toFixed(1)
  })).sort((a, b) => (b.count as number) - (a.count as number));

  // Academic Year statistics
  const yearCounts = students.reduce((acc: Record<string, number>, s) => {
    acc[s.academicYear] = (acc[s.academicYear] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExportFull = () => {
    const data = students.map(s => ({
      'Registration Date': new Date(s.createdAt).toLocaleDateString(),
      'Admission No': s.admissionNo,
      'Student Name': s.name,
      'Father Name': s.fatherName,
      'Branch': s.branch,
      'Parent Phone': s.parentPhone,
      'Academic Year': s.academicYear,
      'Status': s.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Full Report');
    XLSX.writeFile(workbook, `MRDU_Full_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const statCards = [
    { label: 'Total Registrations', value: totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Documents Verified', value: verifiedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Awaiting Verification', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Admissions Reports</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Real-time Statistical Overview</p>
        </div>
        <button 
          onClick={handleExportFull}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Export Master Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-5 rounded-xl border border-slate-100 shadow-sm bg-white flex items-center justify-between`}
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-full flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide">Course-wise Distribution</h3>
            </div>
          </div>

          <div className="space-y-4">
            {branchStats.map((branch, i) => (
              <div key={branch.name} className="relative">
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <span className="text-[12px] font-bold text-slate-700">{branch.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400">{branch.percentage}%</span>
                    <span className="text-[12px] font-black text-slate-800">{branch.count}</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${branch.percentage}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Years & Status summary */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-1">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-50">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide">Verification Progress</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs shadow-sm">
                    {Math.round((verifiedCount / totalStudents) * 100 || 0)}%
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">Verified & Completed</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Ready for Admission</p>
                  </div>
                </div>
                <span className="text-xl font-black text-emerald-700">{verifiedCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-amber-200 rounded-full flex items-center justify-center text-amber-600 font-bold text-xs shadow-sm">
                    {Math.round((pendingCount / totalStudents) * 100 || 0)}%
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">Pending Verification</p>
                    <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">In Pipeline</p>
                  </div>
                </div>
                <span className="text-xl font-black text-amber-700">{pendingCount}</span>
              </div>
            </div>

            <div className="mt-8">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Registrations per Academic Year</h4>
               <div className="flex flex-wrap gap-2">
                 {Object.entries(yearCounts).map(([year, count]) => (
                   <div key={year} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-2">
                     <span className="text-[11px] font-black text-slate-800">{year}</span>
                     <div className="w-px h-3 bg-slate-300"></div>
                     <span className="text-[11px] font-bold text-blue-600">{count} Units</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
