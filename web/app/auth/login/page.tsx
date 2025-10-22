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

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to log in');
      console.error(err);
    }
  };

  return (
    <ExternalLayout>
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Log in to Panoramica</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleLogin}>
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
                  autoComplete="current-password"
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
                  Log in
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-center">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </ExternalLayout>
  );
}
