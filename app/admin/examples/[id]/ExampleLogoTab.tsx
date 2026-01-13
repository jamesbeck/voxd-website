"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Upload, Trash2 } from "lucide-react";
import saUploadExampleLogo from "@/actions/saUploadExampleLogo";
import Image from "next/image";

export default function ExampleLogoTab({
  exampleId,
  logoFileExtension,
}: {
  exampleId: string;
  logoFileExtension: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const existingLogoUrl = logoFileExtension
    ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleLogos/${exampleId}.${logoFileExtension}`
    : null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const extension = file.name.split(".").pop() || "png";

        const result = await saUploadExampleLogo({
          exampleId,
          fileBase64: base64,
          fileExtension: extension,
        });

        if (result.success) {
          toast.success("Logo uploaded successfully");
          setPreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          router.refresh();
        } else {
          toast.error(result.error || "Failed to upload logo");
        }

        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Example Logo</h2>
        <p className="text-sm text-muted-foreground">
          Upload a logo image for this example. The logo will be displayed on
          the example card and detail page.
        </p>
      </div>

      {/* Current Logo */}
      {existingLogoUrl && !preview && (
        <div className="space-y-2">
          <Label>Current Logo</Label>
          <div className="border rounded-lg p-4 bg-muted/30 inline-block">
            <Image
              src={existingLogoUrl}
              alt="Current logo"
              width={200}
              height={200}
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-2">
          <Label>New Logo Preview</Label>
          <div className="border rounded-lg p-4 bg-muted/30 inline-block relative">
            <Image
              src={preview}
              alt="Logo preview"
              width={200}
              height={200}
              className="object-contain"
              unoptimized
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={clearSelection}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="logo">
            {existingLogoUrl ? "Replace Logo" : "Upload Logo"}
          </Label>
          <Input
            id="logo"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground">
            Accepted formats: PNG, JPG, GIF, SVG, WebP. Max size: 5MB.
          </p>
        </div>

        {preview && (
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
