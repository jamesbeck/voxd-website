import { Knex } from "knex";

const config: Record<string, Knex.Config> = {
  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
    },
    searchPath: "public",
    pool: {
      min: 2,
      max: 10,
    },
    // migrations: {
    //   tableName: "knex_migrations",
    //   directory: "migrations",
    // },
  },
  development: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
    },
    searchPath: "public",
    pool: {
      min: 0, // Lower min connections in development
      max: 5, // Lower max connections in development
    },
    // migrations: {
    //   tableName: "knex_migrations",
    //   directory: "migrations",
    // },
  },
};

export default config;
