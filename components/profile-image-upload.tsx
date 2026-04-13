"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ProfileImageUploadProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  onSuccess?: () => void;
}

export function ProfileImageUpload({ src, name, className, onSuccess }: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const { error } = await authClient.updateUser({
          image: base64String,
        });

        if (error) {
          toast.error(error.message || "Failed to update image");
        } else {
          toast.success("Profile image updated");
          onSuccess?.();
        }
      } catch (err) {
        toast.error("An error occurred while uploading");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`group relative cursor-pointer ${className}`} onClick={() => fileInputRef.current?.click()}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <Avatar className="h-28 w-28 border-4 border-background shadow-2xl transition-transform duration-300 group-hover:scale-105">
        <AvatarImage src={src || undefined} className="object-cover" />
        <AvatarFallback className="bg-muted text-muted-foreground text-3xl font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Hover Overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        ) : (
          <Camera className="h-8 w-8 text-white" />
        )}
      </div>

      {!isUploading && (
        <div className="bg-primary text-primary-foreground absolute right-0 bottom-0 rounded-full p-2 shadow-lg transition-transform duration-300 group-hover:scale-110">
          <Camera className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
