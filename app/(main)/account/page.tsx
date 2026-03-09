"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Smartphone, Loader2 } from "lucide-react";
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
  const [prevSessionName, setPrevSessionName] = useState<string | null | undefined>(undefined);
  if (session?.user?.name && session.user.name !== prevSessionName && !name) {
    setPrevSessionName(session.user.name);
    setName(session.user.name);
  }

  interface SessionItem {
    id: string;
    device: string;
    location: string;
    current: boolean;
    date: string;
  }

  const [sessions] = useState<SessionItem[]>([
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
          <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="border-border/20 bg-muted/5 border-b p-6">
              <h3 className="text-lg font-bold">Profile Information</h3>
              <p className="text-muted-foreground mt-1 text-sm font-medium">Update your profile information and how others see you.</p>
            </div>
            <div className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-accent/5 border-border/50 h-11 rounded-xl"
                  />
                  <p className="text-muted-foreground text-[10px] italic">This name will be displayed on your profile and quests.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={session.user.email}
                    readOnly
                    className="bg-muted/50 h-11 rounded-xl cursor-not-allowed"
                  />
                  <p className="text-muted-foreground text-[10px] italic">Your email address is managed through your auth provider.</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
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
                  className="rounded-xl font-bold"
                >
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Lock className="text-primary/70 h-3.5 w-3.5" />
            <h2 className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
              Security & Privacy
            </h2>
          </div>
          <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="border-border/20 bg-muted/5 border-b p-6">
              <h3 className="text-lg font-bold">Change Password</h3>
              <p className="text-muted-foreground mt-1 text-sm font-medium">Ensure your account is using a long, random password to stay secure.</p>
            </div>
            <div className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input 
                    id="current" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-accent/5 border-border/50 h-11 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <Input 
                      id="new" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-accent/5 border-border/50 h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input 
                      id="confirm" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-accent/5 border-border/50 h-11 rounded-xl"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
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
                  className="rounded-xl font-bold"
                >
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Sessions Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Smartphone className="text-primary/70 h-3.5 w-3.5" />
            <h2 className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
              Active Sessions
            </h2>
          </div>
          <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="border-border/20 bg-muted/5 border-b p-6">
              <h3 className="text-lg font-bold">Active Sessions</h3>
              <p className="text-muted-foreground mt-1 text-sm font-medium">This is a list of devices that have logged into your account. Revoke any sessions that you do not recognize.</p>
            </div>
            <div className="space-y-0 px-6">
              {sessions.map((sessionItem, index) => (
                <div key={sessionItem.id}>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-full p-2">
                        <Smartphone className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <p className="flex items-center gap-2 font-medium">
                          {sessionItem.device}
                          {sessionItem.current && (
                            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-green-500 uppercase">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {sessionItem.location} • {sessionItem.date}
                        </p>
                      </div>
                    </div>
                    {!sessionItem.current && (
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
            </div>
            <div className="border-border/10 flex justify-end border-t p-6">
              <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 rounded-xl font-bold">
                Revoke All Other Sessions
              </Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
