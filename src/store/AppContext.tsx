import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '../types';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        
        // Use functional state update to avoid stale closures
        setStudents((prevStudents) => {
          // If the data is actually different, update it
          if (JSON.stringify(prevStudents) !== JSON.stringify(data)) {
            return data;
          }
          return prevStudents;
        });
        
        // Ensure currentStudent matches the fresh data
        if (currentStudent) {
          const freshCurrent = data.find((s: Student) => s.id === currentStudent.id);
          if (freshCurrent && JSON.stringify(freshCurrent) !== JSON.stringify(currentStudent)) {
            setCurrentStudent(freshCurrent);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch students backend:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data and setup background polling for real-time accuracy
  useEffect(() => {
    // Immediate fetch on mount
    fetchStudents();
    
    // Background polling every 3 seconds for active sessions
    const interval = setInterval(fetchStudents, 3000);
    return () => clearInterval(interval);
  }, [currentStudent?.id]); // Watch ID changes for context specific refresh

  const addStudent = async (student: Student) => {
    // Optimistic UI update
    setStudents((prev) => [student, ...prev]);
    setCurrentStudent(student);

    // Backend sync
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      
      if (!response.ok) throw new Error("Database insertion failed");
      
      // Refresh to ensure absolute sync with backend
      await fetchStudents();
    } catch (e) {
      console.error("Failed writing to backend:", e);
      // Revert/refresh on failure
      await fetchStudents();
    }
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    // Capture state for potential rollback
    const previousStudents = [...students];

    // Optimistic UI update
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
    if (currentStudent?.id === id) {
      setCurrentStudent((prev) => (prev ? { ...prev, ...data } : null));
    }

    // Backend sync
    try {
      const response = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error("Update failed");
      
      await fetchStudents();
    } catch (e) {
      console.error("Failed updating backend:", e);
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

