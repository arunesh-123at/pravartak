// Mock student data and prediction logic

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'mentor' | 'parent';
  studentId?: string;
  childId?: string;
}

export interface CounselingNote {
  id: string;
  date: string;
  mentorName: string;
  note: string;
  type: 'academic' | 'behavioral' | 'financial' | 'general';
  isPrivate: boolean; // Some notes may be private to mentors only
}

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  cgpa: number;
  attendance: number;
  feeStatus: 'paid' | 'pending' | 'overdue';
  backlogs: number;
  mentorId?: string;
  dropoutRisk: 'low' | 'medium' | 'high';
  riskScore: number;
  counselingNotes: CounselingNote[];
}

// Mock student records
export const mockStudents: StudentRecord[] = [
  {
    id: 'STU001',
    name: 'John Doe',
    email: 'student@test.com',
    cgpa: 7.5,
    attendance: 85,
    feeStatus: 'paid',
    backlogs: 1,
    mentorId: 'mentor1',
    dropoutRisk: 'medium',
    riskScore: 45,
    counselingNotes: [
      {
        id: 'note1',
        date: '2024-01-15',
        mentorName: 'Dr. Smith',
        note: 'Student shows improvement in Mathematics but struggling with Programming concepts. Recommended additional tutoring sessions.',
        type: 'academic',
        isPrivate: false
      },
      {
        id: 'note2',
        date: '2024-01-22',
        mentorName: 'Dr. Smith',
        note: 'Had a counseling session about time management. Student committed to following a structured study schedule.',
        type: 'behavioral',
        isPrivate: false
      },
      {
        id: 'note3',
        date: '2024-02-01',
        mentorName: 'Dr. Smith',
        note: 'Progress update: John has cleared one backlog and improved attendance. Continue monitoring.',
        type: 'general',
        isPrivate: false
      }
    ]
  },
  {
    id: 'STU002',
    name: 'Jane Smith',
    email: 'jane@test.com',
    cgpa: 6.2,
    attendance: 70,
    feeStatus: 'overdue',
    backlogs: 3,
    mentorId: 'mentor1',
    dropoutRisk: 'high',
    riskScore: 78,
    counselingNotes: [
      {
        id: 'note4',
        date: '2024-01-10',
        mentorName: 'Dr. Smith',
        note: 'Urgent intervention needed. Student facing financial difficulties affecting attendance and performance.',
        type: 'financial',
        isPrivate: false
      }
    ]
  },
  {
    id: 'STU003',
    name: 'Mike Johnson',
    email: 'mike@test.com',
    cgpa: 8.5,
    attendance: 95,
    feeStatus: 'paid',
    backlogs: 0,
    mentorId: 'mentor1',
    dropoutRisk: 'low',
    riskScore: 15,
    counselingNotes: [
      {
        id: 'note5',
        date: '2024-01-20',
        mentorName: 'Dr. Smith',
        note: 'Excellent performance! Encouraged to participate in advanced projects and consider leadership roles.',
        type: 'general',
        isPrivate: false
      }
    ]
  }
];

export function calculateDropoutRisk(
  cgpa: number,
  attendance: number,
  feeStatus: 'paid' | 'pending' | 'overdue',
  backlogs: number
): { risk: 'low' | 'medium' | 'high'; score: number } {
  let score = 0;

  // CGPA factor (0-40 points)
  if (cgpa < 5.0) score += 40;
  else if (cgpa < 6.5) score += 25;
  else if (cgpa < 7.5) score += 15;
  else score += 5;

  // Attendance factor (0-30 points)
  if (attendance < 60) score += 30;
  else if (attendance < 75) score += 20;
  else if (attendance < 85) score += 10;
  else score += 2;

  // Fee status factor (0-20 points)
  if (feeStatus === 'overdue') score += 20;
  else if (feeStatus === 'pending') score += 10;
  else score += 0;

  // Backlogs factor (0-10 points per backlog)
  score += Math.min(backlogs * 10, 30);

  // Determine risk level
  let risk: 'low' | 'medium' | 'high';
  if (score <= 30) risk = 'low';
  else if (score <= 60) risk = 'medium';
  else risk = 'high';

  return { risk, score };
}

export function updateStudentRecord(studentId: string, updates: Partial<StudentRecord>): StudentRecord | null {
  const studentIndex = mockStudents.findIndex(s => s.id === studentId);
  if (studentIndex === -1) return null;

  const updatedStudent = { ...mockStudents[studentIndex], ...updates };
  
  // Recalculate risk if academic data is updated
  if (updates.cgpa !== undefined || updates.attendance !== undefined || 
      updates.feeStatus !== undefined || updates.backlogs !== undefined) {
    const { risk, score } = calculateDropoutRisk(
      updatedStudent.cgpa,
      updatedStudent.attendance,
      updatedStudent.feeStatus,
      updatedStudent.backlogs
    );
    updatedStudent.dropoutRisk = risk;
    updatedStudent.riskScore = score;
  }

  mockStudents[studentIndex] = updatedStudent;
  return updatedStudent;
}

export function getStudentsByMentor(mentorId: string): StudentRecord[] {
  return mockStudents.filter(student => student.mentorId === mentorId);
}

export function getStudentById(studentId: string): StudentRecord | undefined {
  return mockStudents.find(student => student.id === studentId);
}