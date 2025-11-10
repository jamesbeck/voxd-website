import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "./adminSidebar";
import { BreadcrumbProvider } from "@/components/admin/BreadcrumbProvider";
import TopBar from "@/components/admin/TopBar";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { Toaster } from "sonner";
import { headers } from "next/headers";
import { getPartnerByDomain } from "@/lib/getPartnerByDomain";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const domain = headersList.get("x-domain");
  const partnerDomain = domain || "voxd.ai";
  const partner = await getPartnerByDomain({ domain: partnerDomain });

  return {
    title: partner?.name
      ? `${partner.name} | WhatsApp AI Chatbots`
      : "VOXD | WhatsApp AI Chatbots",
    description: partner?.name || "WhatsApp AI Chatbots",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const accessToken = await verifyAccessToken();

  const headersList = await headers();
  const domain = headersList.get("x-domain");

  //if no domain use voxd.ai
  const partnerDomain = domain || "voxd.ai";
  const partner = await getPartnerByDomain({ domain: partnerDomain });

  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        <div
          className="w-full flex overflow-hidden min-h-screen"
          style={
            partner?.colour
              ? ({
                  "--color-primary": `#${partner?.colour}`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <AdminSidebar
            email={accessToken?.email}
            admin={accessToken?.admin}
            organisation={accessToken?.organisation}
            partner={accessToken?.partner}
            logoUrl={
              partner?.domain
                ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${partner?.domain}`
                : undefined
            }
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
