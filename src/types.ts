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
    ssc: boolean;
    schoolBonafide: boolean;
    interBonafide: boolean;
    interPC: boolean;
    degreeCMM: boolean;
    degreePC: boolean;
    tc: boolean;
    aadhaar: boolean;
    rankCard: boolean;
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
