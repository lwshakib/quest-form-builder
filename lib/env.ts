/**
 * This module provides a centralized place to access environment variables.
 * Doing this ensures that variable names are consistent throughout the app
 * and provides a single point of entry for debugging environment-related issues.
 */

// API key(s) for Google Generative AI (Gemini). Can be a comma-separated string for rotation.
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// API key for Nebius AI services.
export const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY;

// Configuration for Cloudinary image hosting and transformations.
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Pinecone index name for vector search capabilities (if used).
export const PINECONE_INDEX = process.env.PINECONE_INDEX;

// Deepgram API key for speech-to-text or audio processing (if used).
export const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
