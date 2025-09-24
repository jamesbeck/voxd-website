import { knex } from "knex";
import knexfile from "./knexfile";

const db = knex(knexfile[process.env.NODE_ENV]);

export default db;
