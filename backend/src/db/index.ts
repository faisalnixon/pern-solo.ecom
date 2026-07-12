import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg"; //pg means PostgreSQL. pg is a Node.js module that allows you to interact with a PostgreSQL database. It provides a client for connecting to the database, executing queries, and managing transactions.

import * as schema from "./schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
