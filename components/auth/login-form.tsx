"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Failed to sign in");
        setIsLoading(false);
        return;
      }

      router.push("/quests");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/quests",
      });
    } catch {
      setError(`Failed to sign in with ${provider}`);
      setSocialLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
        <FieldGroup>
          <div className="mb-2 flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your credentials to access your Quest dashboard
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 animate-in fade-in zoom-in rounded-lg border p-3 text-center text-sm duration-300">
              {error}
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <div className="group relative">
              <Mail className="text-muted-foreground group-focus-within:text-primary absolute top-3.5 left-3 h-4 w-4 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-muted/50 border-muted-foreground/20 focus:border-primary/50 h-12 pl-10"
              />
            </div>
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-primary hover:text-primary/80 text-xs font-medium underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="group relative">
              <Lock className="text-muted-foreground group-focus-within:text-primary absolute top-3.5 left-3 h-4 w-4 transition-colors" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-muted/50 border-muted-foreground/20 focus:border-primary/50 h-12 pl-10"
              />
            </div>
          </Field>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full shadow-lg transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <FieldSeparator className="text-muted-foreground/50">Or continue with</FieldSeparator>

          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              type="button"
              className="border-muted-foreground/20 hover:bg-muted h-11 font-medium transition-colors"
              disabled={socialLoading !== null}
              onClick={() => handleSocialLogin("google")}
            >
              {socialLoading === "google" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Image
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  width={16}
                  height={16}
                  className="mr-2"
                />
              )}
              Sign in with Google
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </div>
        </FieldGroup>
      </form>
    </motion.div>
  );
}
