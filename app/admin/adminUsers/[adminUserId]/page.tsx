import getAdminUserById from "@/lib/getAdminUserById";
import H1 from "@/components/adminui/H1";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { AdminUser } from "@/types/types";
import NewAdminUserForm from "./newAdminUserForm";
import { notFound } from "next/navigation";
import AdminUserActions from "./AdminUserActions";
import EditAdminUserForm from "./editAdminUserForm";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import LogExplorer from "@/components/admin/LogExplorer";

export default async function Page({
  params,
}: {
  params: { adminUserId: string };
}) {
  const token = await verifyAccessToken();

  const adminUserId = (await params).adminUserId;

  let user: AdminUser | null = null;

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
            superAdmin={token.superAdmin}
            partner={token.partner}
          />
          <Tabs defaultValue="edit" className="space-y-2">
            <TabsList>
              <TabsTrigger value="edit">Edit User</TabsTrigger>
              {token.superAdmin && (
                <TabsTrigger value="log">Activity Log</TabsTrigger>
              )}
            </TabsList>

            <div className="border-b mb-6" />

            <TabsContent value="edit">
              <EditAdminUserForm
                adminUserId={adminUserId}
                name={user.name}
                email={user.email}
                partnerId={user.partnerId}
                organisationId={user.organisationId}
                canEditOrganisation={token.superAdmin || token.partner}
                superAdmin={token.superAdmin}
              />
            </TabsContent>

            {token.superAdmin && (
              <TabsContent value="log">
                <LogExplorer
                  filters={{ adminUserId: user.id }}
                  title="User Activity"
                  pageSize={20}
                />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      {!user && <NewAdminUserForm isSuperAdmin={token.superAdmin} />}
    </Container>
  );
}
