import { notFound } from "next/navigation";
import db from "@/database/db";
import Container from "@/components/websiteui/container";
import { getIcon } from "@/lib/iconMap";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import saGetTopFeatures from "@/actions/saGetTopFeatures";

type Feature = {
  id: string;
  title: string;
  slug: string;
  icon: string;
  body: string;
  short: string;
  topFeature: boolean;
};

async function getFeature(slug: string): Promise<Feature | null> {
  const feature = await db("feature").where("slug", slug).first();
  return feature || null;
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = await getFeature(slug);

  if (!feature) {
    notFound();
  }

  const Icon = getIcon(feature.icon);

  // Get other top features to display at the bottom
  const allTopFeatures = await saGetTopFeatures();
  const otherFeatures = allTopFeatures.filter((f) => f.slug !== slug);

  return (
    <>
      <Container colour="blue" header>
        <div className="max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/10 w-16 h-16 rounded-lg flex items-center justify-center">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-6xl md:text-5xl font-bold text-white">
              {feature.title}
            </h1>
          </div>

          <p className="text-xl text-white/90 leading-relaxed">
            {feature.short}
          </p>
        </div>
      </Container>

      <Container>
        <div className="max-w-6xl mx-auto prose prose-lg prose-slate">
          <MarkdownContent content={feature.body} />
        </div>
      </Container>

      {/* More Features Section */}
      {otherFeatures.length > 0 && (
        <Container colour="blue">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              More Features
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherFeatures.map((otherFeature) => {
                const FeatureIcon = getIcon(otherFeature.icon);
                return (
                  <Link
                    key={otherFeature.id}
                    href={`/features/${otherFeature.slug}`}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-xl transition-all duration-200 hover:scale-105 block text-center"
                  >
                    <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <FeatureIcon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {otherFeature.title}
                    </h4>
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      )}
    </>
  );
}
