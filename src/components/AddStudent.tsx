import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { ArrowLeft, UserPlus, User, GraduationCap, Calendar, CreditCard, BookOpen, Mail } from 'lucide-react';
import { mockStudents, calculateDropoutRisk, StudentRecord, User as UserType } from './StudentData';
import { mockUsers } from './AuthContext';

interface AddStudentProps {
  onBack: () => void;
  onStudentAdded: (student: StudentRecord) => void;
}

export function AddStudent({ onBack, onStudentAdded }: AddStudentProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    role: 'student' as 'student' | 'parent',
    parentName: '',
    parentEmail: '',
    cgpa: '',
    attendance: '',
    feeStatus: '' as 'paid' | 'pending' | 'overdue' | '',
    backlogs: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    setError('');
    
    if (step === 1) {
      // Validate basic info
      if (!studentData.name || !studentData.email) {
        setError('Please provide student name and email');
        return;
      }
      if (studentData.role === 'parent' && (!studentData.parentName || !studentData.parentEmail)) {
        setError('Please provide parent information');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate academic info
      const cgpa = parseFloat(studentData.cgpa);
      const attendance = parseInt(studentData.attendance);
      const backlogs = parseInt(studentData.backlogs);

      if (!studentData.cgpa || !studentData.attendance || !studentData.feeStatus || !studentData.backlogs) {
        setError('Please fill in all academic fields');
        return;
      }

      if (cgpa < 0 || cgpa > 10) {
        setError('CGPA must be between 0 and 10');
        return;
      }

      if (attendance < 0 || attendance > 100) {
        setError('Attendance must be between 0 and 100%');
        return;
      }

      if (backlogs < 0) {
        setError('Backlogs cannot be negative');
        return;
      }

      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      const studentId = `STU${timestamp}`;
      
      // Calculate dropout risk
      const { risk, score } = calculateDropoutRisk(
        parseFloat(studentData.cgpa),
        parseInt(studentData.attendance),
        studentData.feeStatus,
        parseInt(studentData.backlogs)
      );

      // Create new student record
      const newStudentRecord: StudentRecord = {
        id: studentId,
        name: studentData.name,
        email: studentData.email,
        cgpa: parseFloat(studentData.cgpa),
        attendance: parseInt(studentData.attendance),
        feeStatus: studentData.feeStatus,
        backlogs: parseInt(studentData.backlogs),
        dropoutRisk: risk,
        riskScore: score,
        counselingNotes: [{
          id: 'note1',
          date: new Date().toISOString().split('T')[0],
          mentorName: user?.name || 'Mentor',
          note: 'Student profile created by mentor. Initial academic assessment completed.',
          type: 'general',
          isPrivate: false
        }]
      };

      // Add to mock students array
      mockStudents.push(newStudentRecord);

      // Create student login account
      const newStudentUser: UserType = {
        id: `student${timestamp}`,
        email: studentData.email,
        name: studentData.name,
        role: 'student',
        studentId: studentId
      };
      mockUsers.push(newStudentUser);

      // If creating parent account, add parent user too
      if (studentData.role === 'parent' && studentData.parentName && studentData.parentEmail) {
        const newParentUser: UserType = {
          id: `parent${timestamp}`,
          email: studentData.parentEmail,
          name: studentData.parentName,
          role: 'parent',
          childId: studentId
        };
        mockUsers.push(newParentUser);
      }

      // Call completion callback
      onStudentAdded(newStudentRecord);
    } catch (err) {
      setError('An error occurred while creating the student profile');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <h1>Add New Student</h1>
          </div>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <UserPlus className="h-6 w-6" />
              <span>Create Student Profile</span>
            </CardTitle>
            <CardDescription>
              Add a new student to the system with their academic details
            </CardDescription>
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">Step {step} of {totalSteps}</p>
            </div>
          </CardHeader>

          <CardContent>
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Student Information</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Basic details about the student
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="studentName" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Student Full Name
                    </Label>
                    <Input
                      id="studentName"
                      type="text"
                      value={studentData.name}
                      onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentEmail" className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Student Email Address
                    </Label>
                    <Input
                      id="studentEmail"
                      type="email"
                      value={studentData.email}
                      onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
                      placeholder="e.g., john.doe@student.edu"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Account Creation
                    </Label>
                    <Select 
                      value={studentData.role} 
                      onValueChange={(value: 'student' | 'parent') => 
                        setStudentData({ ...studentData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Create student account only</SelectItem>
                        <SelectItem value="parent">Create both student and parent accounts</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose whether to create just a student account or both student and parent accounts
                    </p>
                  </div>

                  {studentData.role === 'parent' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="parentName" className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Parent/Guardian Name
                        </Label>
                        <Input
                          id="parentName"
                          type="text"
                          value={studentData.parentName}
                          onChange={(e) => setStudentData({ ...studentData, parentName: e.target.value })}
                          placeholder="e.g., Jane Doe"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parentEmail" className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          Parent Email Address
                        </Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          value={studentData.parentEmail}
                          onChange={(e) => setStudentData({ ...studentData, parentEmail: e.target.value })}
                          placeholder="e.g., jane.doe@email.com"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Login Access:</strong> The student will be able to login with their email and the default password "password". 
                    {studentData.role === 'parent' && ' The parent will also receive login credentials.'}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext}>
                    Next: Academic Information
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Academic Information</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Current academic details and status
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cgpa" className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Current CGPA
                    </Label>
                    <Input
                      id="cgpa"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={studentData.cgpa}
                      onChange={(e) => setStudentData({ ...studentData, cgpa: e.target.value })}
                      placeholder="e.g., 7.5"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Scale: 0.0 to 10.0</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendance" className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Attendance Percentage
                    </Label>
                    <Input
                      id="attendance"
                      type="number"
                      min="0"
                      max="100"
                      value={studentData.attendance}
                      onChange={(e) => setStudentData({ ...studentData, attendance: e.target.value })}
                      placeholder="e.g., 85"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Overall attendance percentage</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feeStatus" className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Fee Payment Status
                    </Label>
                    <Select 
                      value={studentData.feeStatus} 
                      onValueChange={(value: 'paid' | 'pending' | 'overdue') => 
                        setStudentData({ ...studentData, feeStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">All Fees Paid</SelectItem>
                        <SelectItem value="pending">Payment Pending</SelectItem>
                        <SelectItem value="overdue">Payment Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Current status of fee payments</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backlogs" className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Number of Backlogs
                    </Label>
                    <Input
                      id="backlogs"
                      type="number"
                      min="0"
                      value={studentData.backlogs}
                      onChange={(e) => setStudentData({ ...studentData, backlogs: e.target.value })}
                      placeholder="e.g., 0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Number of subjects to be cleared</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(1)}
                  >
                    Previous
                  </Button>
                  <Button onClick={handleNext}>
                    Next: Review & Create
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Review & Create Student</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Please review the information before creating the student profile
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Student Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{studentData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{studentData.email}</span>
                      </div>
                    </div>
                  </Card>

                  {studentData.role === 'parent' && (
                    <Card className="p-4">
                      <h4 className="font-medium mb-3">Parent Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span>{studentData.parentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{studentData.parentEmail}</span>
                        </div>
                      </div>
                    </Card>
                  )}

                  <Card className="p-4 md:col-span-2">
                    <h4 className="font-medium mb-3">Academic Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">CGPA</span>
                        <span>{studentData.cgpa}/10</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Attendance</span>
                        <span>{studentData.attendance}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Fee Status</span>
                        <span className="capitalize">{studentData.feeStatus}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Backlogs</span>
                        <span>{studentData.backlogs}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Ready to Create:</strong> All information has been validated. The student profile will be created with 
                    calculated dropout risk assessment. Login credentials will use the default password "password".
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(2)}
                    disabled={isSubmitting}
                  >
                    Previous
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Creating Student...' : 'Create Student Profile'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}