"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Shield, Trash2, Smartphone, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function AccountPage() {
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Update name when session loads
  useEffect(() => {
    if (session?.user?.name && !name) {
      setName(session.user.name);
    }
  }, [session?.user?.name, name]); // eslint-disable-line react-hooks/set-state-in-effect

  const [sessions] = useState([
    {
      id: "1",
      device: "Chrome on Windows",
      location: "Dhaka, Bangladesh",
      current: true,
      date: "Active now",
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "Dhaka, Bangladesh",
      current: false,
      date: "2 days ago",
    },
  ]);

  if (isPending) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 container mx-auto max-w-4xl space-y-8 py-10 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-12">
        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <User className="text-primary/70 h-3.5 w-3.5" />
            <h2 className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
              Profile Settings
            </h2>
          </div>
          <Card className="bg-card/50 border-none shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and how others see you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50 max-w-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={session.user.email}
                  readOnly
                  className="bg-muted/50 max-w-md cursor-not-allowed"
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
        </section>

        {/* Security Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Lock className="text-primary/70 h-3.5 w-3.5" />
            <h2 className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
              Security & Privacy
            </h2>
          </div>
          <Card className="bg-card/50 border-none shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Ensure your account is using a long, random password to stay secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-background/50 max-w-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background/50 max-w-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background/50 max-w-md"
                />
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
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
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
        </section>

        {/* Sessions Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Smartphone className="text-primary/70 h-3.5 w-3.5" />
            <h2 className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
              Active Sessions
            </h2>
          </div>
          <Card className="bg-card/50 border-none shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                This is a list of devices that have logged into your account. Revoke any sessions
                that you do not recognize.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session, index) => (
                <div key={session.id}>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-full p-2">
                        <Smartphone className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <p className="flex items-center gap-2 font-medium">
                          {session.device}
                          {session.current && (
                            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-green-500 uppercase">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {session.location} • {session.date}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                  {index < sessions.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Danger Zone Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Shield className="text-destructive/70 h-3.5 w-3.5" />
            <h2 className="text-destructive/60 text-[10px] font-black tracking-[0.2em] uppercase">
              Danger Zone
            </h2>
          </div>
          <Card className="border-destructive/20 bg-destructive/5 border shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>
                Once you delete your account, there is no going back. Please be certain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                All of your quests, responses, and data will be permanently removed. This action
                cannot be undone.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="destructive"
                className="shadow-destructive/20 flex scale-100 items-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" /> Delete Account
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
}
