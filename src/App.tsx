import React, { useEffect, useState } from 'react';
import { auth, db, signInWithGoogle, logOut } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Role } from './types';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleSelection, setRoleSelection] = useState<Role | ''>('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setLoading(true);
      setFirebaseUser(fUser);
      setAuthError('');

      if (!fUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', fUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          setUser(null); // Needs role selection
        }
      } catch (error) {
        setUser(null);
        setAuthError('Signed in, but failed to load your classroom profile. Please try again.');
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in with Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRoleSubmit = async () => {
    if (!firebaseUser || !roleSelection) return;
    setLoading(true);
    setAuthError('');
    try {
      const newUser: User = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Unknown',
        email: firebaseUser.email || '',
        role: roleSelection as Role,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setUser(newUser);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to save your role. Please try again.');
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!firebaseUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Student Work Manager</CardTitle>
            <CardDescription>Sign in to manage assignments and submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleGoogleSignIn} size="lg" className="w-full" disabled={authLoading}>
              {authLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>Please select your role to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={roleSelection} onValueChange={(v) => setRoleSelection(v as Role)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRoleSubmit} disabled={!roleSelection} className="w-full">
              Continue
            </Button>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Student Work Manager</h1>
          <p className="text-sm text-zinc-500 capitalize">{user.role} Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{user.name}</span>
          <Button variant="outline" size="sm" onClick={logOut}>Sign Out</Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {user.role === 'teacher' ? <TeacherDashboard user={user} /> : <StudentDashboard user={user} />}
      </main>
    </div>
  );
}
