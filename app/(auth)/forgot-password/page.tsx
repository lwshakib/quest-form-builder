"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { Logo } from "@/components/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        toast.error(error.message || "Failed to send reset email");
      } else {
        setIsSubmitted(true);
        toast.success("Password reset link sent to your email");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <Logo iconSize={24} textSize="1.1rem" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Forgot password?</h1>
              <p className="text-muted-foreground text-balance">
                {isSubmitted
                  ? "Check your inbox! We've sent a recovery link to your email address."
                  : "No worries, it happens. Enter your email and we'll send you a reset link."}
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-muted/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
                <Button 
                  className="w-full h-12 shadow-lg transition-all active:scale-[0.98]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-sm text-foreground">
                    Verification email sent to <span className="font-semibold">{email}</span>. Please check your spam folder if you don't see it.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 border-muted-foreground/20 hover:bg-muted"
                  onClick={() => setIsSubmitted(false)}
                >
                  Try another email?
                </Button>
              </div>
            )}

            <div className="text-center pt-4 lg:text-left">
              <Link
                href="/sign-in"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950/20 z-10" />
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
          alt="Abstract Background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4]"
        />
        <div className="absolute inset-0 backdrop-blur-[2px] z-5" />
        <div className="absolute inset-x-0 bottom-0 p-12 z-20 bg-linear-to-t from-black/80 via-black/40 to-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="h-1 w-12 bg-primary rounded-full" />
            <h2 className="text-3xl font-bold text-white leading-tight">
              Securing your creative <br /> journeys.
            </h2>
            <p className="text-white/70 text-lg max-w-sm">
              Quest provides high-fidelity authentication to keep your quest form data safe and accessible.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
