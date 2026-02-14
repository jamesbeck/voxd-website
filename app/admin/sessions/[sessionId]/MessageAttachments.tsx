import Image from "next/image";
import { FileText, Music, Video } from "lucide-react";
import { formatBytes } from "@/lib/utils";

type FileAttachment = {
  id: string;
  type: string;
  mimeType: string;
  originalFilename: string | null;
  wasabiUrl: string;
  fileSize: number | null;
  width: number | null;
  height: number | null;
};

export default function MessageAttachments({
  files,
  variant = "primary",
}: {
  files: FileAttachment[];
  variant?: "primary" | "muted";
}) {
  if (!files || files.length === 0) return null;

  const imageFiles = files.filter((f) => f.type === "image");
  const otherFiles = files.filter((f) => f.type !== "image");

  const getFileIcon = (type: string) => {
    switch (type) {
      case "audio":
        return <Music className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-2 mb-2">
      {/* Image thumbnails */}
      {imageFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imageFiles.map((file) => (
            <a
              key={file.id}
              href={file.wasabiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative overflow-hidden rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Image
                src={file.wasabiUrl}
                alt={file.originalFilename || "Attached image"}
                width={96}
                height={96}
                className="object-cover rounded-lg"
                style={{
                  width: 96,
                  height: 96,
                }}
                unoptimized
              />
            </a>
          ))}
        </div>
      )}

      {/* Other file types */}
      {otherFiles.length > 0 && (
        <div className="flex flex-col gap-1">
          {otherFiles.map((file) => (
            <a
              key={file.id}
              href={file.wasabiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                variant === "primary"
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
              }`}
            >
              <span
                className={
                  variant === "primary"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }
              >
                {getFileIcon(file.type)}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium truncate max-w-[200px]">
                  {file.originalFilename || "Attached file"}
                </span>
                {file.fileSize && (
                  <span
                    className={`text-[10px] ${
                      variant === "primary"
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground/70"
                    }`}
                  >
                    {formatBytes(file.fileSize)}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
