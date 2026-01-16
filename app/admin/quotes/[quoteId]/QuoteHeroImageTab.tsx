"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Upload, Trash2, Sparkles } from "lucide-react";
import saUploadQuoteHeroImage from "@/actions/saUploadQuoteHeroImage";
import saGenerateQuoteHeroImage from "@/actions/saGenerateQuoteHeroImage";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function QuoteHeroImageTab({
  quoteId,
  heroImageFileExtension,
  organisationName,
  background,
}: {
  quoteId: string;
  heroImageFileExtension: string | null;
  organisationName: string;
  background: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [cacheBuster, setCacheBuster] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const existingHeroImageUrl = heroImageFileExtension
    ? `https://${
        process.env.NEXT_PUBLIC_WASABI_ENDPOINT
      }/voxd/quoteImages/${quoteId}.${heroImageFileExtension}${
        cacheBuster ? `?t=${cacheBuster}` : ""
      }`
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

        const result = await saUploadQuoteHeroImage({
          quoteId,
          fileBase64: base64,
          fileExtension: extension,
        });

        if (result.success) {
          toast.success("Hero image uploaded successfully");
          setPreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setCacheBuster(Date.now());
          router.refresh();
        } else {
          toast.error(result.error || "Failed to upload hero image");
        }

        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload hero image");
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateHeroImage = async () => {
    setGenerating(true);
    setDialogOpen(false);

    try {
      const result = await saGenerateQuoteHeroImage({
        quoteId,
        userPrompt: userPrompt.trim() || undefined,
      });

      if (result.success) {
        toast.success("Hero image generated successfully!");
        setUserPrompt("");
        setCacheBuster(Date.now());
        router.refresh();
      } else {
        toast.error(result.error || "Failed to generate hero image");
      }
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Failed to generate hero image");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Quote Hero Image</h2>
        <p className="text-sm text-muted-foreground">
          Upload a hero image for this quote or generate one using AI. The hero
          image will be displayed as the banner on the proposal and pitch pages.
        </p>
      </div>

      {/* Generate Hero Image Button */}
      <div className="flex gap-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={generating}>
              {generating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Hero Image with AI
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Hero Image with AI</DialogTitle>
              <DialogDescription>
                We'll use AI to create a professional hero banner image based on
                the quote background and organisation details. You can
                optionally provide additional guidance below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userPrompt">
                  Additional Guidance (Optional)
                </Label>
                <Textarea
                  id="userPrompt"
                  placeholder="e.g., Modern office setting, technology theme, blue tones..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in addition to the quote's organisation name
                  and background.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateHeroImage}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Hero Image
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Hero Image */}
      {existingHeroImageUrl && !preview && (
        <div className="space-y-2">
          <Label>Current Hero Image</Label>
          <div className="border rounded-lg p-4 bg-muted/30">
            <Image
              src={existingHeroImageUrl}
              alt="Current hero image"
              width={800}
              height={300}
              className="object-cover w-full rounded"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-2">
          <Label>New Hero Image Preview</Label>
          <div className="border rounded-lg p-4 bg-muted/30 relative">
            <Image
              src={preview}
              alt="Hero image preview"
              width={800}
              height={300}
              className="object-cover w-full rounded"
              unoptimized
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-6 right-6"
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
          <Label htmlFor="heroImage">
            {existingHeroImageUrl ? "Replace Hero Image" : "Upload Hero Image"}
          </Label>
          <Input
            id="heroImage"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground">
            Accepted formats: PNG, JPG, GIF, SVG, WebP. Max size: 5MB.
            Recommended: landscape format (16:9 aspect ratio).
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
                Upload Hero Image
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
