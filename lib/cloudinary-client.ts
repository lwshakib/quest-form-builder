/**
 * This utility function handles the process of uploading a file to Cloudinary from the client side.
 * It follows a secure flow by first obtaining a signed upload request from our backend.
 * 
 * @param {File} file - The file to be uploaded.
 * @param {AbortSignal} [signal] - An optional abort signal to cancel the upload request.
 * @returns {Promise<{ secureUrl: string, publicId: string, resourceType: string }>} Result of the upload.
 */
export const uploadFileToCloudinary = async (file: File, signal?: AbortSignal) => {
  // Step 1: Fetch the signed signature data from our internal API endpoint.
  // This prevents exposing the Cloudinary API secret on the frontend.
  const sigRes = await fetch("/api/cloudinary-signature");
  if (!sigRes.ok) {
    throw new Error("Failed to get upload signature");
  }
  const signatureData = await sigRes.json();
  
  // Construct the Cloudinary upload URL using the cloud name provided in the signature data.
  const uploadApi = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/upload`;

  // Step 2: Prepare the form data for the multipart upload.
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", signatureData.timestamp.toString());
  formData.append("signature", signatureData.signature);
  formData.append("folder", signatureData.folder ?? "quest-form-builder");

  // Step 3: Perform the upload directly to Cloudinary's API.
  const uploadRes = await fetch(uploadApi, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(err.error?.message || "Cloudinary upload failed");
  }

  // Step 4: Extract and return the relevant data from the Cloudinary response.
  const data = await uploadRes.json();
  return {
    secureUrl: data.secure_url as string,
    publicId: data.public_id as string,
    resourceType: data.resource_type as string,
  };
};
