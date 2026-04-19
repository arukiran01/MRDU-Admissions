import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '../types';
import { supabase } from '../lib/supabase';

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
    if (supabase) {
      try {
        const { error } = await supabase.from('students').select('id', { count: 'exact', head: true }).limit(1);
        if (!error) {
          setDbStatus('connected');
        } else {
          console.error("Supabase Connection Check failed:", error.message);
          setDbStatus('error');
        }
      } catch (e) {
        setDbStatus('error');
      }
    } else {
      setDbStatus('memory');
    }
  };

  const fetchStudents = async () => {
    if (!supabase) {
      console.warn("Supabase: Client missing. Cannot fetch.");
      setDbStatus('memory');
      setIsLoading(false);
      return;
    }

    try {
      const { data: rawData, error } = await supabase
        .from('students')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      const data = (rawData || []).map((s: any) => ({
        ...s,
        status: s.status === 'Hold' ? 'Pending' : s.status
      }));
      
      setStudents(data);
      
      if (currentStudent) {
        const freshCurrent = data.find((s: Student) => s.id === currentStudent.id);
        if (freshCurrent) setCurrentStudent(freshCurrent);
      }
      setDbStatus('connected');
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
      setDbStatus('error');
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
    if (!supabase) return false;

    const previousStudents = [...students];
    setStudents((prev) => [student, ...prev]);
    setCurrentStudent(student);

    try {
      const { error } = await supabase.from('students').insert([student]);
      
      if (error) {
        if (error.code === '23505') {
          throw new Error("A student with this Inter Hall Ticket already exists.");
        }
        throw error;
      }
      
      // Google Sheets Webhook Sync (optional client-side)
      const sheetsWebhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
      if (sheetsWebhookUrl) {
        fetch(sheetsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student)
        }).catch(err => console.error("Sheets sync failed:", err));
      }

      await fetchStudents();
      return true;
    } catch (e: any) {
      console.error("Failed adding to Supabase:", e.message);
      setStudents(previousStudents);
      return false;
    }
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    if (!supabase) return;

    const previousStudents = [...students];
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    if (currentStudent?.id === id) {
      setCurrentStudent((prev) => (prev ? { ...prev, ...data } : null));
    }

    try {
      const { error } = await supabase.from('students').update(data).eq('id', id);
      if (error) throw error;
      await fetchStudents();
    } catch (e: any) {
      console.error("Failed updating Supabase:", e.message);
      setStudents(previousStudents);
    }
  };

  const deleteStudent = async (id: string) => {
    if (!supabase) return;

    const previousStudents = [...students];
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (currentStudent?.id === id) {
      setCurrentStudent(null);
    }

    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      await fetchStudents();
    } catch (e: any) {
      console.error("Failed deleting from Supabase:", e.message);
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

