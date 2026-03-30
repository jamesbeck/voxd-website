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
    partner?.organisationLogoFileExtension && partner?.organisationId
      ? `https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"}.wasabisys.com/${process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"}/organisationLogos/${partner.organisationId}.${partner.organisationLogoFileExtension}`
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
        {partner?.organisationPrimaryColour && (
          <style>{`:root { --color-primary: ${partner.organisationPrimaryColour}; }`}</style>
        )}
        <div className="w-full flex overflow-hidden min-h-screen">
          <AdminSidebar
            email={accessToken?.email}
            superAdmin={accessToken?.superAdmin}
            partner={accessToken?.partner}
            agents={userAgents}
            logoUrl={
              partner?.organisationLogoFileExtension && partner?.organisationId
                ? `https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"}.wasabisys.com/${process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"}/organisationLogos/${partner.organisationId}.${partner.organisationLogoFileExtension}`
                : undefined
            }
            showLogoOnColour={
              partner?.organisationShowLogoOnColour ?? undefined
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
