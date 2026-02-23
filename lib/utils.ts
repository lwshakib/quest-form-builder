/**
 * Utility functions for common tasks throughout the application.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and merges Tailwind classes intelligently.
 * It uses 'clsx' to handle conditional classes and 'twMerge' to resolve
 * Tailwinds conflicts (e.g., 'px-2 px-4' -> 'px-4').
 * 
 * @param {ClassValue[]} inputs - An array of class names, objects, or expressions.
 * @returns {string} The merged and optimized class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
