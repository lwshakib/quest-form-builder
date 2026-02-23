/**
 * This module configures and exports the server-side authentication instance.
 * It uses 'better-auth' with Prisma as the data persistence layer.
 * Configuration includes email/password, social providers (Google), and email workflows (verification, reset).
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { Resend } from "resend";
import { AuthEmailTemplate } from "@/components/emails/auth-email-template";

// Initialize the Resend client for sending transactional emails
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * The 'auth' instance manages session validation, user registration,
 * and authentication flows on the server.
 */
export const auth = betterAuth({
  // Use Prisma as the database adapter to persist user accounts, sessions, and social connections.
  database: prismaAdapter(prisma, {
    provider: "postgresql", // Matches the Prisma provider type in schema.prisma.
  }),

  // Enable standard email and password authentication.
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    /**
     * Sends a password reset email using the Resend service.
     * @param {Object} context - Contains user information and the reset URL.
     */
    sendResetPassword: async ({ user, url }) => {
      try {
        const { error } = await resend.emails.send({
          from: "Quest <noreply@lwshakib.site>", // Verified domain from Resend account
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
    },
  },

  // Configure OAuth providers.
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // Enable email verification workflow.
  emailVerification: {
    sendOnSignUp: true,

    /**
     * Sends a verification email to the user.
     * @param {Object} context - Contains user information and the verification URL.
     */
    sendVerificationEmail: async ({ user, url }) => {
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

  // Account management configurations.
  account: {
    // Allows users to link multiple social identities to a single account (e.g., signing in with Google after signing up with email).
    accountLinking: {
      enabled: true,
    },
  },
});
