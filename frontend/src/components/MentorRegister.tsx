import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { apiRegisterMentor } from '../lib/api';

interface MentorRegisterProps {
  onBackToLogin?: () => void;
}

export default function MentorRegister({ onBackToLogin }: MentorRegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [expertise, setExpertise] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      expertise: expertise.trim(),
    };

    if (!payload.full_name || !payload.email || !payload.password || !payload.expertise) {
      setError('All fields are required.');
      return;
    }
    if (!isValidEmail(payload.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (payload.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await apiRegisterMentor(payload);
      setSuccess('Registration successful. Redirecting to login…');
      setFullName('');
      setEmail('');
      setPassword('');
      setExpertise('');
      // Auto redirect to login after short delay
      setTimeout(() => {
        onBackToLogin && onBackToLogin();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Mentor Registration</CardTitle>
          <CardDescription>Create your mentor account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="e.g., Dr. A. B. Mentor" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="mentor@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expertise">Expertise</Label>
              <Input id="expertise" value={expertise} onChange={(e) => setExpertise(e.target.value)} required placeholder="e.g., Data Science, Counseling, AI/ML" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering…' : 'Register'}
            </Button>
            {onBackToLogin && (
              <Button type="button" variant="ghost" className="w-full" onClick={onBackToLogin}>
                Back to Login
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


