'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import Link from 'next/link';
import SignOutButton from '@/components/ui/SignOutButton';
import CreditBalance from '@/components/ui/CreditBalance';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Mail, Lock, CreditCard } from 'lucide-react';

interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  credits: number;
  createdAt: Date;
}

export default function SettingsPage() {
  const { user, loading: authLoading, userLoaded } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (userLoaded && !user) {
      router.push('/auth/login');
    }
  }, [user, userLoaded, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const profileData = {
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            credits: data.credits || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
          setProfile(profileData);
          setDisplayName(profileData.displayName);
          setNewEmail(profileData.email);
          setAvatarPreview(profileData.photoURL);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({ title: 'Error', description: 'Failed to load profile data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user, toast]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      let photoURL = profile?.photoURL || '';

      // Upload new avatar if selected
      if (avatarFile) {
        const filePath = `avatars/${user.uid}/${Date.now()}_${avatarFile.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, avatarFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL,
      });

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName,
        photoURL: photoURL,
      });

      setProfile(prev => prev ? { ...prev, displayName, photoURL } : null);
      setAvatarFile(null);

      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newEmail === user.email) return;

    setSaving(true);
    try {
      await updateEmail(user, newEmail);

      toast({ title: 'Success', description: 'Email updated successfully. Please verify your new email.' });
    } catch (error: any) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast({ title: 'Re-authentication Required', description: 'Please log out and log back in to change your email', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message || 'Failed to update email', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await updatePassword(user, newPassword);

      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');

      toast({ title: 'Success', description: 'Password updated successfully' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast({ title: 'Re-authentication Required', description: 'Please log out and log back in to change your password', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message || 'Failed to update password', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !userLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Panoramica.digital</h1>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <CreditBalance />
              <Link href="/pricing">
                <Button size="sm" className="hidden sm:inline-flex">Buy Credits</Button>
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your profile and account preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile picture</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarPreview || undefined} alt={displayName} />
                      <AvatarFallback className="text-2xl">
                        {displayName ? getInitials(displayName) : <User className="h-12 w-12" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
                          <Camera className="h-4 w-4" />
                          <span className="text-sm">Change Photo</span>
                        </div>
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-display">Email</Label>
                    <Input
                      id="email-display"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Change your email in the Security tab</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <Input
                      value={profile?.createdAt.toLocaleDateString() || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDisplayName(profile?.displayName || '');
                        setAvatarPreview(profile?.photoURL || null);
                        setAvatarFile(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Change Email
                  </CardTitle>
                  <CardDescription>Update your email address</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-email">Current Email</Label>
                      <Input
                        id="current-email"
                        value={profile?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-email">New Email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email"
                      />
                    </div>
                    <Button type="submit" disabled={saving || newEmail === profile?.email}>
                      {saving ? 'Updating...' : 'Update Email'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                    </div>
                    <Button type="submit" disabled={saving || !newPassword || !confirmPassword}>
                      {saving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Credits & Billing
                </CardTitle>
                <CardDescription>Manage your credits and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-3xl font-bold">{profile?.credits || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Credits available</p>
                  </div>
                  <Link href="/pricing">
                    <Button>Buy More Credits</Button>
                  </Link>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Credit Usage</h3>
                  <p className="text-sm text-muted-foreground">
                    Each image generation costs 1 credit per scene. Custom prompts cost 6 credits.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full">View Pricing Plans</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
