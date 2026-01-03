import H1 from "@/components/adminui/H1";
import FaqCategoryTable from "./faqCategoryTable";
import Container from "@/components/adminui/Container";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  // Only admins can access FAQ categories
  if (!accessToken.admin) {
    return notFound();
  }

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "FAQ Categories" },
        ]}
      />
      <H1>FAQ Categories</H1>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/faq-categories/new">
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Link>
        </Button>
      </div>

      <FaqCategoryTable />
    </Container>
  );
}
