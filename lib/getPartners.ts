import db from "../database/db";

const getPartners = async (): Promise<{ id: string; name: string }[]> => {
  const partners = await db("partner").select("id", "name");
  return partners;
};

export default getPartners;
