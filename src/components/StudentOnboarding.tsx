import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { GraduationCap, User, Calendar, CreditCard, BookOpen } from 'lucide-react';
import { mockStudents, calculateDropoutRisk, StudentRecord } from './StudentData';

interface StudentOnboardingProps {
  onComplete: (studentData: StudentRecord) => void;
}

export function StudentOnboarding({ onComplete }: StudentOnboardingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cgpa: '',
    attendance: '',
    feeStatus: '' as 'paid' | 'pending' | 'overdue' | '',
    backlogs: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    setError('');
    
    if (step === 1) {
      // Validate personal info step
      if (!user?.name || !user?.email) {
        setError('User information is missing');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate academic info
    const cgpa = parseFloat(formData.cgpa);
    const attendance = parseInt(formData.attendance);
    const backlogs = parseInt(formData.backlogs);

    if (!formData.cgpa || !formData.attendance || !formData.feeStatus || !formData.backlogs) {
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
        formData.feeStatus,
        backlogs
      );

      // Create new student record
      const newStudentRecord: StudentRecord = {
        id: user?.studentId || `STU${Date.now()}`,
        name: user?.name || '',
        email: user?.email || '',
        cgpa: cgpa,
        attendance: attendance,
        feeStatus: formData.feeStatus,
        backlogs: backlogs,
        dropoutRisk: risk,
        riskScore: score,
        counselingNotes: []
      };

      // Add to mock students array
      mockStudents.push(newStudentRecord);

      // Call completion callback
      onComplete(newStudentRecord);
    } catch (err) {
      setError('An error occurred while setting up your profile');
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
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome! Let's Set Up Your Profile</CardTitle>
          <CardDescription>
            We need some basic information to get started with your academic tracking
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
                <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Let's confirm your basic details
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Full Name</p>
                      <p className="text-sm text-muted-foreground">{user?.name}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Student ID</p>
                      <p className="text-sm text-muted-foreground">{user?.studentId}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:col-span-2">
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
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This information was provided during registration. 
                  If you need to make changes, please contact the administration.
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Academic Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Please provide your current academic details
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
                    value={formData.cgpa}
                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
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
                    value={formData.attendance}
                    onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                    placeholder="e.g., 85"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Your overall attendance percentage</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeStatus" className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Fee Payment Status
                  </Label>
                  <Select 
                    value={formData.feeStatus} 
                    onValueChange={(value: 'paid' | 'pending' | 'overdue') => 
                      setFormData({ ...formData, feeStatus: value })}
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
                  <p className="text-xs text-muted-foreground">Current status of your fee payments</p>
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
                    value={formData.backlogs}
                    onChange={(e) => setFormData({ ...formData, backlogs: e.target.value })}
                    placeholder="e.g., 0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Number of subjects you need to clear</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Privacy Note:</strong> This information will be used to assess your academic risk 
                  and provide personalized support. You can update these details later from your dashboard.
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
                  onClick={() => setStep(1)}
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