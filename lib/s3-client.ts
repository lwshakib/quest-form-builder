/**
 * Client-side utility for uploading files directly to S3 via a presigned URL.
 */
export async function uploadFileToS3(file: File): Promise<{ secureUrl: string; key: string }> {
  // 1. Request presigned URL from our API
  const presignRes = await fetch("/api/s3/presigned-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentType: file.type,
      folder: "uploads",
    }),
  });

  if (!presignRes.ok) {
    const errorData = await presignRes.json();
    throw new Error(errorData.error || "Failed to get presigned URL");
  }

  const { url: presignedUrl, key } = await presignRes.json();

  // 2. Upload directly to S3 using the presigned URL
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload to S3: ${uploadRes.statusText}`);
  }

  // Return the key directly; the frontend will need to use signed-url to view it,
  // or we can just return the key as `secureUrl` since the components expect it.
  // Wait, components expect a URL they can use in an `<img src="...">`.
  // S3 bucket is private right now based on our S3Service?
  // Let's check `bun-setup.ts`: it sets CORS, but doesn't set it to public.
  // Actually, if we just store the key in the database, the components need to fetch the signed URL to display it.
  // The user prompt mentioned: "As requested, we will now store only the S3 path (e.g., quest-backgrounds/unique-id.png) in the database instead of a full URL. This requires the frontend to call the /api/s3/signed-url endpoint or a similar service to generate a viewable URL before rendering."

  return { secureUrl: key, key };
}

/**
 * Client-side utility to get a signed URL for a given S3 key.
 */
export async function getSignedUrlForS3Key(key: string): Promise<string> {
  if (!key) return "";

  // If it's a full URL (e.g., from old Cloudinary data, or youtube), don't sign it
  if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("blob:")) {
    return key;
  }

  const res = await fetch(`/api/s3/signed-url?key=${encodeURIComponent(key)}`);
  if (!res.ok) {
    throw new Error(`Failed to get signed URL for key: ${key}`);
  }
  const data = await res.json();
  return data.url;
}
