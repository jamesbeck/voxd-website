import { knex, Knex } from "knex";
import knexfile from "./knexfile";

// Prevent multiple instances in development due to HMR
declare global {
  var __db: Knex | undefined;
}

let db: Knex;

if (process.env.NODE_ENV === "production") {
  db = knex(knexfile[process.env.NODE_ENV]);
} else {
  // In development, use a global variable to preserve the connection across HMR
  if (!global.__db) {
    global.__db = knex(knexfile[process.env.NODE_ENV || "development"]);
  }
  db = global.__db;
}

export default db;
