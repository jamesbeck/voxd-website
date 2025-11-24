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
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export default async function Page({
  params,
}: {
  params: { adminUserId: string };
}) {
  const token = await verifyAccessToken();

  const adminUserId = (await params).adminUserId;

  let user: User | null = null;

  if (adminUserId && adminUserId != "new")
    user = await getAdminUserById({ adminUserId });

  if (!user && adminUserId !== "new") return notFound();

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
          <AdminUserActions
            user={user}
            admin={token.admin}
            partner={token.partner}
          />
          <Tabs defaultValue="edit" className="space-y-2">
            <TabsList>
              <TabsTrigger value="edit">Edit User</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <EditAdminUserForm
                adminUserId={adminUserId}
                name={user.name}
                email={user.email}
                organisationIds={user.organisationIds}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
      {!user && <NewAdminUserForm />}
    </Container>
  );
}
