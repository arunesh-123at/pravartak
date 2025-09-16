import React from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  User,
  LogOut
} from 'lucide-react';
import { getStudentById } from './StudentData';
import { useEffect, useState } from 'react';
import { apiGetStudent } from '../lib/api';

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const [studentData, setStudentData] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      // Try mock store by stored studentId first
      if (user?.studentId) {
        const local = getStudentById(user.studentId);
        if (local) {
          setStudentData(local);
          return;
        }
      }
      // Fallback: if backend assigned numeric id, fetch by it
      if (user?.id) {
        try {
          const s = await apiGetStudent(Number(user.id));
          setStudentData({
            id: String(s.id),
            name: s.full_name,
            email: s.email,
            cgpa: s.current_cgpa,
            attendance: s.attendance_percentage,
            feeStatus: s.fee_status === 'payment_overdue' ? 'overdue' : (s.fee_status === 'payment_pending' ? 'pending' : 'paid'),
            backlogs: s.backlogs,
            dropoutRisk: 'medium',
            riskScore: 0,
            counselingNotes: [],
          });
        } catch (_) {
          setStudentData(null);
        }
      }
    };
    load();
  }, [user?.studentId, user?.id]);

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              Your academic profile hasn't been set up yet. Please contact your mentor to add your academic details.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 dark:text-green-400 bg-card/50 border-green-200 dark:border-green-900';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-card/50 border-yellow-200 dark:border-yellow-900';
      case 'high': return 'text-red-600 dark:text-red-400 bg-card/50 border-red-200 dark:border-red-900';
      default: return 'text-gray-600 dark:text-gray-400 bg-card/50 border-gray-200 dark:border-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <TrendingUp className="h-4 w-4" />;
      case 'high': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-card text-card-foreground shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-medium">Student Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-1" />
                {studentData.id}
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Risk Alert */}
        <Card className={`mb-8 border-2 ${getRiskColor(studentData.dropoutRisk)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getRiskIcon(studentData.dropoutRisk)}
                <CardTitle className="ml-2">Dropout Risk Assessment</CardTitle>
              </div>
              <Badge variant={studentData.dropoutRisk === 'low' ? 'secondary' : studentData.dropoutRisk === 'medium' ? 'default' : 'destructive'}>
                {studentData.dropoutRisk.toUpperCase()} RISK
              </Badge>
            </div>
            <CardDescription>
              Based on your academic performance and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Risk Score</span>
                  <span>{studentData.riskScore}/100</span>
                </div>
                <Progress value={studentData.riskScore} className="h-2" />
              </div>
              <div className="bg-card/50 p-4 rounded-lg">
                <p className="text-sm text-foreground">
                  {studentData.dropoutRisk === 'low' && 
                    "Great job! You're on track for academic success. Keep up the excellent work with your studies and attendance."}
                  {studentData.dropoutRisk === 'medium' && 
                    "Your performance indicates some areas for improvement. Consider reaching out to your mentor for guidance and support."}
                  {studentData.dropoutRisk === 'high' && 
                    "Your current metrics suggest significant challenges. It's important to connect with your mentor immediately for personalized support and intervention strategies."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">CGPA</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">{studentData.cgpa}</div>
              <p className="text-xs text-muted-foreground">
                {studentData.cgpa >= 8 ? 'Excellent' : 
                 studentData.cgpa >= 7 ? 'Good' : 
                 studentData.cgpa >= 6 ? 'Average' : 'Needs Improvement'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">{studentData.attendance}%</div>
              <p className="text-xs text-muted-foreground">
                {studentData.attendance >= 90 ? 'Excellent' : 
                 studentData.attendance >= 75 ? 'Good' : 'Poor'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Fee Status</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium capitalize">{studentData.feeStatus}</div>
              <Badge variant={studentData.feeStatus === 'paid' ? 'secondary' : studentData.feeStatus === 'pending' ? 'default' : 'destructive'} className="text-xs">
                {studentData.feeStatus === 'paid' ? 'Up to date' : 
                 studentData.feeStatus === 'pending' ? 'Payment due' : 'Overdue'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Backlogs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">{studentData.backlogs}</div>
              <p className="text-xs text-muted-foreground">
                {studentData.backlogs === 0 ? 'No backlogs' : 
                 studentData.backlogs <= 2 ? 'Manageable' : 'Concerning'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Personalized Recommendations</CardTitle>
            <CardDescription>
              Actions you can take to improve your academic success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentData.cgpa < 7 && (
                <div className="flex items-start space-x-3 p-3 bg-card/50 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Improve Academic Performance</p>
                    <p className="text-sm text-muted-foreground">
                      Consider additional study sessions, tutoring, or joining study groups to boost your CGPA.
                    </p>
                  </div>
                </div>
              )}
              
              {studentData.attendance < 85 && (
                <div className="flex items-start space-x-3 p-3 bg-card/50 border border-green-200 dark:border-green-900 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Improve Attendance</p>
                    <p className="text-sm text-muted-foreground">
                      Regular class attendance is crucial for academic success. Aim for at least 85% attendance.
                    </p>
                  </div>
                </div>
              )}
              
              {studentData.feeStatus !== 'paid' && (
                <div className="flex items-start space-x-3 p-3 bg-card/50 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                  <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Resolve Fee Issues</p>
                    <p className="text-sm text-muted-foreground">
                      Contact the finance office to discuss payment plans or available scholarships.
                    </p>
                  </div>
                </div>
              )}
              
              {studentData.backlogs > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-card/50 border border-red-200 dark:border-red-900 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Clear Backlogs</p>
                    <p className="text-sm text-muted-foreground">
                      Focus on clearing your backlogs as soon as possible. Speak with your mentor about a study plan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}