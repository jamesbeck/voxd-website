import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import NewOrganisationForm from "./newQuoteForm";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import { notFound } from "next/navigation";
import getOrganisations from "@/lib/getOrganisations";
import { getQuoteById, Quote } from "@/lib/getQuoteById";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistance } from "date-fns";
import EditSpecificationForm from "./editSpecificationForm";
import EditPricingForm from "./EditPricingForm";
import ExampleConversationsTab from "@/components/admin/ExampleConversationsTab";
import QuoteActions from "./QuoteActions";
import DataCard from "@/components/adminui/DataCard";
import {
  Calendar,
  FileText,
  Activity,
  Building,
  User,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import QuoteProgress from "./QuoteProgress";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import EditProposalForm from "./EditProposalForm";
import EditQuoteTitleDialog from "./EditQuoteTitleDialog";
import EditBackgroundForm from "./EditBackgroundForm";
import EditConceptForm from "./EditConceptForm";
import QuoteViewsTable from "./QuoteViewsTable";
import QuoteHeroImageTab from "./QuoteHeroImageTab";
import QuoteActionsTab from "./QuoteActionsTab";

export default async function Page({
  params,
  searchParams,
}: {
  params: { quoteId: string };
  searchParams: { tab?: string };
}) {
  const quoteId = (await params).quoteId;
  const activeTab = (await searchParams).tab || "info";

  let quote: Quote | null = null;

  if (quoteId && quoteId != "new")
    quote = await getQuoteById({ quoteId: quoteId });

  if (!quote && quoteId !== "new") return notFound();

  //get organisations for the select
  const organisations = await getOrganisations();

  // Get access token to determine user permissions
  const accessToken = await verifyAccessToken();
  const isSuperAdmin = accessToken.superAdmin;
  const isOwnerPartner =
    accessToken.partner && quote?.partnerId === accessToken.partnerId;

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
      <H1>
        {quote ? (
          <span className="inline-flex items-center gap-2">
            {quote.organisationName} - {quote.title}
            <EditQuoteTitleDialog quoteId={quote.id} title={quote.title} />
          </span>
        ) : (
          "New Quote"
        )}
      </H1>

      {quote && (
        <>
          <QuoteProgress status={quote.status} />

          <Tabs value={activeTab} className="space-y-2">
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <TabsList>
                <TabsTrigger value="info" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=info`}>Info</Link>
                </TabsTrigger>
                <TabsTrigger value="actions" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=actions`}>
                    Actions
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="background" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=background`}>
                    Background
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="specification" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=specification`}>
                    Specification
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="concept" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=concept`}>
                    Concept
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="proposal" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=proposal`}>
                    Proposal
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="pricing" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=pricing`}>
                    Pricing
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="exampleConversations" asChild>
                  <Link
                    href={`/admin/quotes/${quote.id}?tab=exampleConversations`}
                  >
                    Example Conversations
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="heroImage" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=heroImage`}>
                    Hero Image
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="views" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=views`}>
                    Views
                  </Link>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 ml-auto">
                <QuoteActions
                  quoteId={quote.id}
                  shortLinkId={quote.shortLinkId}
                  name={quote.title}
                  status={quote.status}
                  canDelete={isSuperAdmin || isOwnerPartner}
                  createdByAdminUserId={quote.createdByAdminUserId}
                  isSuperAdmin={isSuperAdmin}
                />
              </div>
            </div>

            <div className="border-b mb-6" />

            <TabsContent value="info">
              <DataCard
                items={[
                  {
                    label: "Quote ID",
                    value: quote.id,
                    icon: <FileText className="h-4 w-4" />,
                  },
                  {
                    label: "Short Link ID",
                    value: quote.shortLinkId,
                    icon: <FileText className="h-4 w-4" />,
                  },
                  {
                    label: "Created",
                    value: format(quote.createdAt, "dd/MM/yyyy HH:mm"),
                    description: formatDistance(quote.createdAt, new Date(), {
                      addSuffix: true,
                    }),
                    icon: <Calendar className="h-4 w-4" />,
                  },
                  {
                    label: "Organisation",
                    value: (
                      <Link
                        href={`/admin/organisations/${quote.organisationId}`}
                        className="text-primary hover:underline"
                      >
                        {quote.organisationName}
                      </Link>
                    ),
                    icon: <Building className="h-4 w-4" />,
                  },
                  {
                    label: "Status",
                    value: <span className="capitalize">{quote.status}</span>,
                    icon: <Activity className="h-4 w-4" />,
                    variant:
                      quote.status === "accepted"
                        ? "success"
                        : quote.status === "rejected"
                          ? "danger"
                          : "default",
                  },
                  {
                    label: "Owner",
                    value: quote.ownerName ? (
                      <div>
                        <div>{quote.ownerName}</div>
                        {quote.ownerEmail && (
                          <div className="text-sm text-muted-foreground">
                            {quote.ownerEmail}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Not assigned
                      </span>
                    ),
                    icon: <User className="h-4 w-4" />,
                  },
                  {
                    label: "Next Action Date",
                    value: quote.nextActionDate
                      ? format(quote.nextActionDate, "dd/MM/yyyy")
                      : "Not set",
                    icon: <CalendarClock className="h-4 w-4" />,
                    variant:
                      quote.nextActionDate &&
                      new Date(quote.nextActionDate) <= new Date()
                        ? "danger"
                        : "default",
                  },
                ]}
              />
            </TabsContent>
            <TabsContent value="actions">
              <QuoteActionsTab
                quoteId={quote.id}
                nextAction={quote.nextAction}
                nextActionDate={quote.nextActionDate}
              />
            </TabsContent>
            <TabsContent value="background">
              <EditBackgroundForm
                quoteId={quote.id}
                background={quote.background}
              />
            </TabsContent>
            <TabsContent value="specification">
              <EditSpecificationForm
                quoteId={quote.id}
                objectives={quote.objectives}
                dataSourcesAndIntegrations={quote.dataSourcesAndIntegrations}
                otherNotes={quote.otherNotes}
                status={quote.status}
                isSuperAdmin={isSuperAdmin}
              />
            </TabsContent>
            <TabsContent value="concept">
              <EditConceptForm
                quoteId={quote.id}
                conceptPersonalMessage={quote.conceptPersonalMessage}
                generatedConceptIntroduction={
                  quote.generatedConceptIntroduction
                }
                generatedConcept={quote.generatedConcept}
                conceptHideSections={quote.conceptHideSections}
              />
            </TabsContent>
            <TabsContent value="proposal">
              <EditProposalForm
                quoteId={quote.id}
                proposalPersonalMessage={quote.proposalPersonalMessage}
                generatedProposalIntroduction={
                  quote.generatedProposalIntroduction
                }
                generatedSpecification={quote.generatedSpecification}
                proposalHideSections={quote.proposalHideSections}
              />
            </TabsContent>
            <TabsContent value="pricing">
              <EditPricingForm
                quoteId={quote.id}
                setupFee={quote.setupFee}
                monthlyFee={quote.monthlyFee}
                setupFeeVoxdCost={quote.setupFeeVoxdCost}
                monthlyFeeVoxdCost={quote.monthlyFeeVoxdCost}
                buildDays={quote.buildDays}
                freeMonthlyMinutes={quote.freeMonthlyMinutes}
                contractLength={quote.contractLength}
                isSuperAdmin={isSuperAdmin}
                isOwnerPartner={isOwnerPartner}
              />
            </TabsContent>
            <TabsContent value="exampleConversations">
              <ExampleConversationsTab
                quoteId={quote.id}
                conversations={quote.exampleConversations}
                businessName={quote.organisationName}
              />
            </TabsContent>
            <TabsContent value="heroImage">
              <QuoteHeroImageTab
                quoteId={quote.id}
                heroImageFileExtension={quote.heroImageFileExtension}
                organisationName={quote.organisationName}
                background={quote.background || ""}
              />
            </TabsContent>
            <TabsContent value="views">
              <QuoteViewsTable quoteId={quote.id} />
            </TabsContent>
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
