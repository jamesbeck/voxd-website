import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "./adminSidebar";
import { BreadcrumbProvider } from "@/components/admin/BreadcrumbProvider";
import TopBar from "@/components/admin/TopBar";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import getPartnerFromHeaders from "@/lib/getPartnerFromHeaders";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import saGetUserAgents from "@/actions/saGetUserAgents";

export async function generateMetadata(): Promise<Metadata> {
  const partner = await getPartnerFromHeaders();

  const favicon =
    partner?.domain && partner?.logoFileExtension
      ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${partner.domain}.${partner.logoFileExtension}`
      : "/logo.svg";

  return {
    title: partner?.name
      ? `${partner.name} | WhatsApp AI Chatbots`
      : "VOXD | WhatsApp AI Chatbots",
    description: partner?.name || "WhatsApp AI Chatbots",
    icons: {
      icon: favicon,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const partner = await getPartnerFromHeaders();
  const accessToken = await verifyAccessToken();
  const userAgents = await saGetUserAgents();

  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        {partner?.colour && (
          <style>{`:root { --color-primary: #${partner.colour}; }`}</style>
        )}
        <div className="w-full flex overflow-hidden min-h-screen">
          <AdminSidebar
            email={accessToken?.email}
            superAdmin={accessToken?.superAdmin}
            partner={accessToken?.partner}
            agents={userAgents}
            logoUrl={
              partner?.domain && partner?.logoFileExtension
                ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${partner?.domain}.${partner?.logoFileExtension}`
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
