import React, { useState } from "react";
import {
  AuthProvider,
  useAuth,
} from "./components/AuthContext";
import { ThemeProvider } from "./components/ThemeContext";
import { ThemeWrapper } from "./components/ThemeWrapper";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loading } from "./components/Loading";
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
    return <Loading fullScreen message="Initializing application..." />;
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
    return (
      <ErrorBoundary>
        <StudentDashboard />
      </ErrorBoundary>
    );
  }

  if (user.role === "parent") {
    return (
      <ErrorBoundary>
        <ParentDashboard />
      </ErrorBoundary>
    );
  }

  // User is a mentor
  if (currentView === "mentor-update" && selectedStudent) {
    return (
      <ErrorBoundary>
        <MentorUpdate
          studentId={selectedStudent.id}
          initialStudent={selectedStudent}
          onStudentUpdated={(updatedStudent) => {
            // Force complete refresh by incrementing version counter first
            setStudentsVersion((v) => v + 1);
            // Update the selected student to reflect changes
            setSelectedStudent(updatedStudent);
          }}
          onBack={() => {
            setCurrentView("mentor-dashboard");
            setSelectedStudent(null);
            // Always increment refresh key when going back to ensure fresh data
            setStudentsVersion((v) => v + 1);
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <MentorDashboard
        onUpdateStudent={(student) => {
          setSelectedStudent(student);
          setCurrentView("mentor-update");
        }}
        refreshKey={studentsVersion}
      />
    </ErrorBoundary>
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
            <Toaster richColors position="top-right" />
          </div>
        </ThemeWrapper>
      </ThemeProvider>
    </AuthProvider>
  );
}