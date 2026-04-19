import React, { useEffect, useState } from 'react';
import { auth, db, signInWithGoogle, logOut } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Role, Language } from './types';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

const appCopy: Record<Language, {
  loading: string;
  title: string;
  signInDescription: string;
  signInWithGoogle: string;
  signingIn: string;
  welcome: string;
  selectRolePrompt: string;
  selectRolePlaceholder: string;
  teacherRole: string;
  studentRole: string;
  continue: string;
  signOut: string;
  portalSuffix: string;
}> = {
  en: {
    loading: 'Loading...',
    title: 'Student Work Manager',
    signInDescription: 'Sign in to manage assignments and submissions',
    signInWithGoogle: 'Sign in with Google',
    signingIn: 'Signing in...',
    welcome: 'Welcome!',
    selectRolePrompt: 'Please select your role to continue.',
    selectRolePlaceholder: 'Select a role',
    teacherRole: 'Teacher',
    studentRole: 'Student',
    continue: 'Continue',
    signOut: 'Sign Out',
    portalSuffix: 'Portal',
  },
  vi: {
    loading: 'Đang tải...',
    title: 'Quản lý bài tập học sinh',
    signInDescription: 'Đăng nhập để quản lý bài tập và bài nộp',
    signInWithGoogle: 'Đăng nhập bằng Google',
    signingIn: 'Đang đăng nhập...',
    welcome: 'Chào mừng!',
    selectRolePrompt: 'Vui lòng chọn vai trò để tiếp tục.',
    selectRolePlaceholder: 'Chọn vai trò',
    teacherRole: 'Giảng viên',
    studentRole: 'Học sinh',
    continue: 'Tiếp tục',
    signOut: 'Đăng xuất',
    portalSuffix: 'Portal',
  },
};

const roleLabels: Record<Language, Record<Role, string>> = {
  en: {
    teacher: 'Teacher',
    student: 'Student',
  },
  vi: {
    teacher: 'Giảng viên',
    student: 'Học sinh',
  },
};

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleSelection, setRoleSelection] = useState<Role | ''>('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'en';
    }

    const savedLanguage = window.localStorage.getItem('student-lms-language');
    return savedLanguage === 'vi' ? 'vi' : 'en';
  });

  const text = appCopy[language];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('student-lms-language', language);
    }
  }, [language]);

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

  const LanguageToggle = () => (
    <div className="inline-flex items-center rounded-md border border-zinc-200 bg-white p-1">
      <Button
        type="button"
        variant={language === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => setLanguage('en')}
      >
        EN
      </Button>
      <Button
        type="button"
        variant={language === 'vi' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2"
        onClick={() => setLanguage('vi')}
      >
        VI
      </Button>
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">{text.loading}</div>;
  }

  if (!firebaseUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-end">
              <LanguageToggle />
            </div>
            <CardTitle className="text-2xl">{text.title}</CardTitle>
            <CardDescription>{text.signInDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleGoogleSignIn} size="lg" className="w-full" disabled={authLoading}>
              {authLoading ? text.signingIn : text.signInWithGoogle}
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
            <div className="flex items-center justify-end">
              <LanguageToggle />
            </div>
            <CardTitle>{text.welcome}</CardTitle>
            <CardDescription>{text.selectRolePrompt}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={roleSelection} onValueChange={(v) => setRoleSelection(v as Role)}>
              <SelectTrigger>
                <SelectValue placeholder={text.selectRolePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">{text.teacherRole}</SelectItem>
                <SelectItem value="student">{text.studentRole}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRoleSubmit} disabled={!roleSelection} className="w-full">
              {text.continue}
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
          <h1 className="text-xl font-bold tracking-tight">{text.title}</h1>
          <p className="text-sm text-zinc-500 capitalize">{roleLabels[language][user.role]} {text.portalSuffix}</p>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <span className="text-sm font-medium">{user.name}</span>
          <Button variant="outline" size="sm" onClick={logOut}>{text.signOut}</Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {user.role === 'teacher' ? <TeacherDashboard user={user} /> : <StudentDashboard user={user} language={language} />}
      </main>
    </div>
  );
}
