"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./adminSidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="w-full p-8">
        {/* <SidebarTrigger /> */}
        {children}
      </main>
    </SidebarProvider>
  );
}
