import "@/app/globals.css";
import Link from "next/link";
import Image from "next/image";
import Menu from "./menu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div className="bg-white w-full flex  items-center py-4 px-4 gap-2 ">
        <Link href="/" className="">
          <Image src="/logo.svg" alt="Logo" width={140} height={50} />
        </Link>

        <div className="flex-1">
          <Menu />
        </div>
      </div>

      <div>{children}</div>

      <div className="bg-primary w-full flex flex-col justify-center py-8 px-8 items-center text-white font-sm gap-4">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={60}
          height={60}
          className="relative top-1"
        />
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
          © {new Date().getFullYear()} Voxd. All rights reserved. Voxd is a
          trading style of IO Shield Limited, a company registered in England
          and Wales (Company No. 11265201).
        </div>
      </div>
    </div>
  );
}
