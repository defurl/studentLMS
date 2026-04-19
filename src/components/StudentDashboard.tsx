import React, { useState, useEffect } from 'react';
import { User, Assignment, Submission, Language } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from './ui';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { format } from 'date-fns';

const TIMER_DURATION_SECONDS = 60 * 60;

type AssignmentCardStatus = Submission['status'] | 'not-started';

const studentCopy: Record<Language, {
  backToAssignments: string;
  saving: string;
  saveDraft: string;
  submitWork: string;
  readOnlyDescription: string;
  editableDescription: string;
  details: string;
  assignedOn: string;
  lastUpdated: string;
  timerTitle: string;
  timerDescription: string;
  timeRemaining: string;
  pause: string;
  resume: string;
  reset: string;
  timerFinished: string;
  teacherFeedback: string;
  grade: string;
  comments: string;
  noCommentsProvided: string;
  notAvailable: string;
  myAssignments: string;
  assignedPrefix: string;
  noAssignments: string;
  status: {
    pending: string;
    submitted: string;
    graded: string;
    notStarted: string;
  };
}> = {
  en: {
    backToAssignments: '← Back to Assignments',
    saving: 'Saving...',
    saveDraft: 'Save Draft',
    submitWork: 'Submit Work',
    readOnlyDescription: 'This assignment has been submitted and cannot be edited.',
    editableDescription: 'Edit your document below. Changes are not saved automatically.',
    details: 'Details',
    assignedOn: 'Assigned on',
    lastUpdated: 'Last updated',
    timerTitle: '60-Minute Timer',
    timerDescription: 'Track your working time while you complete this assignment.',
    timeRemaining: 'Time remaining',
    pause: 'Pause',
    resume: 'Continue',
    reset: 'Reset',
    timerFinished: 'Timer reached 00:00. You can reset or continue anytime.',
    teacherFeedback: 'Teacher Feedback',
    grade: 'Grade',
    comments: 'Comments',
    noCommentsProvided: 'No comments provided.',
    notAvailable: 'N/A',
    myAssignments: 'My Assignments',
    assignedPrefix: 'Assigned:',
    noAssignments: 'No assignments have been posted yet.',
    status: {
      pending: 'pending',
      submitted: 'submitted',
      graded: 'graded',
      notStarted: 'not started',
    },
  },
  vi: {
    backToAssignments: '← Quay lại bài tập',
    saving: 'Đang lưu...',
    saveDraft: 'Lưu bản nháp',
    submitWork: 'Nộp bài',
    readOnlyDescription: 'Bài tập này đã được nộp và không thể chỉnh sửa.',
    editableDescription: 'Chỉnh sửa bài làm bên dưới. Hệ thống không tự động lưu.',
    details: 'Thông tin',
    assignedOn: 'Ngày giao',
    lastUpdated: 'Cập nhật lần cuối',
    timerTitle: 'Đồng hồ 60 phút',
    timerDescription: 'Theo dõi thời gian làm bài trong quá trình hoàn thành bài tập.',
    timeRemaining: 'Thời gian còn lại',
    pause: 'Tạm dừng',
    resume: 'Tiếp tục',
    reset: 'Đặt lại',
    timerFinished: 'Đồng hồ đã về 00:00. Bạn có thể đặt lại hoặc tiếp tục bất cứ lúc nào.',
    teacherFeedback: 'Nhận xét của giảng viên',
    grade: 'Điểm',
    comments: 'Nhận xét',
    noCommentsProvided: 'Chưa có nhận xét.',
    notAvailable: 'Không có',
    myAssignments: 'Bài tập của tôi',
    assignedPrefix: 'Giao ngày:',
    noAssignments: 'Chưa có bài tập nào được đăng.',
    status: {
      pending: 'đang làm',
      submitted: 'đã nộp',
      graded: 'đã chấm',
      notStarted: 'chưa bắt đầu',
    },
  },
};

