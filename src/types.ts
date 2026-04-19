export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  fatherName: string;
  program: 'UG' | 'PG' | 'PHD';
  branch: string;
  parentPhone: string;
  interHallTicket: string;
  documents: {
    sscMemo: boolean;
    sscBonafide: boolean;
    schoolBonafide6to9: boolean;
    tc: boolean;
    interPC: boolean;
    interBonafide: boolean;
    aadhaar: boolean;
    degreeCMM: boolean;
    degreePC: boolean;
    degreeBonafide: boolean;
    pgCMM: boolean;
    pgPC: boolean;
    pgBonafide: boolean;
    others: string;
  };
  status: 'Pending' | 'Verified';
  createdAt: string;
  academicYear: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  studentId?: string;
  timestamp: string;
}

export type DocumentKey = keyof Student['documents'];
