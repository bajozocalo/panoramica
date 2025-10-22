'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ExternalLayout from '@/components/ui/ExternalLayout';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please log in.');
      } else {
        setError('Failed to create an account');
      }
      console.error(err);
    }
  };

  return (
    <ExternalLayout>
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Enter your email and password to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSignup}>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div>
                <Button type="submit" className="w-full">
                  Create account
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-center">
            <p>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </ExternalLayout>
  );
}
