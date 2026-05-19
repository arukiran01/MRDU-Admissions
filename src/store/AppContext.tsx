import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  students: Student[];
  addStudent: (student: Student) => Promise<{ success: boolean; errorMessage?: string }>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<{ success: boolean; errorMessage?: string }>;
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
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

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
      
      if (error) {
        console.error("Supabase Select Error Details:", {
          message: error.message,
          code: error.code,
          hint: error.hint
        });
        throw error;
      }
      
      const data = (rawData || [])
        .filter((s: any) => !deletedIds.has(s.id))
        .map((s: any) => {
          let parsedDocs = s.documents || {};
          if (typeof parsedDocs === 'string') {
            try { parsedDocs = JSON.parse(parsedDocs); } catch(e) { parsedDocs = {}; }
          }
          let parsedFiles = s.uploadedFiles || {};
          if (typeof parsedFiles === 'string') {
            try { parsedFiles = JSON.parse(parsedFiles); } catch(e) { parsedFiles = {}; }
          }
          return {
            ...s,
            documents: parsedDocs,
            uploadedFiles: parsedFiles,
            status: s.status === 'Hold' ? 'Pending' : s.status
          };
        });
      
      setStudents(data);
      
      if (currentStudent) {
        const freshCurrent = data.find((s: Student) => s.id === currentStudent.id);
        if (freshCurrent) setCurrentStudent(freshCurrent);
      }
      setDbStatus('connected');
    } catch (error: any) {
      console.error("fetchStudents: Network or Supabase error occurred:", error.message);
      // Logic for generic "Failed to fetch" which usually means network/CORS/Blocked
      if (error.message?.includes('fetch')) {
        console.warn("Hint: 'Failed to fetch' usually indicates the Supabase URL is unreachable or blocked.");
      }
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
            // If it's a delete event from elsewhere, clear it from our guard set
            if (payload.eventType === 'DELETE' && payload.old?.id) {
              setDeletedIds(prev => {
                const next = new Set(prev);
                next.delete(payload.old.id);
                return next;
              });
            }
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

  const addStudent = async (student: Student): Promise<{ success: boolean; errorMessage?: string }> => {
    const previousStudents = [...students];
    
    // Always update local state for immediate feedback
    setStudents((prev) => [student, ...prev]);
    setCurrentStudent(student);

    if (!supabase) {
      console.warn("Memory Mode: Student saved only to local state.");
      setDbStatus('memory');
      return { success: true };
    }

    try {
      const { error } = await supabase.from('students').insert([student]);
      
      if (error) {
        if (error.code === '23505') {
          throw new Error("Duplicate Entry: A student with this Admission/Enquiry Number already exists.");
        }
        if (error.message?.includes("schema cache") || error.message?.includes("column") || error.message?.includes("invalid input") || error.message?.includes("constraint")) {
          throw new Error("Supabase schema needs an update.\n\nPlease go to your Supabase SQL Editor and run this query:\n\nALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;\nALTER TABLE public.students ADD CONSTRAINT students_status_check CHECK (status IN ('Unverified', 'Pending', 'Verified'));\nALTER TABLE public.students DROP COLUMN IF EXISTS \"interHallTicket\";\nALTER TABLE public.students ADD COLUMN IF NOT EXISTS \"documents\" jsonb, ADD COLUMN IF NOT EXISTS \"uploadedFiles\" jsonb, ADD COLUMN IF NOT EXISTS \"program\" text, ADD COLUMN IF NOT EXISTS \"academicYear\" text, ADD COLUMN IF NOT EXISTS \"pendingAt\" timestamptz, ADD COLUMN IF NOT EXISTS \"verifiedAt\" timestamptz;\n\nThen click Settings > API > Reload schema cache.");
        }
        throw error;
      }
      
      // Google Sheets Webhook Sync (optional client-side)
      // We use mode: 'no-cors' for fire-and-forget to avoid "Failed to fetch" on redirect/CORS
      const sheetsWebhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
      if (sheetsWebhookUrl) {
        fetch(sheetsWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student)
        }).catch(err => console.error("Sheets sync failed (non-blocking):", err));
      }

      await fetchStudents();
      return { success: true };
    } catch (e: any) {
      console.error("Failed adding to Supabase:", e.message);
      // Revert if it was a real database error
      setStudents(previousStudents);
      return { success: false, errorMessage: e.message };
    }
  };

  const updateStudent = async (id: string, data: Partial<Student>): Promise<{ success: boolean; errorMessage?: string }> => {
    const previousStudents = [...students];
    const timestamp = new Date().toISOString();
    
    // Inject timestamps based on status change
    let updatedData = { ...data };
    if (data.status === 'Pending') {
      updatedData.pendingAt = timestamp;
    } else if (data.status === 'Verified') {
      updatedData.verifiedAt = timestamp;
    }
    
    // Optimistic Update
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s)));
    if (currentStudent?.id === id) {
      setCurrentStudent((prev) => (prev ? { ...prev, ...updatedData } : null));
    }

    if (!supabase) {
      console.warn("Memory Mode: Update saved only to local state.");
      return { success: true };
    }

    try {
      const { error } = await supabase.from('students').update(updatedData).eq('id', id);
      
      if (error) {
        if (error.message?.includes("schema cache") || error.message?.includes("column") || error.message?.includes("invalid input") || error.message?.includes("constraint")) {
          throw new Error("Supabase schema needs an update.\n\nPlease go to your Supabase SQL Editor and run this query:\n\nALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;\nALTER TABLE public.students ADD CONSTRAINT students_status_check CHECK (status IN ('Unverified', 'Pending', 'Verified'));\nALTER TABLE public.students DROP COLUMN IF EXISTS \"interHallTicket\";\nALTER TABLE public.students ADD COLUMN IF NOT EXISTS \"documents\" jsonb, ADD COLUMN IF NOT EXISTS \"uploadedFiles\" jsonb, ADD COLUMN IF NOT EXISTS \"program\" text, ADD COLUMN IF NOT EXISTS \"academicYear\" text, ADD COLUMN IF NOT EXISTS \"pendingAt\" timestamptz, ADD COLUMN IF NOT EXISTS \"verifiedAt\" timestamptz;\n\nThen click Settings > API > Reload schema cache.");
        }
        throw error;
      }
      
      await fetchStudents();
      return { success: true };
    } catch (e: any) {
      console.error("Failed updating Supabase:", e.message);
      setStudents(previousStudents);
      if (currentStudent?.id === id) {
        // Revert current student if needed
        const prevStudent = previousStudents.find(s => s.id === id);
        setCurrentStudent(prevStudent || null);
      }
      return { success: false, errorMessage: e.message };
    }
  };

  const deleteStudent = async (id: string) => {
    const previousStudents = [...students];
    const previousCurrent = currentStudent;

    // 1. Mark as deleted in our local guard set
    setDeletedIds(prev => new Set(prev).add(id));

    // 2. Optimistic Delete from UI
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (currentStudent?.id === id) {
      setCurrentStudent(null);
    }

    if (!supabase) {
      console.warn("Memory Mode: Student removed from local state.");
      return;
    }

    try {
      console.log(`Supabase: Attempting to delete student with ID: ${id}`);
      // Use .select() to verify if the row was actually returned/deleted.
      // If RLS prevents deletion silently, data will be empty.
      const { data, error, status } = await supabase.from('students').delete().eq('id', id).select();
      
      if (error) {
        console.error("Supabase Delete Error:", error.message, error.code);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Supabase RLS blocked the deletion. Please run the following SQL in your Supabase SQL Editor to enable it:\n\nCREATE POLICY \"Enable delete for all users\" ON public.students AS PERMISSIVE FOR DELETE USING (true);");
      }
      
      console.log(`Supabase Delete Status: ${status} (Success)`);
      
      // Wait a small amount for DB synchronization before fetching
      await new Promise(resolve => setTimeout(resolve, 800));
      await fetchStudents();

      // Successfully confirmed gone, stop guarding
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e: any) {
      console.error("Failed deleting from Supabase:", e.message);
      // Stop guarding and revert UI if delete failed
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setStudents(previousStudents);
      setCurrentStudent(previousCurrent);
      alert(`Delete failed: ${e.message || "Unknown error"}\n\nThe record has been restored to the dashboard.`);
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

