"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

interface WhatsAppQRCodeProps {
  url: string;
  size?: number;
}

export default function WhatsAppQRCode({
  url,
  size = 128,
}: WhatsAppQRCodeProps) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-center"
    >
      <div className="bg-white p-2 rounded-lg inline-block hover:shadow-lg transition-shadow cursor-pointer">
        <QRCodeSVG value={url} size={size} />
      </div>
    </Link>
  );
}
