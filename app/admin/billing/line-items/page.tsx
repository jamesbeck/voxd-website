import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import LineItemsTable from "./lineItemsTable";

export default async function Page() {
  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Billing" },
          { label: "Line Items" },
        ]}
      />
      <H1>Line Items</H1>
      <LineItemsTable />
    </Container>
  );
}
