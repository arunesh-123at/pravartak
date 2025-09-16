import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Save, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { getStudentById, updateStudentRecord, StudentRecord, calculateDropoutRisk } from './StudentData';
import { apiUpdateStudent, apiGetStudent, apiPredictRisk } from '../lib/api';

interface MentorUpdateProps {
  studentId: string;
  onBack: () => void;
  initialStudent?: StudentRecord | null;
}

export function MentorUpdate({ studentId, onBack, initialStudent }: MentorUpdateProps) {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [formData, setFormData] = useState({
    cgpa: '',
    attendance: '',
    feeStatus: '' as 'paid' | 'pending' | 'overdue' | '',
    backlogs: ''
  });
  const [previewRisk, setPreviewRisk] = useState<{ risk: 'low' | 'medium' | 'high'; score: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Try from mock store first
    let studentData = getStudentById(studentId);
    // Fall back to provided initialStudent (from backend list) if not found in mock
    if (!studentData && initialStudent) {
      studentData = initialStudent;
    }
    if (studentData) {
      setStudent(studentData);
      setFormData({
        cgpa: studentData.cgpa.toString(),
        attendance: studentData.attendance.toString(),
        feeStatus: studentData.feeStatus,
        backlogs: studentData.backlogs.toString()
      });
    }
  }, [studentId, initialStudent]);

  useEffect(() => {
    // Calculate preview risk when form data changes
    if (formData.cgpa && formData.attendance && formData.feeStatus && formData.backlogs !== '') {
      const cgpa = parseFloat(formData.cgpa);
      const attendance = parseInt(formData.attendance);
      const backlogs = parseInt(formData.backlogs);
      
      if (!isNaN(cgpa) && !isNaN(attendance) && !isNaN(backlogs)) {
        const risk = calculateDropoutRisk(cgpa, attendance, formData.feeStatus, backlogs);
        setPreviewRisk(risk);
      }
    } else {
      setPreviewRisk(null);
    }
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cgpa = parseFloat(formData.cgpa);
      const attendance = parseInt(formData.attendance);
      const backlogs = parseInt(formData.backlogs);

      // Validate inputs
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        setError('CGPA must be between 0 and 10');
        return;
      }
      if (isNaN(attendance) || attendance < 0 || attendance > 100) {
        setError('Attendance must be between 0 and 100');
        return;
      }
      if (isNaN(backlogs) || backlogs < 0) {
        setError('Backlogs cannot be negative');
        return;
      }

      // Update backend
      await apiUpdateStudent(Number(studentId), {
        current_cgpa: cgpa,
        attendance_percentage: attendance,
        fee_status: formData.feeStatus === 'overdue' ? 'payment_overdue' : (formData.feeStatus === 'pending' ? 'payment_pending' : 'paid'),
        backlogs,
      });

      // Fetch latest from backend to ensure UI reflects DB
      try {
        const fresh = await apiGetStudent(Number(studentId));
        const feeStatus = fresh.fee_status === 'payment_overdue' ? 'overdue' : (fresh.fee_status === 'payment_pending' ? 'pending' : 'paid');
        let risk: 'low' | 'medium' | 'high' = 'medium';
        let score = 50;
        try {
          const r = await apiPredictRisk({
            current_cgpa: fresh.current_cgpa,
            attendance_percentage: fresh.attendance_percentage,
            fee_status: fresh.fee_status,
            backlogs: fresh.backlogs,
          });
          risk = r.risk_level.toLowerCase() as 'low' | 'medium' | 'high';
          score = risk === 'high' ? 80 : risk === 'medium' ? 50 : 20;
        } catch {}
        const mapped: StudentRecord = {
          id: String(fresh.id),
          name: fresh.full_name,
          email: fresh.email,
          cgpa: fresh.current_cgpa,
          attendance: fresh.attendance_percentage,
          feeStatus,
          backlogs: fresh.backlogs,
          dropoutRisk: risk,
          riskScore: score,
          counselingNotes: student?.counselingNotes || []
        };
        setStudent(mapped);
      } catch (_) {
        // fallback: optimistic local update
        const updatedStudent = updateStudentRecord(studentId, {
          cgpa,
          attendance,
          feeStatus: formData.feeStatus,
          backlogs
        });
        if (updatedStudent) setStudent(updatedStudent);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('An error occurred while updating the record');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!student) {
    return <div>Student not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-card text-card-foreground shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={onBack} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-medium">Update Student Record</h1>
                <p className="text-sm text-muted-foreground">{student.name} ({student.id})</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Student record updated successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Update Form */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>
                Update the student's academic performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cgpa">CGPA</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      className="pl-10"
                      placeholder="Enter CGPA (0-10)"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendance">Attendance (%)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="attendance"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.attendance}
                      onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                      className="pl-10"
                      placeholder="Enter attendance percentage"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeStatus">Fee Status</Label>
                  <Select value={formData.feeStatus} onValueChange={(value: 'paid' | 'pending' | 'overdue') => setFormData({ ...formData, feeStatus: value })}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Select fee status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backlogs">Number of Backlogs</Label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="backlogs"
                      type="number"
                      min="0"
                      value={formData.backlogs}
                      onChange={(e) => setFormData({ ...formData, backlogs: e.target.value })}
                      className="pl-10"
                      placeholder="Enter number of backlogs"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Updating...' : 'Update Record'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current vs Preview */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
                <CardDescription>Student's current academic standing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">CGPA</p>
                      <p className="text-lg font-medium">{student.cgpa}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Attendance</p>
                      <p className="text-lg font-medium">{student.attendance}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fee Status</p>
                      <Badge variant={student.feeStatus === 'paid' ? 'secondary' : student.feeStatus === 'pending' ? 'default' : 'destructive'} className="capitalize">
                        {student.feeStatus}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Backlogs</p>
                      <p className="text-lg font-medium">{student.backlogs}</p>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border ${getRiskColor(student.dropoutRisk)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getRiskIcon(student.dropoutRisk)}
                        <span className="ml-2 font-medium capitalize">{student.dropoutRisk} Risk</span>
                      </div>
                      <span className="text-sm">Score: {student.riskScore}/100</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            {previewRisk && (
              <Card>
                <CardHeader>
                  <CardTitle>Updated Preview</CardTitle>
                  <CardDescription>Predicted risk after updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`p-4 rounded-lg border ${getRiskColor(previewRisk.risk)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getRiskIcon(previewRisk.risk)}
                        <span className="ml-2 font-medium capitalize">{previewRisk.risk} Risk</span>
                      </div>
                      <span className="text-sm">Score: {previewRisk.score}/100</span>
                    </div>
                  </div>
                  
                  {previewRisk.risk !== student.dropoutRisk && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Risk level will change:</strong> {student.dropoutRisk} → {previewRisk.risk}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Update Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <GraduationCap className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p>Update CGPA regularly after exam results</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                    <p>Monitor attendance monthly or after significant absences</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CreditCard className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p>Update fee status when payments are made</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <p>Update backlogs after supplementary exams</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}