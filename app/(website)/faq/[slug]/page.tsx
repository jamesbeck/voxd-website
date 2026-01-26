import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, FolderOpen, ChevronRight } from "lucide-react";
import Container from "@/components/websiteui/container";
import { MarkdownContent } from "@/components/MarkdownContent";
import {
  getPublicFaqBySlug,
  getRelatedFaqs,
  type PublicFaq,
} from "@/lib/getPublicFaqs";

export const dynamic = "force-dynamic";

interface FaqPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: FaqPageProps): Promise<Metadata> {
  const { slug } = await params;
  const faq = await getPublicFaqBySlug(slug);

  if (!faq) {
    return {
      title: "FAQ Not Found | Voxd",
      description: "The requested FAQ could not be found.",
    };
  }

  const description =
    faq.answer.length > 160 ? faq.answer.substring(0, 157) + "..." : faq.answer;

  return {
    title: `${faq.question} | Voxd FAQ`,
    description: description.replace(/[#*`]/g, ""), // Remove markdown characters
    openGraph: {
      title: faq.question,
      description: description.replace(/[#*`]/g, ""),
    },
  };
}

export default async function FaqDetailPage({ params }: FaqPageProps) {
  const { slug } = await params;
  const faq = await getPublicFaqBySlug(slug);

  if (!faq) {
    notFound();
  }

  const relatedFaqs = faq.categoryId
    ? await getRelatedFaqs(faq.categoryId, faq.id)
    : [];

  return (
    <>
      {/* Hero Section */}
      <Container colour="blue" header>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-white/80 text-sm">
              <li>
                <Link
                  href="/faq"
                  className="hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              {faq.categoryName && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <li className="text-white/90">{faq.categoryName}</li>
                </>
              )}
            </ol>
          </nav>

          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">
            {faq.question}
          </h1>

          {faq.categoryName && (
            <div className="mt-4 flex items-center gap-2 text-white/80">
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">{faq.categoryName}</span>
            </div>
          )}
        </div>
      </Container>

      {/* Answer Section */}
      <Container>
        <div className="max-w-4xl mx-auto">
          <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
            <div className="prose prose-gray prose-lg max-w-none">
              <MarkdownContent content={faq.answer} />
            </div>
          </article>

          {/* Back to FAQ Link */}
          <div className="mt-8">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all FAQs
            </Link>
          </div>
        </div>
      </Container>

      {/* Related FAQs Section */}
      {relatedFaqs.length > 0 && (
        <Container colour="white">
          <div className="max-w-4xl mx-auto">
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                More from {faq.categoryName}
              </h2>

              <div className="space-y-3">
                {relatedFaqs.map((relatedFaq) => (
                  <RelatedFaqCard key={relatedFaq.id} faq={relatedFaq} />
                ))}
              </div>
            </div>
          </div>
        </Container>
      )}
    </>
  );
}

function RelatedFaqCard({ faq }: { faq: PublicFaq }) {
  return (
    <Link
      href={`/faq/${faq.slug}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-primary/30 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors">
          {faq.question}
        </span>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary flex-shrink-0 transition-colors" />
      </div>
    </Link>
  );
}
