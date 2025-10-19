import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import H1 from "@/components/adminui/H1";
import getCustomerById from "@/lib/getCustomerById";
import Container from "@/components/adminui/container";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import H2 from "@/components/adminui/H2";
import EditCustomerForm from "./editCustomerForm";
import { notFound } from "next/navigation";
import AgentsTable from "./agentsTable";
import UsersTable from "./usersTable";
import NewCustomerForm from "./newCustomerForm";

export default async function Page({
  params,
}: {
  params: { customerId: string };
}) {
  await verifyAccessToken();

  const customerId = (await params).customerId;

  let customer;

  if (customerId && customerId != "new")
    customer = await getCustomerById({ customerId: customerId });
  if (!customer && customerId !== "new") return notFound();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: customer?.name || "New Customer" },
        ]}
      />
      <H1>{customer?.name || "New Customer"}</H1>
      {customer && (
        <>
          <Tabs defaultValue="agents" className="space-y-2">
            <TabsList>
              <TabsTrigger value="edit">Edit Customer</TabsTrigger>
              <TabsTrigger value="adminUsers">Admin Users</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <EditCustomerForm
                customerId={customer.id}
                name={customer.name}
                userIds={customer.userIds}
              />
            </TabsContent>
            <TabsContent value="adminUsers">
              <Container>
                <H2>Admin Users</H2>
                <UsersTable customerId={customer.id} />
              </Container>
            </TabsContent>
            <TabsContent value="agents">
              <Container>
                <H2>Agents</H2>
                <AgentsTable customerId={customer.id} />
              </Container>
            </TabsContent>
          </Tabs>
        </>
      )}
      {!customer && <NewCustomerForm />}
    </Container>
  );
}
