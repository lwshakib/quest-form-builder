"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { Logo } from "@/components/logo";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing verification token.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const { error } = await authClient.verifyEmail({
          query: { token },
        });

        if (error) {
          setStatus("error");
          setErrorMessage(error.message || "Failed to verify email.");
        } else {
          setStatus("success");
          toast.success("Email verified successfully!");
          // Automatically redirect to sign-in after 3 seconds
          setTimeout(() => {
            router.push("/sign-in");
          }, 3000);
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("An unexpected error occurred.");
      }
    };

    verifyEmail();
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-lg">Verifying your email address...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="mx-auto lg:mx-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <CheckCircle2 className="h-10 w-10" />
        </motion.div>
        <div className="space-y-2 text-center lg:text-left">
          <h1 className="text-3xl font-bold tracking-tight">Email verified!</h1>
          <p className="text-muted-foreground text-lg">
            Your account is now fully activated. You can now access all features of Quest.
          </p>
        </div>
        <div className="pt-4">
          <Button asChild className="w-full h-12 shadow-lg">
            <Link href="/sign-in">
              Continue to Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto lg:mx-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <XCircle className="h-10 w-10" />
      </div>
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Verification failed</h1>
        <p className="text-destructive text-lg">
          {errorMessage}
        </p>
      </div>
      <div className="pt-4 space-y-3">
        <Button asChild variant="outline" className="w-full h-12 border-muted-foreground/20">
          <Link href="/sign-up">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign Up
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
            className="w-full max-w-md"
          >
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Initializing verification...</p>
              </div>
            }>
              <VerifyEmailContent />
            </Suspense>
          </motion.div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950/20 z-10" />
        <img
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2564&auto=format&fit=crop"
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
              One last step <br /> to your quest.
            </h2>
            <p className="text-white/70 text-lg max-w-sm">
              Confirming your email ensures your data remains uniquely yours and accessible whenever you need it.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
