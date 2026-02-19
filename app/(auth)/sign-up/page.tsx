"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignUpForm } from "@/components/signup-form";
import { motion } from "motion/react";

export default function SignUpPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950/20 z-10" />
        <img
          src="/signup-bg.png"
          alt="Sign Up Background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4]"
        />
        <div className="absolute inset-0 backdrop-blur-[1px] z-5" />
        <div className="absolute inset-x-0 bottom-0 p-12 z-20 bg-linear-to-t from-black/80 via-black/40 to-transparent text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="h-1 w-12 bg-primary rounded-full" />
            <h2 className="text-3xl font-bold text-white leading-tight">
              Create your account <br /> and start building.
            </h2>
            <p className="text-white/70 text-lg max-w-sm">
              Expereince the most powerful and flexible form builder designed for modern product teams.
            </p>
          </motion.div>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <Logo iconSize={24} textSize="1.1rem" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
