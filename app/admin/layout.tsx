import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "./adminSidebar";
import { BreadcrumbProvider } from "@/components/admin/BreadcrumbProvider";
import TopBar from "@/components/admin/TopBar";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { Toaster } from "sonner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const accessToken = await verifyAccessToken();

  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        <div className="w-full flex overflow-hidden min-h-screen">
          <AdminSidebar
            email={accessToken?.email}
            admin={accessToken?.admin}
            customer={accessToken?.customer}
            partner={accessToken?.partner}
          />
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <TopBar />
            <div className="px-8 py-4 flex-1 overflow-auto">{children}</div>
            <Toaster richColors />
          </main>
        </div>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
