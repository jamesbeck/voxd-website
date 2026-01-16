import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Example Conversation",
  description: "Example conversation viewer",
};

export default function IframeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
