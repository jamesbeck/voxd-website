"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import saUploadOrganisationLogo from "@/actions/saUploadOrganisationLogo";
import { saUpdateOrganisation } from "@/actions/saUpdateOrganisation";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";

const isValidHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/webp",
];

const LogoTab = ({
  organisationId,
  logoFileExtension,
  showLogoOnColour,
  primaryColour,
}: {
  organisationId: string;
  logoFileExtension: string | null;
  showLogoOnColour: string | null;
  primaryColour: string | null;
}) => {
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    base64: string;
    extension: string;
  } | null>(null);
  const [bgColour, setBgColour] = useState(showLogoOnColour || "");
  const [primColour, setPrimColour] = useState(primaryColour || "");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const processFile = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "Invalid file type. Please upload a PNG, JPG, GIF, SVG, or WebP image.",
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setSelectedFile({ base64, extension });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Check if colour fields have changed from their server values
  const bgColourChanged = (bgColour || "") !== (showLogoOnColour || "");
  const primColourChanged = (primColour || "") !== (primaryColour || "");
  const hasChanges = selectedFile || bgColourChanged || primColourChanged;

  const handleSave = async () => {
    // Validate colours before saving
    if (bgColour && !isValidHex(bgColour)) {
      toast.error("Invalid background hex colour. Use format #RRGGBB.");
      return;
    }
    if (primColour && !isValidHex(primColour)) {
      toast.error("Invalid primary hex colour. Use format #RRGGBB.");
      return;
    }

    setSaving(true);
    try {
      // Upload logo if a new file was selected
      if (selectedFile) {
        const uploadResult = await saUploadOrganisationLogo({
          organisationId,
          fileBase64: selectedFile.base64,
          fileExtension: selectedFile.extension,
        });
        if (!uploadResult.success) {
          toast.error(uploadResult.error || "Failed to upload logo");
          return;
        }

        // If a primary colour was auto-detected and the org didn't have one
        if (uploadResult.data?.primaryColour && !primColour) {
          setPrimColour(uploadResult.data.primaryColour);
          toast.success(
            `Primary colour auto-detected: ${uploadResult.data.primaryColour}`,
          );
        }

        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

      // Save colour fields if changed
      if (bgColourChanged || primColourChanged) {
        const updateData: {
          organisationId: string;
          showLogoOnColour?: string | null;
          primaryColour?: string | null;
        } = { organisationId };

        if (bgColourChanged) {
          updateData.showLogoOnColour = bgColour || null;
        }
        if (primColourChanged) {
          updateData.primaryColour = primColour || null;
        }

        const result = await saUpdateOrganisation(updateData);
        if (!result.success) {
          toast.error(result.error || "Failed to save branding");
          return;
        }
      }

      toast.success("Branding saved");
      router.refresh();
    } catch {
      toast.error("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const logoPreviewBg = bgColour && isValidHex(bgColour) ? bgColour : undefined;

  const currentLogoUrl = logoFileExtension
    ? `https://s3.${
        process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"
      }.wasabisys.com/${
        process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"
      }/organisationLogos/${organisationId}.${logoFileExtension}?t=${Date.now()}`
    : null;

  const showImage = previewUrl || currentLogoUrl;

  return (
    <div className="space-y-6">
      {/* Logo preview / drop zone */}
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : selectedFile
              ? "border-primary/50"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } cursor-pointer`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {showImage ? (
          <div className="relative flex items-center justify-center p-6">
            <div
              className="relative inline-block rounded-lg p-4"
              style={
                logoPreviewBg ? { backgroundColor: logoPreviewBg } : undefined
              }
            >
              <Image
                src={previewUrl || currentLogoUrl!}
                alt={previewUrl ? "New logo preview" : "Organisation logo"}
                width={200}
                height={200}
                className="object-contain"
                unoptimized
              />
            </div>
            {selectedFile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSelection();
                }}
                className="absolute right-2 top-2 h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
              <div className="flex flex-col items-center gap-1 text-white">
                <Upload className="h-6 w-6" />
                <span className="text-sm font-medium">
                  {selectedFile ? "Change selection" : "Replace logo"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <p className="text-sm font-medium">
              Drop a logo here or click to upload
            </p>
            <p className="text-xs">PNG, JPG, GIF, SVG, or WebP. Max 5MB.</p>
          </div>
        )}
      </div>

      {/* Logo Background Colour */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Logo Background Colour</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={bgColour || "#ffffff"}
            onChange={(e) => setBgColour(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border border-input p-0.5"
          />
          <Input
            value={bgColour}
            onChange={(e) => {
              let val = e.target.value;
              if (val && !val.startsWith("#")) val = "#" + val;
              setBgColour(val.slice(0, 7));
            }}
            placeholder="#000000"
            className="w-28 font-mono"
            maxLength={7}
          />
          {bgColour && (
            <Button variant="ghost" size="sm" onClick={() => setBgColour("")}>
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Background colour behind the logo. Leave empty for transparent.
        </p>
      </div>

      {/* Primary Colour */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Primary Colour</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primColour || "#ffffff"}
            onChange={(e) => setPrimColour(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border border-input p-0.5"
          />
          <Input
            value={primColour}
            onChange={(e) => {
              let val = e.target.value;
              if (val && !val.startsWith("#")) val = "#" + val;
              setPrimColour(val.slice(0, 7));
            }}
            placeholder="#000000"
            className="w-28 font-mono"
            maxLength={7}
          />
          {primColour && (
            <Button variant="ghost" size="sm" onClick={() => setPrimColour("")}>
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          The organisation&apos;s primary brand colour.
        </p>
      </div>

      {/* Single save button */}
      {hasChanges && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      )}
    </div>
  );
};

export default LogoTab;
