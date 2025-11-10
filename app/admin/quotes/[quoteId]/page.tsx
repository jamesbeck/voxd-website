import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";
import NewOrganisationForm from "./newQuoteForm";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";

export default function NewOrganisationPage() {
  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Quotes", href: "/admin/quotes" },
          { label: "New Quote" },
        ]}
      />
      <H1>New Quote</H1>
      <NewOrganisationForm />
    </Container>
  );
}
