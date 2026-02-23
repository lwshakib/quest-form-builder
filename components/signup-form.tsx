"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Loader2, Mail, ArrowLeft, ExternalLink } from "lucide-react";
import { motion } from "motion/react";

export function SignUpForm({ className, ...props }: React.ComponentProps<"form">) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/quests",
      });

      if (error) {
        setError(error.message || "Failed to create account");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/quests",
      });
    } catch {
      setError(`Failed to sign up with ${provider}`);
      setSocialLoading(null);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("flex flex-col gap-6 text-center", className)}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="bg-muted text-foreground flex h-16 w-16 items-center justify-center rounded-full">
            <Mail className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground text-sm text-balance">
              We&apos;ve sent a verification link to{" "}
              <span className="text-foreground font-semibold">{email}</span>. Please click the link
              to activate your account.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="h-11 w-full shadow-lg">
            <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
              Go to Gmail
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" asChild className="h-11 w-full">
            <Link href="/sign-in">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>

        <p className="text-muted-foreground text-xs">
          Didn&apos;t receive the email? Check your spam folder or try signing up again.
        </p>
      </motion.div>
    );
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your details below to create your account
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive border-destructive/20 animate-in fade-in zoom-in rounded-md border p-3 text-center text-sm duration-300">
            {error}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="bg-muted/50 border-muted-foreground/20 focus:border-primary/50 h-11"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="bg-muted/50 border-muted-foreground/20 focus:border-primary/50 h-11"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="bg-muted/50 border-muted-foreground/20 focus:border-primary/50 h-11"
          />
        </Field>
        <Field>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full shadow-lg transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field className="gap-2">
          <Button
            variant="outline"
            type="button"
            className="border-muted-foreground/20 hover:bg-muted h-11"
            disabled={socialLoading !== null}
            onClick={() => handleSocialSignUp("google")}
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
            Sign up with Google
          </Button>
          <FieldDescription className="pt-2 text-center">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary hover:text-primary/80 font-medium underline underline-offset-4"
            >
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
