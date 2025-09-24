import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "@/app/globals.css";

const roboto = Roboto({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swift Reply",
  description: "Bespoke WhatsApp AI Chatbots",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased`}>{children}</body>
    </html>
  );
}
