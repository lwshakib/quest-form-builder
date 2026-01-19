'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Shield, Trash2, Smartphone, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export default function AccountPage() {
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update name when session loads
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const [sessions, setSessions] = useState([
    { id: '1', device: 'Chrome on Windows', location: 'Dhaka, Bangladesh', current: true, date: 'Active now' },
    { id: '2', device: 'Safari on iPhone', location: 'Dhaka, Bangladesh', current: false, date: '2 days ago' },
  ]);

  if (isPending) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container max-w-4xl py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" /> Sessions
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2 text-destructive">
            <Shield className="h-4 w-4" /> Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information and how others see you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="max-w-md bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  value={session.user.email} 
                  readOnly 
                  className="max-w-md bg-muted/50 cursor-not-allowed"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={async () => {
                  setIsUpdating(true);
                  const { error } = await authClient.updateUser({
                    name: name,
                  });
                  if (error) {
                    toast.error(error.message || "Failed to update profile");
                  } else {
                    toast.success("Profile updated successfully");
                  }
                  setIsUpdating(false);
                }}
                disabled={isUpdating}
                className="bg-primary/90 hover:bg-primary transition-all duration-300"
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="pt-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="max-w-md bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="max-w-md bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="max-w-md bg-background/50" />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={async () => {
                  if (newPassword !== confirmPassword) {
                    toast.error("Passwords do not match");
                    return;
                  }
                  setIsUpdating(true);
                  const { error } = await authClient.changePassword({
                    newPassword: newPassword,
                    currentPassword: currentPassword,
                    revokeOtherSessions: true,
                  });
                  if (error) {
                    toast.error(error.message || "Failed to change password");
                  } else {
                    toast.success("Password updated successfully");
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }
                  setIsUpdating(false);
                }}
                disabled={isUpdating}
                className="bg-primary/90 hover:bg-primary transition-all duration-300"
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="pt-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>This is a list of devices that have logged into your account. Revoke any sessions that you do not recognize.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session, index) => (
                <div key={session.id}>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {session.device}
                          {session.current && <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border border-green-500/20">Current</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">{session.location} • {session.date}</p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        Revoke
                      </Button>
                    )}
                  </div>
                  {index < sessions.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="pt-6">
          <Card className="border border-destructive/20 shadow-xl bg-destructive/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>
                Once you delete your account, there is no going back. Please be certain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                All of your quests, responses, and data will be permanently removed. This action cannot be undone.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" className="flex items-center gap-2 shadow-lg shadow-destructive/20 scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Trash2 className="h-4 w-4" /> Delete Account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
