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
  const brandName = partner?.effectivePartnerName || "VOXD";

  const favicon =
    partner?.effectivePartnerLogoFileExtension &&
    partner?.effectivePartnerOrganisationId
      ? `https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"}.wasabisys.com/${process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"}/organisationLogos/${partner.effectivePartnerOrganisationId}.${partner.effectivePartnerLogoFileExtension}`
      : "/logo.svg";

  return {
    title: `${brandName} | WhatsApp AI Chatbots`,
    description: brandName,
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
        {partner?.effectivePartnerPrimaryColour && (
          <style>{`:root { --color-primary: ${partner.effectivePartnerPrimaryColour}; }`}</style>
        )}
        <div className="w-full flex overflow-hidden min-h-screen">
          <AdminSidebar
            email={accessToken?.email}
            superAdmin={accessToken?.superAdmin}
            partner={accessToken?.partner}
            agents={userAgents}
            logoUrl={
              partner?.effectivePartnerLogoFileExtension &&
              partner?.effectivePartnerOrganisationId
                ? `https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"}.wasabisys.com/${process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"}/organisationLogos/${partner.effectivePartnerOrganisationId}.${partner.effectivePartnerLogoFileExtension}`
                : undefined
            }
            showLogoOnColour={
              partner?.effectivePartnerShowLogoOnColour ?? undefined
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
