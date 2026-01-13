"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import saUploadOrganisationLogo from "@/actions/saUploadOrganisationLogo";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const LogoTab = ({
  organisationId,
  logoFileExtension,
  logoDarkBackground,
}: {
  organisationId: string;
  logoFileExtension: string | null;
  logoDarkBackground: boolean;
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    base64: string;
    extension: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Please upload a PNG, JPG, GIF, SVG, or WebP image."
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    // Get file extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setSelectedFile({ base64, extension });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const result = await saUploadOrganisationLogo({
        organisationId,
        fileBase64: selectedFile.base64,
        fileExtension: selectedFile.extension,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to upload logo");
        return;
      }

      toast.success("Logo uploaded successfully");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const currentLogoUrl = logoFileExtension
    ? `https://s3.${
        process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"
      }.wasabisys.com/${
        process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"
      }/organisationLogos/${organisationId}.${logoFileExtension}?t=${Date.now()}`
    : null;

  return (
    <div className="space-y-6">
      {/* Current Logo */}
      {currentLogoUrl && !previewUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Current Logo</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (shown on {logoDarkBackground ? "dark" : "light"} background)
            </span>
          </div>
          <div
            className={`relative inline-block rounded-lg p-4 ${
              logoDarkBackground
                ? "bg-gray-800 dark:bg-gray-900"
                : "bg-gray-100 dark:bg-gray-200"
            }`}
          >
            <Image
              src={currentLogoUrl}
              alt="Organisation logo"
              width={200}
              height={200}
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Preview of new selection */}
      {previewUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">New Logo Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative inline-block bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <Image
              src={previewUrl}
              alt="New logo preview"
              width={200}
              height={200}
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {logoFileExtension ? "Replace Logo" : "Upload Logo"}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-gray-100 file:text-gray-700
              dark:file:bg-gray-800 dark:file:text-gray-300
              hover:file:bg-gray-200 dark:hover:file:bg-gray-700
              cursor-pointer"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG, GIF, SVG, or WebP. Max 5MB.
          </p>
        </div>

        {selectedFile && (
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Logo"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LogoTab;
