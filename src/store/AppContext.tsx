import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, AuditLog } from '../types';

interface AppContextType {
  students: Student[];
  auditLogs: AuditLog[];
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  logAction: (action: string, details: string, studentId?: string) => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  currentStudent: Student | null;
  setCurrentStudent: (student: Student | null) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/audit-logs');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    }
  };

  // Fetch initial data from backend (Supabase or Memory fallback via express server)
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Failed to fetch students backend:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
    fetchAuditLogs();
  }, []);

  const addStudent = async (student: Student) => {
    // Optimistic UI update
    setStudents((prev) => [student, ...prev]);
    setCurrentStudent(student);

    // Backend sync
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      await fetchAuditLogs();
    } catch (e) {
      console.error("Failed writing to backend:", e);
    }
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    // Optimistic UI update
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
    if (currentStudent?.id === id) {
      setCurrentStudent((prev) => (prev ? { ...prev, ...data } : null));
    }

    // Backend sync
    try {
      await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await fetchAuditLogs();
    } catch (e) {
      console.error("Failed updating backend:", e);
    }
  };

  const deleteStudent = async (id: string) => {
    // Optimistic UI update
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (currentStudent?.id === id) {
      setCurrentStudent(null);
    }

    // Backend sync
    try {
      await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      await fetchAuditLogs();
    } catch (e) {
      console.error("Failed deleting from backend:", e);
    }
  };

  const logAction = async (action: string, details: string, studentId?: string) => {
    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details, studentId })
      });
      await fetchAuditLogs();
    } catch (e) {
      console.error("Failed to log action:", e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        students,
        auditLogs,
        addStudent,
        updateStudent,
        deleteStudent,
        logAction,
        fetchAuditLogs,
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

