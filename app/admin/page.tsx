import React from "react";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import Container from "@/components/websiteui/container";
import H1 from "@/components/adminui/H1";

export default async function Page() {
  await verifyAccessToken();

  return (
    <Container>
      <H1>Admin area</H1>
    </Container>
  );
}
