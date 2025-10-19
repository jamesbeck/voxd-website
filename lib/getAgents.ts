import db from "../database/db";

const getAgents = async () => {
  const agents = await db("agent").select("id", "name", "niceName");
  return agents;
};

export default getAgents;
