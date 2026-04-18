import React, { useState, useEffect } from 'react';
import { User, Assignment, Submission } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from './ui';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { format } from 'date-fns';

export default function StudentDashboard({ user }: { user: User }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleOpenAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
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
          }}>← Back to Assignments</Button>
          <div className="flex items-center gap-4">
            <Badge variant={currentSubmission.status === 'graded' ? 'default' : currentSubmission.status === 'submitted' ? 'secondary' : 'outline'}>
              {currentSubmission.status}
            </Badge>
            {!isReadOnly && (
              <>
                <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving}>Submit Work</Button>
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
                  {isReadOnly ? 'This assignment has been submitted and cannot be edited.' : 'Edit your document below. Changes are not saved automatically.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ReactQuill 
                  theme="snow" 
                  value={editorContent} 
                  onChange={setEditorContent}
                  readOnly={isReadOnly}
                  className="h-full min-h-[500px] border-0"
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
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-zinc-500 block">Assigned on</span>
                  <span className="font-medium">{format(selectedAssignment.createdAt, 'MMM d, yyyy')}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Last updated</span>
                  <span className="font-medium">{format(currentSubmission.updatedAt, 'MMM d, yyyy h:mm a')}</span>
                </div>
              </CardContent>
            </Card>

            {currentSubmission.status === 'graded' && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-green-800">Teacher Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-green-700/70 block text-sm">Grade</span>
                    <span className="font-bold text-lg text-green-900">{currentSubmission.grade || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-green-700/70 block text-sm">Comments</span>
                    <p className="text-green-900 whitespace-pre-wrap">{currentSubmission.feedback || 'No comments provided.'}</p>
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
        <h2 className="text-2xl font-bold tracking-tight">My Assignments</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map(assignment => {
          const sub = submissions[assignment.id];
          const status = sub ? sub.status : 'not started';
          
          return (
            <Card key={assignment.id} className="cursor-pointer hover:border-zinc-400 transition-colors flex flex-col" onClick={() => handleOpenAssignment(assignment)}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="line-clamp-2">{assignment.title}</CardTitle>
                  <Badge variant={status === 'graded' ? 'default' : status === 'submitted' ? 'secondary' : 'outline'} className="shrink-0">
                    {status}
                  </Badge>
                </div>
                <CardDescription>Assigned: {format(assignment.createdAt, 'MMM d, yyyy')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {sub?.status === 'graded' && sub.grade && (
                  <div className="mt-4 p-3 bg-green-50 text-green-900 rounded-md border border-green-100 flex justify-between items-center">
                    <span className="text-sm font-medium">Grade</span>
                    <span className="font-bold">{sub.grade}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {assignments.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500 border-2 border-dashed rounded-xl">
            No assignments have been posted yet.
          </div>
        )}
      </div>
    </div>
  );
}
