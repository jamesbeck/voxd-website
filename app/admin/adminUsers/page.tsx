import Link from "next/link";
import H1 from "@/components/adminui/H1";
import AdminUsersTable from "./adminUserTable";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import { Button } from "@/components/ui/button";

export default async function Page() {
  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
      />
      <H1>Admin Users</H1>
      <p>These are users that can log in and manage your agents.</p>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/adminUsers/new">New User</Link>
        </Button>
      </div>

      <AdminUsersTable />
    </Container>
  );
}
