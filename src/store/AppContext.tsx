import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '../types';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for Frontend (Real-time)
const MANUAL_SUPABASE_URL = "https://laaholzwfjahuugaqzfh.supabase.co";
const MANUAL_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYWhvbHp3ZmphaHV1Z2FxemZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTgyNjAsImV4cCI6MjA5MjA3NDI2MH0._qdq6eFs1pnYUQ5mCMqbVbIql7IX60Qsax8Te5W6JC8";

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
        // Be very strict: only mark connected if it's NOT disconnected
        if (data.database === 'disconnected' || data.database === 'memory-fallback') {
          setDbStatus('memory');
        } else if (data.database === 'connected-as-anon' || data.database === 'connected-as-service-role') {
          setDbStatus('connected');
        } else {
          setDbStatus('memory');
        }
      } else {
        const text = await response.text();
        console.error(`Health check failed (${response.status}):`, text.substring(0, 50));
        setDbStatus('error');
      }
    } catch (e: any) {
      console.error("Health check fetch error (Failed to fetch):", e.message);
      setDbStatus('error');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      
      if (response.ok) {
        try {
          const rawData = await response.json();
          // Normalize status: treat 'Hold' as 'Pending' for UI consistency
          const data = rawData.map((s: any) => ({
            ...s,
            status: s.status === 'Hold' ? 'Pending' : s.status
          }));
          
          setStudents((prev) => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
          
          if (currentStudent) {
            const freshCurrent = data.find((s: Student) => s.id === currentStudent.id);
            if (freshCurrent && JSON.stringify(freshCurrent) !== JSON.stringify(currentStudent)) {
              setCurrentStudent(freshCurrent);
            }
          }
        } catch (parseError) {
          const text = await response.text();
          console.error("Fetch Students JSON Parse Error:", parseError, "Response Text:", text.substring(0, 100));
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

    let channel: any = null;

    if (supabase) {
      console.log("Supabase: Setting up Realtime channel...");
      channel = supabase
        .channel('public:students')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'students' },
          (payload) => {
            console.log("Supabase: Realtime change detected:", payload.eventType);
            fetchStudents();
          }
        )
        .subscribe((status) => {
          console.log("Supabase: Realtime subscription status:", status);
        });
    }

    // Polling as a safety net (slower)
    const interval = setInterval(() => {
      if (dbStatus !== 'connected') {
        fetchStudents();
        checkHealth();
      }
    }, 15000); 
    
    return () => {
      if (channel) {
        supabase?.removeChannel(channel);
      }
      clearInterval(interval);
    };
  }, []); // Run on mount only

  const addStudent = async (student: Student) => {
    const previousStudents = [...students];
    setStudents((prev) => [student, ...prev]);
    setCurrentStudent(student);

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Database insertion failed";
        try {
          const data = JSON.parse(text);
          errorMessage = data.error || (data.details ? `${data.error}: ${data.details}` : errorMessage);
        } catch (e) {
          errorMessage = `Server Error (${response.status}): ${text.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }
      await fetchStudents();
      return true;
    } catch (e: any) {
      console.error("Failed adding to backend:", e);
      alert(`Sync Error: ${e.message}`);
      setStudents(previousStudents);
      await fetchStudents();
      return false;
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
        const text = await response.text();
        let errorMessage = "Update failed";
        try {
          const resData = JSON.parse(text);
          errorMessage = resData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server Error (${response.status}): ${text.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }
      await fetchStudents();
    } catch (e: any) {
      console.error("Failed updating backend:", e);
      alert(`Sync Error: ${e.message}`);
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
        isLoading,
        dbStatus
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

