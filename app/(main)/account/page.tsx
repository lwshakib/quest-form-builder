"use client";

import { useState, useEffect } from "react";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Laptop,
  Smartphone,
  Loader2,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Globe,
  Trash2,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SessionData {
  token: string;
  userAgent?: string | null;
  updatedAt: Date;
}

interface AccountData {
  id: string;
  providerId: string;
}

/**
 * AccountPage Component
 * Provides a modern, responsive interface for managing user profile,
 * connected authentication accounts, and active device sessions.
 */
export default function AccountPage() {
  const { data: session, isPending: isSessionPending, refetch } = authClient.useSession();
  const router = useRouter();

  // Profile Update State
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [userName, setUserName] = useState("");

  // Dynamic Data State
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Initialize name from session
  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name);
    }
  }, [session]);

  // Fetch real data from Better Auth
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Active Sessions
        const sessRes = await authClient.listSessions();
        if (sessRes.data) {
          setSessions(sessRes.data as unknown as SessionData[]);
        }

        // 2. Fetch Connected Accounts
        const accRes = await authClient.listAccounts();
        if (accRes.data) {
          setAccounts(accRes.data as unknown as AccountData[]);
        }
      } catch (err) {
        console.error("Failed to fetch account data:", err);
      } finally {
        setIsLoadingSessions(false);
        setIsLoadingAccounts(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  /**
   * Updates the user's display name
   */
  const handleUpdateName = async () => {
    if (!userName.trim()) return;
    setIsUpdatingName(true);
    try {
      await authClient.updateUser({
        name: userName,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdatingName(false);
    }
  };

  /**
   * Revokes an active session
   */
  const handleRevokeSession = async (token: string) => {
    try {
      await authClient.revokeSession({ token });
      setSessions((prev) => prev.filter((s) => s.token !== token));
      toast.success("Session terminated");
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  /**
   * Links a social provider to the current account
   */
  const handleLinkSocial = async (providerId: "google") => {
    try {
      await authClient.linkSocial({
        provider: providerId,
        callbackURL: window.location.href,
      });
    } catch {
      toast.error(`Failed to link ${providerId} account`);
    }
  };

  /**
   * Unlinks a social provider from the current account
   */
  const handleUnlinkAccount = async (providerId: string) => {
    try {
      const { error } = await authClient.unlinkAccount({
        providerId,
      });

      if (error) {
        toast.error(error.message || `Failed to unlink ${providerId}`);
        return;
      }

      toast.success(`${providerId} account unlinked`);
      // Update local state to reflect removal
      setAccounts((prev) => prev.filter((acc) => acc.providerId !== providerId));
    } catch {
      toast.error(`Error unlinking ${providerId}`);
    }
  };

  if (isSessionPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.replace("/sign-in");
    return null;
  }

  // Derived state for supported providers
  const isGoogleLinked = accounts.some((acc) => acc.providerId === "google");

  return (
    <div className="bg-background selection:bg-primary/10 flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-8 lg:p-12">
        <div className="mx-auto w-full max-w-6xl">
          {/* Page Heading */}
          <div className="mb-10">
            <h1 className="text-foreground mb-2 text-4xl font-extrabold tracking-tight">
              Settings
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your personal information, connected accounts, and security.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            {/* LEFT COLUMN: Profile Spotlight */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-1">
              <Card className="bg-card ring-border/50 overflow-hidden border shadow-lg ring-1">
                <CardContent className="flex flex-col items-center pt-10 pb-8 text-center">
                  <ProfileImageUpload
                    src={session.user.image}
                    name={session.user.name}
                    className="mb-6"
                    onSuccess={() => refetch()}
                  />
                  <div className="w-full space-y-2 overflow-hidden px-4">
                    <h2 className="truncate text-2xl font-bold" title={session.user.name || ""}>
                      {session.user.name}
                    </h2>
                    <p
                      className="text-muted-foreground truncate text-sm"
                      title={session.user.email || ""}
                    >
                      {session.user.email}
                    </p>
                    <div className="flex justify-center pt-4">
                      <span className="bg-muted text-muted-foreground ring-border inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset">
                        <ShieldCheck className="mr-1 size-3" />
                        Active Account
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-dashed">
                <CardContent className="text-muted-foreground p-4 text-xs leading-relaxed">
                  Your profile information is shared across Quest Form Builder services to help us
                  provide a consistent and personalized experience.
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Configuration and Security */}
            <div className="min-w-0 space-y-8 lg:col-span-2">
              {/* Basic Information Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Display Name</CardTitle>
                  <CardDescription>
                    This is how you will appear to others in collaborate mode.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your name"
                      className="max-w-md"
                    />
                  </div>
                  <div className="space-y-2 opacity-70">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="bg-muted flex max-w-md items-center gap-2 rounded-md border p-2 text-sm font-medium">
                      <Mail className="text-muted-foreground size-4" />
                      {session.user.email}
                    </div>
                    <p className="text-muted-foreground text-[11px] italic">
                      Contact support to change your primary account email.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t py-4">
                  <Button
                    onClick={handleUpdateName}
                    disabled={isUpdatingName || userName === session.user.name}
                  >
                    {isUpdatingName ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 size-4" />
                    )}
                    Update Name
                  </Button>
                </CardFooter>
              </Card>

              {/* Connected Accounts Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>
                    Third-party accounts used to sign in to Quest Form Builder.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingAccounts ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="text-muted-foreground size-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {/* Google Connection Row */}
                      <div className="hover:bg-muted/30 group flex items-center justify-between rounded-xl border p-4 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="bg-secondary ring-border rounded-lg p-2.5 ring-1 transition-transform group-hover:scale-105">
                            <Globe className="size-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Google</p>
                            <p className="text-muted-foreground text-xs">Social Authentication</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isGoogleLinked ? (
                            <>
                              <span className="text-muted-foreground bg-muted flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
                                <div className="bg-muted-foreground size-1.5 rounded-full" />
                                Connected
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 h-8 gap-1.5 text-xs"
                                onClick={() => handleUnlinkAccount("google")}
                              >
                                <Unlink className="size-3" />
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => handleLinkSocial("google")}
                            >
                              <LinkIcon className="size-3" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Email/Password Info (Implicitly connected if signed in) */}
                      <div className="bg-muted/20 flex items-center justify-between rounded-xl border p-4 opacity-80">
                        <div className="flex items-center gap-4">
                          <div className="bg-background ring-border rounded-lg p-2.5 ring-1">
                            <Mail className="size-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Email & Password</p>
                            <p className="text-muted-foreground text-xs">Standard Credentials</p>
                          </div>
                        </div>
                        <span className="text-muted-foreground bg-muted flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
                          <div className="bg-muted-foreground size-1.5 rounded-full" />
                          Primary
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security & Sessions Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Devices currently logged in to your account.</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {isLoadingSessions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="text-muted-foreground size-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((sess) => (
                        <div
                          key={sess.token}
                          className="bg-card flex min-w-0 items-center justify-between gap-4 rounded-xl border p-3 transition-all hover:shadow-sm"
                        >
                          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                            <div className="bg-muted shrink-0 rounded-lg p-2">
                              {sess.userAgent?.includes("Mobi") ? (
                                <Smartphone className="text-muted-foreground size-4" />
                              ) : (
                                <Laptop className="text-muted-foreground size-4" />
                              )}
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="flex items-center gap-2 truncate text-sm font-semibold">
                                {sess.userAgent || "Unknown Browser"}
                                {sess.token === session.session.token && (
                                  <span className="bg-muted text-muted-foreground shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-tighter uppercase">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-muted-foreground text-[10px]">
                                Last used: {new Date(sess.updatedAt).toLocaleDateString()} at{" "}
                                {new Date(sess.updatedAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>

                          {sess.token !== session.session.token && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 size-8 shrink-0"
                              onClick={() => handleRevokeSession(sess.token)}
                              title="Revoke session"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
