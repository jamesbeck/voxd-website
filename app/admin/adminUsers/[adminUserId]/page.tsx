import getAdminUserById from "@/lib/getAdminUserById";
import H1 from "@/components/adminui/H1";
import { TabsContent } from "@/components/ui/tabs";
import RecordTabs from "@/components/admin/RecordTabs";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { AdminUser } from "@/types/types";
import NewAdminUserForm from "./newAdminUserForm";
import { notFound } from "next/navigation";
import AdminUserActions from "./AdminUserActions";
import EditAdminUserForm from "./editAdminUserForm";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import LogExplorer from "@/components/admin/LogExplorer";
import AdminUserPermissionsTab from "./AdminUserPermissionsTab";
import { RecordTab } from "@/components/admin/RecordTabs";

export default async function Page({
  params,
  searchParams,
}: {
  params: { adminUserId: string };
  searchParams: { tab?: string };
}) {
  const token = await verifyAccessToken();

  const adminUserId = (await params).adminUserId;
  const activeTab = (await searchParams).tab || "edit";

  if (adminUserId === "new" && !token.superAdmin && !token.partner) {
    return notFound();
  }

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
          <RecordTabs
            value={activeTab}
            tabs={
              [
                {
                  value: "edit",
                  label: "Edit User",
                  href: `/admin/adminUsers/${user.id}?tab=edit`,
                },
                {
                  value: "permissions",
                  label: "Permissions",
                  href: `/admin/adminUsers/${user.id}?tab=permissions`,
                },
                ...(token.superAdmin
                  ? [
                      {
                        value: "log",
                        label: "Activity Log",
                        href: `/admin/adminUsers/${user.id}?tab=log`,
                      },
                    ]
                  : []),
              ] satisfies RecordTab[]
            }
            actions={
              <AdminUserActions
                user={user}
                superAdmin={token.superAdmin}
                partner={token.partner}
              />
            }
          >
            <TabsContent value="edit">
              <EditAdminUserForm
                adminUserId={adminUserId}
                name={user.name}
                email={user.email}
                partnerId={user.partnerId}
                organisationId={user.organisationId}
                organisationName={user.organisationName}
                canEditOrganisation={token.superAdmin || token.partner}
                superAdmin={token.superAdmin}
              />
            </TabsContent>

            <TabsContent value="permissions">
              <AdminUserPermissionsTab
                adminUserId={adminUserId}
                accessToken={token}
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
          </RecordTabs>
        </>
      )}
      {!user && <NewAdminUserForm isSuperAdmin={token.superAdmin} />}
    </Container>
  );
}
