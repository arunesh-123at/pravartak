import React, { useState } from "react";
import {
  AuthProvider,
  useAuth,
} from "./components/AuthContext";
import { ThemeProvider } from "./components/ThemeContext";
import { ThemeWrapper } from "./components/ThemeWrapper";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { Login } from "./components/Login";
import { StudentDashboard } from "./components/StudentDashboard";
import { MentorDashboard } from "./components/MentorDashboard";
import { MentorUpdate } from "./components/MentorUpdate";
import { ParentDashboard } from "./components/ParentDashboard";
import MentorRegister from "./components/MentorRegister";

type View =
  | "login"
  | "student-dashboard"
  | "mentor-dashboard"
  | "mentor-update";

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>("login");
  const [authView, setAuthView] = useState<'login' | 'mentor-register'>("login");
  const [selectedStudent, setSelectedStudent] =
    useState<any | null>(null);
  const [studentsVersion, setStudentsVersion] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onNavigateToRegister={() => setAuthView('mentor-register')} />
    ) : (
      <MentorRegister onBackToLogin={() => setAuthView('login')} />
    );
  }

  // User is logged in
  if (user.role === "student") {
    return <StudentDashboard />;
  }

  if (user.role === "parent") {
    return <ParentDashboard />;
  }

  // User is a mentor
  if (currentView === "mentor-update" && selectedStudent) {
    return (
      <MentorUpdate
        studentId={selectedStudent.id}
        initialStudent={selectedStudent}
        onBack={() => {
          setCurrentView("mentor-dashboard");
          setSelectedStudent(null);
          setStudentsVersion((v) => v + 1);
        }}
      />
    );
  }

  return (
    <MentorDashboard
      onUpdateStudent={(student) => {
        setSelectedStudent(student);
        setCurrentView("mentor-update");
      }}
      refreshKey={studentsVersion}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemeWrapper>
          <div className="relative">
            <div className="absolute top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            <AppContent />
          </div>
        </ThemeWrapper>
      </ThemeProvider>
    </AuthProvider>
  );
}