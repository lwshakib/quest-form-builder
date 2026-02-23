/**
 * This module initializes and exports the authentication client for the frontend.
 * It uses 'better-auth/react' to provide hooks and methods for managing
 * user authentication states, signing in/out, and social provider interactions.
 */

import { createAuthClient } from "better-auth/react";

/**
 * The authClient instance used in Client Components.
 * it is configured with a base URL that points to the authentication server's API.
 */
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
});
