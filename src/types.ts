export type Role = 'teacher' | 'student';
export type Language = 'en' | 'vi';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}

export interface Assignment {
  id: string;
  title: string;
  content: string;
  teacherId: string;
  createdAt: number;
}

export type SubmissionStatus = 'pending' | 'submitted' | 'graded';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  status: SubmissionStatus;
  grade?: string;
  feedback?: string;
  updatedAt: number;
}

