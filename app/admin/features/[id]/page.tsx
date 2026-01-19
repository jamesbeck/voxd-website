import EditFeatureForm from "./editFeatureForm";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import H1 from "@/components/adminui/H1";
import Container from "@/components/adminui/Container";
import { notFound, redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "@/database/db";
import FeatureActions from "./featureActions";

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const accessToken = await verifyAccessToken();

  // Only super admins can access this page
  if (!accessToken.superAdmin) {
    redirect("/admin");
  }

  const feature = await db("feature").where("id", id).first();

  if (!feature) return notFound();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Features", href: "/admin/features" },
          { label: feature.title },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <H1>{feature.title}</H1>
        <FeatureActions featureId={feature.id} title={feature.title} />
      </div>

      <EditFeatureForm
        id={feature.id}
        title={feature.title}
        slug={feature.slug}
        icon={feature.icon}
        short={feature.short}
        body={feature.body}
        topFeature={feature.topFeature}
      />
    </Container>
  );
}
