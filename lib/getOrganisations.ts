"use server";
import db from "../database/db";
import { verifyAccessToken } from "./auth/verifyToken";

type Organisations = {
  id: string;
  name: string;
}[];

const getOrganisations = async (): Promise<Organisations> => {
  const accessToken = await verifyAccessToken();

  const organisationsQuery = db<Organisations>("organisation").select(
    "organisation.id",
    "organisation.name"
  );

  // If regular admin user (not super admin, not partner), restrict to their organisation
  if (!accessToken.partner && !accessToken.superAdmin) {
    organisationsQuery.where("organisation.id", accessToken.organisationId);
  }

  // If partner is logged in, restrict to their customers
  if (accessToken?.partner && !accessToken.superAdmin) {
    organisationsQuery.where("organisation.partnerId", accessToken.partnerId);
  }

  const organisations = await organisationsQuery;

  return organisations;
};

export default getOrganisations;
