import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import NewOrganisationForm from "./newQuoteForm";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import { notFound } from "next/navigation";
import getOrganisations from "@/lib/getOrganisations";
import { getQuoteById, Quote } from "@/lib/getQuoteById";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import EditSpecificationForm from "./editSpecificationForm";
import QuoteActions from "./QuoteActions";

export default async function Page({
  params,
}: {
  params: { quoteId: string };
}) {
  const quoteId = (await params).quoteId;

  let quote: Quote | null = null;

  if (quoteId && quoteId != "new")
    quote = await getQuoteById({ quoteId: quoteId });

  if (!quote && quoteId !== "new") return notFound();

  //get organisations for the select
  const organisations = await getOrganisations();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Quotes", href: "/admin/quotes" },
          quote
            ? {
                label: quote.organisationName,
                href: `/admin/organisations/${quote.organisationId}`,
              }
            : null,
          { label: quote ? quote.title : "New Quote" },
        ]}
      />
      <H1>{`${quote?.organisationName} - ${quote?.title}` || "New Quote"}</H1>

      {quote && (
        <>
          <Card>
            <CardContent>
              <div>
                <b>{quote?.id}</b>
              </div>
              <div>
                <b>Created:</b> {format(quote?.createdAt, "dd/MM/yyyy")}
              </div>
              <div>
                <b>Status:</b>{" "}
                <Badge variant="secondary" className="mb-4 capitalize">
                  {quote?.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <QuoteActions quoteId={quote.id} name={quote.title} />

          <Tabs defaultValue="agents" className="space-y-2">
            <TabsList>
              <TabsTrigger value="edit">Edit Quote</TabsTrigger>
              <TabsTrigger value="specification">Specification</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="exampleConversations">
                Example Conversations
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit">Edit quote form here</TabsContent>
            <TabsContent value="specification">
              <EditSpecificationForm
                quoteId={quote.id}
                specification={quote.specification}
              />
            </TabsContent>
            <TabsContent value="pricing">Pricing here</TabsContent>
          </Tabs>
        </>
      )}

      {!quote && (
        <NewOrganisationForm
          organisationOptions={organisations.map((o) => ({
            label: o.name,
            value: o.id,
          }))}
        />
      )}
    </Container>
  );
}
