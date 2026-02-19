import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { Resend } from "resend";
import { AuthEmailTemplate } from "@/components/emails/auth-email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // Use Prisma as the database adapter to persist user accounts, sessions, and social connections.
  database: prismaAdapter(prisma, {
    provider: "postgresql", // Matches the Prisma provider type in schema.prisma.
  }),
  // Enable standard email and password authentication.
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Send password reset email via Resend
    sendResetPassword: async ({ user, url, token }) => {
      try {
        const { error } = await resend.emails.send({
          from: "Quest <noreply@lwshakib.site>", // Replace with your verified domain in production
          to: user.email,
          subject: "Reset your password",
          react: AuthEmailTemplate({ type: "forgot-password", url }),
        });

        if (error) {
          console.error("Failed to send email via Resend:", error);
          throw new Error("Failed to send authentication email.");
        }
      } catch (err) {
        console.error("Resend error:", err);
        throw err;
      }
    }
  },
  // Configure OAuth providers (e.g., Google).
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }
  },
  // Enable email verification
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        await resend.emails.send({
          from: "Quest <noreply@lwshakib.site>",
          to: user.email,
          subject: "Verify your email address",
          react: AuthEmailTemplate({ type: "email-verification", url }),
        });
      } catch (err) {
        console.error("Verification email error:", err);
      }
    },
  },
  // Allow multiple social accounts to be linked to the same user profile.
  account: {
    accountLinking: {
      enabled: true,
    },
  },
});

