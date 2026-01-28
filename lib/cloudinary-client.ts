export const uploadFileToCloudinary = async (file: File, signal?: AbortSignal) => {
    const sigRes = await fetch("/api/cloudinary-signature");
    if (!sigRes.ok) {
      throw new Error("Failed to get upload signature");
    }
    const signatureData = await sigRes.json();
    const uploadApi = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", signatureData.timestamp.toString());
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder ?? "infera-notebook");

    const uploadRes = await fetch(uploadApi, {
      method: "POST",
      body: formData,
      signal,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.error?.message || "Cloudinary upload failed");
    }

    const data = await uploadRes.json();
    return {
      secureUrl: data.secure_url as string,
      publicId: data.public_id as string,
      resourceType: data.resource_type as string,
    };
  };
