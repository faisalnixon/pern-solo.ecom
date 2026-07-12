/// <reference types="node" /> 
//<reference types="node" />  is a TypeScript directive that tells the TypeScript compiler to include the type definitions for Node.js. This allows you to use Node.js-specific features and APIs in your TypeScript code without encountering type errors. It is especially useful when working with Node.js modules and libraries, as it provides type information for built-in Node.js objects, functions, and modules.
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
