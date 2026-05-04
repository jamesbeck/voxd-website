import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "@/app/globals.css";
import DevLoginAsOverlay from "@/components/dev/DevLoginAsOverlay";
import { verifyAccessToken, verifyIdToken } from "@/lib/auth/verifyToken";

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
  const accessToken = await verifyAccessToken(false);
  const idToken = await verifyIdToken(false);
  const currentEmail = accessToken?.email || idToken?.email || null;

  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased text-darkgrey`}>
        {children}
        {process.env.NODE_ENV === "development" && (
          <DevLoginAsOverlay currentEmail={currentEmail} />
        )}
      </body>
    </html>
  );
}
