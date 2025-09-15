import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Heart, User, GraduationCap, Calendar, CreditCard, BookOpen } from 'lucide-react';
import { mockStudents, calculateDropoutRisk, StudentRecord } from './StudentData';

interface ParentOnboardingProps {
  onComplete: (childData: StudentRecord) => void;
}

export function ParentOnboarding({ onComplete }: ParentOnboardingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [childData, setChildData] = useState({
    name: '',
    email: '',
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
      // Validate parent info step
      if (!user?.name || !user?.email) {
        setError('User information is missing');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate child basic info
      if (!childData.name || !childData.email) {
        setError('Please provide your child\'s name and email');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate academic info
    const cgpa = parseFloat(childData.cgpa);
    const attendance = parseInt(childData.attendance);
    const backlogs = parseInt(childData.backlogs);

    if (!childData.cgpa || !childData.attendance || !childData.feeStatus || !childData.backlogs) {
      setError('Please fill in all required fields');
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

    setIsSubmitting(true);

    try {
      // Calculate dropout risk
      const { risk, score } = calculateDropoutRisk(
        cgpa,
        attendance,
        childData.feeStatus,
        backlogs
      );

      // Create new student record for the child
      const newStudentRecord: StudentRecord = {
        id: user?.childId || `STU${Date.now()}`,
        name: childData.name,
        email: childData.email,
        cgpa: cgpa,
        attendance: attendance,
        feeStatus: childData.feeStatus,
        backlogs: backlogs,
        dropoutRisk: risk,
        riskScore: score,
        counselingNotes: [{
          id: 'note1',
          date: new Date().toISOString().split('T')[0],
          mentorName: 'System',
          note: 'Student profile created by parent. Initial academic data provided.',
          type: 'general',
          isPrivate: false
        }]
      };

      // Add to mock students array
      mockStudents.push(newStudentRecord);

      // Call completion callback
      onComplete(newStudentRecord);
    } catch (err) {
      setError('An error occurred while setting up your child\'s profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Parent! Let's Set Up Your Child's Profile</CardTitle>
          <CardDescription>
            We need some basic information about your child to get started with academic tracking
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
                <h3 className="text-lg font-medium mb-2">Parent Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Let's confirm your details
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Your Name</p>
                      <p className="text-sm text-muted-foreground">{user?.name}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Email Address</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:col-span-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Your Child's Student ID</p>
                      <p className="text-sm text-muted-foreground">{user?.childId || 'Not specified'}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This information was provided during registration. 
                  If you need to make changes, please contact the administration.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext}>
                  Next: Child's Basic Info
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Child's Basic Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Please provide your child's basic details
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="childName" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Child's Full Name
                  </Label>
                  <Input
                    id="childName"
                    type="text"
                    value={childData.name}
                    onChange={(e) => setChildData({ ...childData, name: e.target.value })}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childEmail" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Child's Email Address
                  </Label>
                  <Input
                    id="childEmail"
                    type="email"
                    value={childData.email}
                    onChange={(e) => setChildData({ ...childData, email: e.target.value })}
                    placeholder="e.g., john.doe@student.edu"
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Please ensure the email address is correct as it will be used 
                  for academic notifications and communications.
                </p>
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
                  Next: Academic Information
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Child's Academic Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Please provide your child's current academic details
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
                    value={childData.cgpa}
                    onChange={(e) => setChildData({ ...childData, cgpa: e.target.value })}
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
                    value={childData.attendance}
                    onChange={(e) => setChildData({ ...childData, attendance: e.target.value })}
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
                    value={childData.feeStatus} 
                    onValueChange={(value: 'paid' | 'pending' | 'overdue') => 
                      setChildData({ ...childData, feeStatus: value })}
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
                    value={childData.backlogs}
                    onChange={(e) => setChildData({ ...childData, backlogs: e.target.value })}
                    placeholder="e.g., 0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Number of subjects to be cleared</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Privacy Note:</strong> This information will be used to assess your child's academic risk 
                  and provide personalized support. You can view updates and progress from your parent dashboard.
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Setting Up Profile...' : 'Complete Setup'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}