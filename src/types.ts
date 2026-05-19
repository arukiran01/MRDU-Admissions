export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  fatherName: string;
  program: 'UG' | 'PG';
  branch: string;
  parentPhone: string;
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
  uploadedFiles?: Record<string, string>;
  status: 'Unverified' | 'Pending' | 'Verified';
  pendingAt?: string;
  verifiedAt?: string;
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
