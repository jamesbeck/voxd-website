import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import NewFaqCategoryForm from "./newFaqCategoryForm";
import { notFound } from "next/navigation";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  // Only admins can create FAQ categories
  if (!accessToken.admin) {
    return notFound();
  }

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "FAQ Categories", href: "/admin/faq-categories" },
          { label: "New Category" },
        ]}
      />
      <H1>Create New FAQ Category</H1>

      <NewFaqCategoryForm />
    </Container>
  );
}
