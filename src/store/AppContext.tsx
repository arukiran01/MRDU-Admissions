import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '../types';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for Frontend (Real-time)
const MANUAL_SUPABASE_URL = "https://laaholzwfjahuugaqzfh.supabase.co";
const MANUAL_SUPABASE_KEY = "sb_publishable_jyfddtLDeyAYEM15IxqjEg_pku83Toq";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || MANUAL_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || MANUAL_SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface AppContextType {
  students: Student[];
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  logAction: (action: string, details: string, studentId?: string) => Promise<void>;
  fetchStudents: () => Promise<void>;
  currentStudent: Student | null;
  setCurrentStudent: (student: Student | null) => void;
  isLoading: boolean;
  dbStatus: 'connected' | 'error' | 'memory' | 'checking';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'memory' | 'checking'>('checking');

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        if (data.database === 'connected-as-anon' || data.database === 'connected-as-service-role') {
          setDbStatus('connected');
        } else if (data.database === 'memory-fallback' || data.database === 'disconnected') {
          setDbStatus('memory');
        }
      } else {
        setDbStatus('error');
      }
    } catch (e) {
      setDbStatus('error');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents((prev) => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
        
        if (currentStudent) {
          const freshCurrent = data.find((s: Student) => s.id === currentStudent.id);
          if (freshCurrent && JSON.stringify(freshCurrent) !== JSON.stringify(currentStudent)) {
            setCurrentStudent(freshCurrent);
          }
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Subscriptions + Fallback Polling
  useEffect(() => {
    checkHealth();
    fetchStudents();

    let subscription: any = null;

    if (supabase) {
      subscription = supabase
        .channel('students-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
          fetchStudents();
        })
        .subscribe();
    }

    const interval = setInterval(() => {
      fetchStudents();
      checkHealth();
    }, 5000); 
    
    return () => {
      if (subscription) supabase?.removeChannel(subscription);
      clearInterval(interval);
    };
  }, [currentStudent?.id]);

  const addStudent = async (student: Student) => {
    setStudents((prev) => [student, ...prev]);
    setCurrentStudent(student);

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Database insertion failed");
      }
      await fetchStudents();
    } catch (e: any) {
      console.error("Failed adding to backend:", e);
      alert(`Backend Error: ${e.message}`);
      await fetchStudents();
    }
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    const previousStudents = [...students];
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    if (currentStudent?.id === id) {
      setCurrentStudent((prev) => (prev ? { ...prev, ...data } : null));
    }

    try {
      const response = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Update failed");
      }
      await fetchStudents();
    } catch (e: any) {
      console.error("Failed updating backend:", e);
      alert(`Backend Error: ${e.message}`);
      setStudents(previousStudents);
    }
  };

  const deleteStudent = async (id: string) => {
    const previousStudents = [...students];

    // Optimistic UI update
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (currentStudent?.id === id) {
      setCurrentStudent(null);
    }

    // Backend sync
    try {
      const response = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error("Deletion failed");
      
      await fetchStudents();
    } catch (e) {
      console.error("Failed deleting from backend:", e);
      setStudents(previousStudents);
    }
  };

  const logAction = async (action: string, details: string, studentId?: string) => {
    // Audit logs removed per user request "remove recent activity"
    // Method preserved for interface compatibility but performs no operation
    console.log(`Action Log (Suppressed): ${action} - ${details}`);
  };

  return (
    <AppContext.Provider
      value={{
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        logAction,
        fetchStudents,
        currentStudent,
        setCurrentStudent,
        isLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

