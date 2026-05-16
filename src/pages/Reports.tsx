import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  PieChart, 
  Users, 
  FileDown, 
  RefreshCcw, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { students, fetchStudents } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalStudents = students.length;
  const verifiedCount = students.filter(s => s.status === 'Verified').length;
  const pendingCount = students.filter(s => s.status === 'Pending').length;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    setTimeout(() => setIsRefreshing(false), 800);
  };

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

  const handleExportFull = () => {
    const data = students.map(s => ({
      'Registration Date': new Date(s.createdAt).toLocaleDateString(),
      'Admission No': s.admissionNo,
      'Student Name': s.name,
      'Father Name': s.fatherName,
      'Branch': s.branch,
      'Phone': s.parentPhone,
      'Academic Year': s.academicYear,
      'Status': s.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Data');
    XLSX.writeFile(workbook, `MRDU_Master_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const statCards = [
    { label: 'Total Registrations', value: totalStudents, sub: 'Lifetime count', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Verified Students', value: verifiedCount, sub: `${Math.round((verifiedCount/totalStudents)*100 || 0)}% conversion`, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Initial Pending', value: pendingCount, sub: 'Awaiting checks', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">University Analytics Dashboard</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Live admissions performance tracking</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
          <button 
            onClick={handleExportFull}
            className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-200"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Master Export
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Metric</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
            <p className="text-[13px] font-bold text-slate-800 mt-1">{stat.label}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Distribution Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-50">
            <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Course Enrollment Breakdown
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {branchStats.length > 0 ? branchStats.map((branch, i) => (
              <div key={branch.name} className="relative">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[12px] font-black text-slate-700">{branch.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-extrabold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{branch.percentage}%</span>
                    <span className="text-[14px] font-black text-slate-900 w-8 text-right">{branch.count}</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${branch.percentage}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm"
                  />
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-slate-400 font-medium italic">No admissions data recorded yet.</div>
            )}
          </div>
        </div>

        {/* Verification Tracking */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-50">
            <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              Verification Funnel
            </h3>
          </div>
          
          <div className="p-6 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                  <span className="text-[24px] font-black text-emerald-700">{verifiedCount}</span>
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Verified Cases</span>
               </div>
               <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col items-center text-center">
                  <Clock className="w-8 h-8 text-amber-600 mb-2" />
                  <span className="text-[24px] font-black text-amber-700">{pendingCount}</span>
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Awaiting Check</span>
               </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Efficiency Benchmark</h4>
                  <span className="text-[11px] font-bold text-slate-800">{Math.round((verifiedCount/totalStudents)*100 || 0)}% Target Met</span>
               </div>
               <div className="h-4 w-full bg-white border border-slate-200 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(verifiedCount/totalStudents)*100 || 0}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all"
                  />
               </div>
               <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                 Total verified documents relative to total intake. Higher percentage indicates faster administrative processing.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Admissions Preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Recent Admissions (Live Feed)</h3>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Top 5</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-100">
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Branch</th>
                <th className="px-6 py-3">Adm No</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.slice(0, 5).map((s) => (
                <tr key={s.id} className="text-[13px] font-medium text-slate-700 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                  <td className="px-6 py-4">{s.branch}</td>
                  <td className="px-6 py-4 font-mono">{s.admissionNo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 font-bold">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest">No entries found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

