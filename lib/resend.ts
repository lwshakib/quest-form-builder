import { Resend } from "resend";

/**
 * Initialize the Resend client using the API key from environment variables.
 * This client is used for sending transactional emails (auth, notifications, etc.).
 */
export const resend = new Resend(process.env.RESEND_API_KEY);
