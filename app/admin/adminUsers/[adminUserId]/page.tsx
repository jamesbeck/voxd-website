import getAdminUserById from "@/lib/getAdminUserById";
import H1 from "@/components/adminui/H1";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { User } from "@/types/types";
import NewAdminUserForm from "./newAdminUserForm";
import { notFound } from "next/navigation";
import AdminUserActions from "./AdminUserActions";
import EditAdminUserForm from "./editAdminUserForm";
import H2 from "@/components/adminui/H2";
import getPartners from "@/lib/getPartners";

export default async function Page({
  params,
}: {
  params: { adminUserId: string };
}) {
  const adminUserId = (await params).adminUserId;

  let user: User | null = null;

  if (adminUserId && adminUserId != "new")
    user = await getAdminUserById({ adminUserId });

  if (!user && adminUserId !== "new") return notFound();

  //get all partners for the edit form
  const partners = await getPartners();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Admin Users", href: "/admin/adminUsers" },
          { label: user?.name || "New Admin User" },
        ]}
      />
      <H1>{user?.name || "New Admin User"}</H1>
      {user && (
        <>
          <AdminUserActions user={user} />
          <Tabs defaultValue="sessions" className="space-y-2">
            <TabsList>
              <TabsTrigger value="edit">Edit User</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <EditAdminUserForm
                adminUserId={adminUserId}
                name={user.name}
                email={user.email}
                partnerId={user.partnerId}
                organisationIds={user.organisationIds}
                partnerOptions={partners.map((partner) => ({
                  value: partner.id,
                  label: partner.name,
                }))}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
      {!user && <NewAdminUserForm />}
    </Container>
  );
}
