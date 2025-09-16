import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Users, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Edit,
  LogOut,
  GraduationCap,
  UserPlus
} from 'lucide-react';
import { StudentRecord } from './StudentData';
import { AddStudent } from './AddStudent';
import { apiGetStudents, apiPredictRisk } from '../lib/api';

interface MentorDashboardProps {
  onUpdateStudent: (student: StudentRecord) => void;
}

export function MentorDashboard({ onUpdateStudent, refreshKey }: MentorDashboardProps & { refreshKey?: number }) {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);

  const handleStudentAdded = (newStudent: StudentRecord) => {
    setStudents(prev => [...prev, newStudent]);
    setShowAddStudent(false);
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const list = await apiGetStudents(Number(user.id));
        // Predict risks for each student via backend model in parallel
        const mapped: StudentRecord[] = await Promise.all(list.map(async (s) => {
          const feeStatus = s.fee_status === 'payment_overdue' ? 'overdue' : (s.fee_status === 'payment_pending' ? 'pending' : 'paid');
          try {
            const r = await apiPredictRisk({
              current_cgpa: s.current_cgpa,
              attendance_percentage: s.attendance_percentage,
              fee_status: s.fee_status,
              backlogs: s.backlogs,
            });
            const risk = r.risk_level.toLowerCase() as 'low' | 'medium' | 'high';
            const score = risk === 'high' ? 80 : risk === 'medium' ? 50 : 20;
            return {
              id: String(s.id),
              name: s.full_name,
              email: s.email,
              cgpa: s.current_cgpa,
              attendance: s.attendance_percentage,
              feeStatus,
              backlogs: s.backlogs,
              dropoutRisk: risk,
              riskScore: score,
              counselingNotes: []
            };
          } catch {
            return {
              id: String(s.id),
              name: s.full_name,
              email: s.email,
              cgpa: s.current_cgpa,
              attendance: s.attendance_percentage,
              feeStatus,
              backlogs: s.backlogs,
              dropoutRisk: 'medium',
              riskScore: 50,
              counselingNotes: []
            };
          }
        }));
        setStudents(mapped);
      } catch (e) {
        // ignore for now
      }
    };
    load();
  }, [user?.id, refreshKey]);

  if (showAddStudent) {
    return (
      <AddStudent 
        onBack={() => setShowAddStudent(false)}
        onStudentAdded={handleStudentAdded}
      />
    );
  }

  const getRiskStats = () => {
    const total = students.length;
    const high = students.filter(s => s.dropoutRisk === 'high').length;
    const medium = students.filter(s => s.dropoutRisk === 'medium').length;
    const low = students.filter(s => s.dropoutRisk === 'low').length;
    
    return { total, high, medium, low };
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <TrendingUp className="h-4 w-4" />;
      case 'high': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const stats = getRiskStats();

  return (
    <div>
      {/* Header */}
      <div className="bg-card text-card-foreground shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-medium">Mentor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => setShowAddStudent(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Students under your guidance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">High Risk</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-red-600">{stats.high}</div>
              <p className="text-xs text-muted-foreground">
                Immediate attention needed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Medium Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-yellow-600">{stats.medium}</div>
              <p className="text-xs text-muted-foreground">
                Monitor closely
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Low Risk</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-green-600">{stats.low}</div>
              <p className="text-xs text-muted-foreground">
                Performing well
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Student Overview</CardTitle>
                <CardDescription>
                  Monitor and manage your assigned students' academic progress
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddStudent(true)} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Student
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>CGPA</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Fee Status</TableHead>
                    <TableHead>Backlogs</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">{student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{student.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-1 text-muted-foreground" />
                          {student.cgpa}
                        </div>
                      </TableCell>
                      <TableCell>{student.attendance}%</TableCell>
                      <TableCell>
                        <Badge variant={
                          student.feeStatus === 'paid' ? 'secondary' : 
                          student.feeStatus === 'pending' ? 'default' : 'destructive'
                        } className="capitalize">
                          {student.feeStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={student.backlogs > 2 ? 'text-red-600 font-medium' : ''}>
                          {student.backlogs}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center ${getRiskColor(student.dropoutRisk)}`}>
                          {getRiskIcon(student.dropoutRisk)}
                          <span className="ml-1 capitalize font-medium">
                            {student.dropoutRisk}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({student.riskScore})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onUpdateStudent(student)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Priority Students</CardTitle>
              <CardDescription>Students requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students
                  .filter(s => s.dropoutRisk === 'high')
                  .slice(0, 3)
                  .map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-900">{student.name}</p>
                        <p className="text-sm text-red-700">Risk Score: {student.riskScore}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onUpdateStudent(student)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                    </div>
                  ))
                }
                {students.filter(s => s.dropoutRisk === 'high').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No high-risk students at the moment
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Updates Needed</CardTitle>
              <CardDescription>Students who may need data updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students
                  .filter(s => s.dropoutRisk === 'medium' || s.backlogs > 0)
                  .slice(0, 3)
                  .map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <p className="font-medium text-yellow-900">{student.name}</p>
                        <p className="text-sm text-yellow-700">
                          {student.backlogs > 0 ? `${student.backlogs} backlogs` : 'Medium risk'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onUpdateStudent(student.id)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}