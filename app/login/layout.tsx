import { headers } from "next/headers";
import { getPartnerByDomain } from "@/lib/getPartnerByDomain";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const domain = headersList.get("x-domain");

  //if no domain use voxd.ai
  const partnerDomain = domain || "voxd.ai";
  // console.log(partnerDomain);
  const partner = await getPartnerByDomain({ domain: partnerDomain });
  // console.log(partner, 123);

  return (
    <div
      style={
        partner?.colour
          ? ({
              "--color-primary": `#${partner?.colour}`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {partner?.colour}
      {children}
    </div>
  );
}
