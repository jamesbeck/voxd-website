import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="bg-primary w-full flex flex-col justify-center items-center py-8 gap-2">
          <Image src="/logo.svg" alt="Logo" width={100} height={100} />
          <h1 className="text-5xl font-bold text-white">SwiftReply</h1>
        </div>

        <div className="py-12">{children}</div>

        <div className="bg-primary w-full flex flex-col justify-center py-8 px-8 text-center font-sm gap-4">
          <div>
            <Link className="hover:underline" href="/privacy-policy">
              Privacy Policy
            </Link>
            &nbsp;|&nbsp;
            <Link className="hover:underline" href="/terms">
              Terms of Service
            </Link>
          </div>
          <div className="text-xs">
            © {new Date().getFullYear()} SwiftReply. All rights reserved.
            SwiftReply is a trading style of IO Shield Limited, a company
            registered in England and Wales (Company No. 11265201).
          </div>
        </div>
      </body>
    </html>
  );
}
