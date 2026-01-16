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
  ExternalLink,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import QuoteProgress from "./QuoteProgress";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import EditProposalForm from "./EditProposalForm";
import EditQuoteTitleDialog from "./EditQuoteTitleDialog";
import EditBackgroundForm from "./EditBackgroundForm";
import EditPitchForm from "./EditPitchForm";
import QuoteViewsTable from "./QuoteViewsTable";
import QuoteHeroImageTab from "./QuoteHeroImageTab";

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
                <TabsTrigger value="pitch" asChild>
                  <Link href={`/admin/quotes/${quote.id}?tab=pitch`}>
                    Pitch
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
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/quotes`}>
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>

                <QuoteActions
                  quoteId={quote.id}
                  name={quote.title}
                  status={quote.status}
                  canDelete={isSuperAdmin || isOwnerPartner}
                  createdByAdminUserId={quote.createdByAdminUserId}
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
                    label: "Organisation",
                    value: quote.organisationName,
                    icon: <Building className="h-4 w-4" />,
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
                    label: "Public Pitch Link",
                    value: (
                      <a
                        href={`/pitches/${quote.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        View Pitch Page
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ),
                    icon: <ExternalLink className="h-4 w-4" />,
                  },
                  {
                    label: "Public Proposal Link",
                    value: (
                      <a
                        href={`/proposals/${quote.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        View Proposal Page
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ),
                    icon: <ExternalLink className="h-4 w-4" />,
                  },
                ]}
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
                dataSources={quote.dataSources}
                integrationRequirements={quote.integrationRequirements}
                otherNotes={quote.otherNotes}
              />
            </TabsContent>
            <TabsContent value="pitch">
              <EditPitchForm
                quoteId={quote.id}
                pitchPersonalMessage={quote.pitchPersonalMessage}
                generatedPitchIntroduction={quote.generatedPitchIntroduction}
                generatedPitch={quote.generatedPitch}
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
              />
            </TabsContent>
            <TabsContent value="pricing">
              <EditPricingForm
                quoteId={quote.id}
                setupFee={quote.setupFee}
                monthlyFee={quote.monthlyFee}
                setupFeeVoxdCost={quote.setupFeeVoxdCost}
                monthlyFeeVoxdCost={quote.monthlyFeeVoxdCost}
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
