"use server";
import db from "../database/db";
import { verifyAccessToken } from "./auth/verifyToken";

type Organisations = {
  id: string;
  name: string;
}[];

const getOrganisations = async (): Promise<Organisations> => {
  const accessToken = await verifyAccessToken();

  const organisationsQuery = db<Organisations>("organisation")
    .leftJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId"
    )
    .groupBy("organisation.id")
    .select("organisation.id", "organisation.name");

  //if organisation is logged in, restrict to their agents
  if (!accessToken.partner && !accessToken.admin) {
    organisationsQuery.where(
      "organisationUser.adminUserId",
      accessToken!.adminUserId
    );
  }

  //if partner is logged in, restrict to their customers
  if (accessToken?.partner && !accessToken.admin) {
    organisationsQuery.where("organisation.partnerId", accessToken!.partnerId);
  }

  if (accessToken?.partner) {
    organisationsQuery.where("organisation.partnerId", accessToken.partnerId);
  }

  const organisations = await organisationsQuery;

  return organisations;
};

export default getOrganisations;
