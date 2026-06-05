import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import InvoicesTable from "./invoicesTable";

export default async function Page() {
  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Billing" },
          { label: "Invoices" },
        ]}
      />
      <H1>Invoices</H1>
      <InvoicesTable />
    </Container>
  );
}
