import db from "../database/db";

const getAgents = async () => {
  return db("agent").select("*");
};

export default getAgents;
