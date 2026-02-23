"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";
import { motion } from "motion/react";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <Logo iconSize={24} textSize="1.1rem" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 z-10 bg-zinc-950/20" />
        <Image
          src="/signin-bg.png"
          alt="Sign In Background"
          fill
          className="object-cover dark:brightness-[0.4]"
          priority
        />
        <div className="absolute inset-0 z-5 backdrop-blur-[1px]" />
        <div className="absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/80 via-black/40 to-transparent p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="bg-primary h-1 w-12 rounded-full" />
            <h2 className="text-3xl leading-tight font-bold text-white">
              Start your next <br /> creative quest.
            </h2>
            <p className="max-w-sm text-lg text-white/70">
              Join thousands of creators building high-fidelity forms and surveys with Quest.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
