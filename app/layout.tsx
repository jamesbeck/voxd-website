import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "@/app/globals.css";

const roboto = Roboto({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VOXD | WhatsApp AI Chatbots",
  description: "Bespoke WhatsApp AI Chatbots",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased text-darkgrey`}>
        {children}
      </body>
    </html>
  );
}
