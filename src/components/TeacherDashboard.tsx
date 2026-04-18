import React, { useState, useEffect } from 'react';
import { User, Assignment, Submission } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, Input, Label, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Textarea } from './ui';
import mammoth from 'mammoth/mammoth.browser';
import { format } from 'date-fns';

export default function TeacherDashboard({ user }: { user: User }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [fileName, setFileName] = useState('');

  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'assignments'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
      setAssignments(data.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'assignments'));
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (!selectedAssignment) return;
    const q = query(collection(db, 'submissions'), where('assignmentId', '==', selectedAssignment.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
      setSubmissions(data.sort((a, b) => b.updatedAt - a.updatedAt));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'submissions'));
    return () => unsubscribe();
  }, [selectedAssignment]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (!newTitle) setNewTitle(file.name.replace(/\.[^/.]+$/, ""));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setNewContent(result.value);
    } catch (error) {
      console.error("Error parsing docx", error);
      alert("Failed to parse document. Please ensure it is a valid .docx file.");
    }
  };

  const handleCreateAssignment = async () => {
    if (!newTitle || !newContent) return;
    try {
      const docRef = doc(collection(db, 'assignments'));
      const newAssignment: Assignment = {
        id: docRef.id,
        title: newTitle,
        content: newContent,
        teacherId: user.uid,
        createdAt: Date.now(),
      };
      await setDoc(docRef, newAssignment);
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      setFileName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'assignments');
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;
    try {
      await updateDoc(doc(db, 'submissions', selectedSubmission.id), {
        status: 'graded',
        grade: gradeInput,
        feedback: feedbackInput,
        updatedAt: Date.now(),
      });
      setSelectedSubmission(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${selectedSubmission.id}`);
    }
  };

  if (selectedSubmission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedSubmission(null)}>← Back to Submissions</Button>
          <h2 className="text-2xl font-bold">{selectedSubmission.studentName}'s Work</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Document Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none border rounded-md p-6 min-h-[500px] bg-white"
                dangerouslySetInnerHTML={{ __html: selectedSubmission.content }}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Grading & Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <div>
                  <Badge variant={selectedSubmission.status === 'graded' ? 'default' : 'secondary'}>
                    {selectedSubmission.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input 
                  id="grade" 
                  value={gradeInput} 
                  onChange={(e) => setGradeInput(e.target.value)} 
                  placeholder="e.g. A, 95/100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea 
                  id="feedback" 
                  value={feedbackInput} 
                  onChange={(e) => setFeedbackInput(e.target.value)} 
                  placeholder="Provide feedback to the student..."
                  rows={6}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleGradeSubmission}>Save Grade</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedAssignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedAssignment(null)}>← Back to Assignments</Button>
          <h2 className="text-2xl font-bold">{selectedAssignment.title}</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>Review and grade student work for this assignment.</CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No submissions yet.</p>
            ) : (
              <div className="space-y-4">
                {submissions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-zinc-50 transition-colors">
                    <div>
                      <h4 className="font-medium">{sub.studentName}</h4>
                      <p className="text-sm text-zinc-500">Last updated: {format(sub.updatedAt, 'MMM d, yyyy h:mm a')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={sub.status === 'graded' ? 'default' : sub.status === 'submitted' ? 'secondary' : 'outline'}>
                        {sub.status}
                      </Badge>
                      {sub.grade && <span className="text-sm font-medium">Grade: {sub.grade}</span>}
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedSubmission(sub);
                        setGradeInput(sub.grade || '');
                        setFeedbackInput(sub.feedback || '');
                      }}>
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Assignments</h2>
        <Button onClick={() => setIsCreating(true)}>Create Assignment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map(assignment => (
          <Card key={assignment.id} className="cursor-pointer hover:border-zinc-400 transition-colors" onClick={() => setSelectedAssignment(assignment)}>
            <CardHeader>
              <CardTitle className="line-clamp-1">{assignment.title}</CardTitle>
              <CardDescription>{format(assignment.createdAt, 'MMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500 line-clamp-3">
                {assignment.content.replace(/<[^>]*>?/gm, '') || 'No content preview available.'}
              </p>
            </CardContent>
          </Card>
        ))}
        {assignments.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500 border-2 border-dashed rounded-xl">
            No assignments created yet. Click "Create Assignment" to get started.
          </div>
        )}
      </div>

      {isCreating && (
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>Upload a DOCX file to create a new assignment for your students.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Upload Document (.docx)</Label>
                <Input id="file" type="file" accept=".docx" onChange={handleFileUpload} />
                {fileName && <p className="text-sm text-zinc-500">Selected: {fileName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title</Label>
                <Input id="title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Midterm Exam" />
              </div>
              {newContent && (
                <div className="space-y-2">
                  <Label>Content Preview</Label>
                  <div className="border rounded-md p-4 max-h-40 overflow-y-auto text-sm bg-zinc-50" dangerouslySetInnerHTML={{ __html: newContent }} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreateAssignment} disabled={!newTitle || !newContent}>Create Assignment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
