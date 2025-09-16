import React from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Heart, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  MessageSquare,
  User,
  LogOut,
  BookOpen
} from 'lucide-react';
import { getStudentById, CounselingNote } from './StudentData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function ParentDashboard() {
  const { user, logout } = useAuth();
  
  // Get child's student data (in real app, this would come from API)
  const childData = getStudentById(user?.childId || '');

  if (!childData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle>Child Profile Not Found</CardTitle>
            <CardDescription>
              Your child's academic profile hasn't been set up yet. Please contact the mentor to add your child's academic details.
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
      case 'low': return <TrendingUp className="h-5 w-5" />;
      case 'high': return <TrendingDown className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getRiskMessage = (risk: string) => {
    switch (risk) {
      case 'low': 
        return "Your child is performing excellently and is at low risk of academic difficulties. Continue to encourage their good work!";
      case 'medium': 
        return "Your child shows some areas that need attention. Consider discussing study habits and providing additional support where needed.";
      case 'high': 
        return "Your child needs immediate attention and support. We recommend scheduling a meeting with their mentor to discuss intervention strategies.";
      default: 
        return "Academic assessment in progress.";
    }
  };

  // Data for charts
  const performanceData = [
    { name: 'CGPA', value: childData.cgpa, max: 10 },
    { name: 'Attendance', value: childData.attendance, max: 100 },
    { name: 'Risk Score', value: 100 - childData.riskScore, max: 100 }
  ];

  const riskBreakdownData = [
    { name: 'Academic Performance', value: childData.cgpa >= 7.5 ? 10 : childData.cgpa >= 6.5 ? 25 : 40, color: '#10b981' },
    { name: 'Attendance', value: childData.attendance >= 85 ? 2 : childData.attendance >= 75 ? 10 : 30, color: '#3b82f6' },
    { name: 'Financial Status', value: childData.feeStatus === 'paid' ? 0 : childData.feeStatus === 'pending' ? 10 : 20, color: '#f59e0b' },
    { name: 'Backlogs', value: Math.min(childData.backlogs * 10, 30), color: '#ef4444' }
  ];

  // Filter counseling notes for parents (exclude private notes)
  const parentVisibleNotes = childData.counselingNotes.filter(note => !note.isPrivate);

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'academic': return <BookOpen className="h-4 w-4" />;
      case 'behavioral': return <User className="h-4 w-4" />;
      case 'financial': return <CreditCard className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-card/50 border-blue-200 dark:border-blue-900';
      case 'behavioral': return 'bg-card/50 border-purple-200 dark:border-purple-900';
      case 'financial': return 'bg-card/50 border-yellow-200 dark:border-yellow-900';
      default: return 'bg-card/50 border-gray-200 dark:border-gray-800';
    };
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-card text-card-foreground shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-medium">Parent Dashboard</h1>
                <p className="text-sm text-muted-foreground">Monitoring {childData.name}'s Academic Progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Parent Account</p>
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
        {/* Child Profile Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{childData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{childData.name}</CardTitle>
                <CardDescription className="text-base">
                  Student ID: {childData.id} • {childData.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Risk Assessment - Most Important for Parents */}
        <Card className={`mb-8 border-2 ${getRiskColor(childData.dropoutRisk)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getRiskIcon(childData.dropoutRisk)}
                <CardTitle className="ml-3">Academic Risk Assessment</CardTitle>
              </div>
              <Badge 
                variant={childData.dropoutRisk === 'low' ? 'secondary' : childData.dropoutRisk === 'medium' ? 'default' : 'destructive'}
                className="text-sm px-3 py-1"
              >
                {childData.dropoutRisk.toUpperCase()} RISK
              </Badge>
            </div>
            <CardDescription className="text-base">
              Based on academic performance, attendance, and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span>Overall Risk Score</span>
                  <span className="font-medium">{childData.riskScore}/100</span>
                </div>
                <Progress value={childData.riskScore} className="h-3" />
              </div>
              <div className="bg-card/70 p-6 rounded-lg">
                <p className="text-base leading-relaxed text-foreground">{getRiskMessage(childData.dropoutRisk)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-2">
                <div className="bg-blue-100 p-3 rounded-full">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-sm text-muted-foreground">Current CGPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-medium mb-2">{childData.cgpa}</div>
              <div className="text-xs text-muted-foreground">
                {childData.cgpa >= 8 ? 'Excellent Performance' : 
                 childData.cgpa >= 7 ? 'Good Performance' : 
                 childData.cgpa >= 6 ? 'Average Performance' : 'Needs Improvement'}
              </div>
              <div className="mt-3">
                <Progress value={(childData.cgpa / 10) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-2">
                <div className="bg-green-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-sm text-muted-foreground">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-medium mb-2">{childData.attendance}%</div>
              <div className="text-xs text-muted-foreground">
                {childData.attendance >= 90 ? 'Excellent Attendance' : 
                 childData.attendance >= 75 ? 'Good Attendance' : 'Poor Attendance'}
              </div>
              <div className="mt-3">
                <Progress value={childData.attendance} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-2">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <CreditCard className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-sm text-muted-foreground">Fee Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-medium mb-2 capitalize">{childData.feeStatus}</div>
              <Badge 
                variant={childData.feeStatus === 'paid' ? 'secondary' : childData.feeStatus === 'pending' ? 'default' : 'destructive'}
                className="mb-3"
              >
                {childData.feeStatus === 'paid' ? 'All Paid' : 
                 childData.feeStatus === 'pending' ? 'Payment Due' : 'Overdue'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-2">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-sm text-muted-foreground">Academic Backlogs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-medium mb-2">{childData.backlogs}</div>
              <div className="text-xs text-muted-foreground">
                {childData.backlogs === 0 ? 'No Backlogs' : 
                 childData.backlogs <= 2 ? 'Manageable' : 'Concerning'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Overview Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance Overview</CardTitle>
              <CardDescription>Visual representation of key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'CGPA' ? `${value}/10` : 
                      name === 'Risk Score' ? `${100 - (childData.riskScore)}% Positive` : `${value}%`, 
                      name
                    ]} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Factors Breakdown</CardTitle>
              <CardDescription>Understanding what contributes to the risk score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {riskBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} points`, 'Risk Points']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {riskBreakdownData.map((item, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Counseling Notes & Mentor Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Mentor Feedback & Counseling Notes</CardTitle>
            <CardDescription>
              Updates and insights from your child's academic mentor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parentVisibleNotes.length > 0 ? (
              <div className="space-y-4">
                {parentVisibleNotes
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((note) => (
                    <div key={note.id} className={`p-4 rounded-lg border ${getNoteTypeColor(note.type)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-foreground">{getNoteTypeIcon(note.type)}</span>
                          <span className="font-medium capitalize text-foreground">{note.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(note.date).toLocaleDateString()}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">by {note.mentorName}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">{note.note}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No counseling notes available yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Mentor feedback will appear here when available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Items for Parents */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How You Can Help</CardTitle>
            <CardDescription>
              Recommended actions based on your child's current academic status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {childData.cgpa < 7 && (
                <div className="flex items-start space-x-3 p-4 bg-card/50 rounded-lg border border-blue-200 dark:border-blue-900">
                  <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Academic Support</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Consider arranging additional tutoring or study support to help improve grades.
                    </p>
                  </div>
                </div>
              )}
              
              {childData.attendance < 85 && (
                <div className="flex items-start space-x-3 p-4 bg-card/50 rounded-lg border border-green-200 dark:border-green-900">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Attendance Monitoring</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Discuss the importance of regular attendance and help establish morning routines.
                    </p>
                  </div>
                </div>
              )}
              
              {childData.feeStatus !== 'paid' && (
                <div className="flex items-start space-x-3 p-4 bg-card/50 rounded-lg border border-yellow-200 dark:border-yellow-900">
                  <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Financial Planning</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contact the finance office to discuss payment options or available scholarships.
                    </p>
                  </div>
                </div>
              )}
              
              {childData.backlogs > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-card/50 rounded-lg border border-red-200 dark:border-red-900">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Academic Recovery</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Work with your child to create a study plan for clearing backlogs.
                    </p>
                  </div>
                </div>
              )}
              
              {childData.dropoutRisk === 'high' && (
                <div className="flex items-start space-x-3 p-4 bg-card/50 rounded-lg border border-purple-200 dark:border-purple-900">
                  <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Emotional Support</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Consider counseling services and maintain open communication about challenges.
                    </p>
                  </div>
                </div>
              )}
              
              {childData.dropoutRisk === 'low' && (
                <div className="flex items-start space-x-3 p-4 bg-card/50 rounded-lg border border-green-200 dark:border-green-900">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Continue Excellence</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Celebrate achievements and encourage participation in advanced opportunities.
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