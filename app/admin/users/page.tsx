import Link from "next/link";
import H1 from "@/components/adminui/H1";
import UsersTable from "./usersTable";
import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/container";
import { Button } from "@/components/ui/button";

export default async function Page() {
  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
      />
      <H1>Manage Users</H1>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/users/new">New User</Link>
        </Button>
      </div>

      <UsersTable />
    </Container>
  );
}
