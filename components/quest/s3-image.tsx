"use client";

import { useEffect, useState } from "react";
import Image, { ImageProps } from "next/image";
import { getSignedUrlForS3Key } from "@/lib/s3-client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface S3ImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackClassName?: string;
}

/**
 * A wrapper around Next.js Image component that handles S3 paths.
 * If the src is an S3 key (not a full URL), it fetches a signed URL before rendering.
 */
export function S3Image({ src, className, fallbackClassName, alt, ...props }: S3ImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function resolveUrl() {
      if (!src) {
        setResolvedSrc(null);
        setIsLoading(false);
        return;
      }

      // If it's already a full URL, use it directly
      if (
        typeof src === "string" &&
        (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:"))
      ) {
        setResolvedSrc(src);
        setIsLoading(false);
        return;
      }

      // If it's not a string, we can't process it as an S3 key
      if (typeof src !== "string") {
        console.error("S3Image: src must be a string, received:", typeof src, src);
        setError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const url = await getSignedUrlForS3Key(src);
        setResolvedSrc(url);
        setError(false);
      } catch (err) {
        console.error("Failed to resolve S3 URL:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    resolveUrl();
  }, [src]);

  if (!src) return null;

  if (isLoading) {
    return (
      <div className={cn("bg-accent/5 flex items-center justify-center", fallbackClassName)}>
        <Loader2 className="text-muted-foreground/20 h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !resolvedSrc) {
    return (
      <div
        className={cn(
          "bg-destructive/5 text-destructive flex items-center justify-center text-xs",
          fallbackClassName,
        )}
      >
        Failed to load image
      </div>
    );
  }

  return <Image alt={alt || ""} {...props} src={resolvedSrc} className={className} />;
}