const formatTimer = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export default function StudentDashboard({ user, language = 'en' }: { user: User; language?: Language }) {
  const text = studentCopy[language];
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(TIMER_DURATION_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'assignments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
      setAssignments(data.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'assignments'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.reduce((acc, doc) => {
        const sub = { id: doc.id, ...doc.data() } as Submission;
        acc[sub.assignmentId] = sub;
        return acc;
      }, {} as Record<string, Submission>);
      setSubmissions(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'submissions'));
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (!selectedAssignment || !currentSubmission || !isTimerRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimerSeconds((previousSeconds) => {
        if (previousSeconds <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return previousSeconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [selectedAssignment, currentSubmission, isTimerRunning]);

  const getStatusLabel = (status: AssignmentCardStatus) => {
    if (status === 'not-started') {
      return text.status.notStarted;
    }

    return text.status[status];
  };

  const resetTimer = () => {
    setTimerSeconds(TIMER_DURATION_SECONDS);
    setIsTimerRunning(false);
  };

  const handleOpenAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setTimerSeconds(TIMER_DURATION_SECONDS);
    setIsTimerRunning(true);

    const existingSub = submissions[assignment.id];
    
    if (existingSub) {
      setCurrentSubmission(existingSub);
      setEditorContent(existingSub.content);
    } else {
      // Create a pending submission with the assignment's content
      try {
        const docRef = doc(collection(db, 'submissions'));
        const newSub: Submission = {
          id: docRef.id,
          assignmentId: assignment.id,
          studentId: user.uid,
          studentName: user.name,
          content: assignment.content,
          status: 'pending',
          updatedAt: Date.now(),
        };
        await setDoc(docRef, newSub);
        
        setCurrentSubmission(newSub);
        setEditorContent(newSub.content);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'submissions');
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!currentSubmission) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'submissions', currentSubmission.id), {
        content: editorContent,
        updatedAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${currentSubmission.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentSubmission) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'submissions', currentSubmission.id), {
        content: editorContent,
        status: 'submitted',
        updatedAt: Date.now(),
      });
      setSelectedAssignment(null);
      setCurrentSubmission(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${currentSubmission.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (selectedAssignment && currentSubmission) {
    const isReadOnly = currentSubmission.status === 'graded' || currentSubmission.status === 'submitted';
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => {
            setSelectedAssignment(null);
            setCurrentSubmission(null);
            setTimerSeconds(TIMER_DURATION_SECONDS);
            setIsTimerRunning(false);
          }}>{text.backToAssignments}</Button>
          <div className="flex items-center gap-4">
            <Badge variant={currentSubmission.status === 'graded' ? 'default' : currentSubmission.status === 'submitted' ? 'secondary' : 'outline'}>
              {text.status[currentSubmission.status]}
            </Badge>
            {!isReadOnly && (
              <>
                <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                  {isSaving ? text.saving : text.saveDraft}
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving}>{text.submitWork}</Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="min-h-[600px] flex flex-col">
              <CardHeader className="border-b bg-zinc-50/50">
                <CardTitle>{selectedAssignment.title}</CardTitle>
                <CardDescription>
                  {isReadOnly ? text.readOnlyDescription : text.editableDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ReactQuill 
                  theme="snow" 
                  value={editorContent} 
                  onChange={setEditorContent}
                  readOnly={isReadOnly}
                  className="assignment-editor h-full min-h-[500px] border-0"
                  modules={{
                    toolbar: isReadOnly ? false : [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{text.details}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-zinc-500 block">{text.assignedOn}</span>
                  <span className="font-medium">{format(selectedAssignment.createdAt, 'MMM d, yyyy')}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">{text.lastUpdated}</span>
                  <span className="font-medium">{format(currentSubmission.updatedAt, 'MMM d, yyyy h:mm a')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{text.timerTitle}</CardTitle>
                <CardDescription>{text.timerDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-zinc-500 block text-sm">{text.timeRemaining}</span>
                  <p className="font-bold text-3xl tabular-nums tracking-tight">{formatTimer(timerSeconds)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsTimerRunning((running) => !running)}>
                    {isTimerRunning ? text.pause : text.resume}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetTimer}>{text.reset}</Button>
                </div>
                {timerSeconds === 0 && (
                  <p className="text-xs text-zinc-500">{text.timerFinished}</p>
                )}
              </CardContent>
            </Card>

            {currentSubmission.status === 'graded' && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-green-800">{text.teacherFeedback}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-green-700/70 block text-sm">{text.grade}</span>
                    <span className="font-bold text-lg text-green-900">{currentSubmission.grade || text.notAvailable}</span>
                  </div>
                  <div>
                    <span className="text-green-700/70 block text-sm">{text.comments}</span>
                    <p className="text-green-900 whitespace-pre-wrap">{currentSubmission.feedback || text.noCommentsProvided}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{text.myAssignments}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map(assignment => {
          const sub = submissions[assignment.id];
          const status: AssignmentCardStatus = sub ? sub.status : 'not-started';
          
          return (
            <Card key={assignment.id} className="cursor-pointer hover:border-zinc-400 transition-colors flex flex-col" onClick={() => handleOpenAssignment(assignment)}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="line-clamp-2">{assignment.title}</CardTitle>
                  <Badge variant={status === 'graded' ? 'default' : status === 'submitted' ? 'secondary' : 'outline'} className="shrink-0">
                    {getStatusLabel(status)}
                  </Badge>
                </div>
                <CardDescription>{text.assignedPrefix} {format(assignment.createdAt, 'MMM d, yyyy')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {sub?.status === 'graded' && sub.grade && (
                  <div className="mt-4 p-3 bg-green-50 text-green-900 rounded-md border border-green-100 flex justify-between items-center">
                    <span className="text-sm font-medium">{text.grade}</span>
                    <span className="font-bold">{sub.grade}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {assignments.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500 border-2 border-dashed rounded-xl">
            {text.noAssignments}
          </div>
        )}
      </div>
    </div>
  );
}
