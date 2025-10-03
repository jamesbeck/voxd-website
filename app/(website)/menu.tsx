"use client";

import * as React from "react";
import Link from "next/link";
import { Menu as MenuIcon } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const menuItems = [
  { href: "/", label: "Home" },
  { href: "/examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Menu() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="w-full py-2 px-4 md:px-0 border-b border-darkgrey">
      <div className="w-full flex justify-center">
        <NavigationMenu viewport={false} className="hidden md:flex">
          <NavigationMenuList>
            {menuItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href={item.href}>{item.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Mobile Menu */}

      <div className="w-full flex md:hidden items-center">
        <div className="flex-1">Message us on WhatsApp now</div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="p-2 hover:bg-accent rounded-md"
              aria-label="Open menu"
            >
              <MenuIcon className="h-7 w-7" />
            </button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="m-4">SwiftReply</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-8 ml-8">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
