import express from "express";
import cors from "cors";
import "dotenv/config";

import fs from "node:fs";
import path from "node:path";

import { clerkMiddleware } from "@clerk/express";

import { clerkWebhookHandler } from "./webhooks/clerk";
import { getEnv } from "./lib/env";
import keerpAliveCorn from "./lib/corn";
import meRouter from "./routes/meRouter";
import productsRouter from "./routes/productRouter";
import streamRouter from "./routes/streamRouter";
import checkoutRouter from "./routes/checkoutRouter";

const env = getEnv();
const app = express();

const rawJson = express.raw({ type: "application/json", limit: "1mb" });
// it's important that you don't parse the webhook event data, it should be in the raw format
app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});
// we place the clerk web hook handler before app.use(express.json()) is because the clerk web hook handler needs to read the raw json data from the request body, and if we place it after app.use(express.json()), the request body will be parsed and the raw json data will be lost.

app.use(express.json()); // this middleware is used to parse or read the json data from the request body
app.use(cors()); // this middleware is used to allow cross-origin requests from the frontend
app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  //_ is used to indicate that the parameter is not used in the function
  res.json({ status: "ok" });
});

app.use("/api/me", meRouter);
app.use("/api/products", productsRouter);
app.use("/api/stream", streamRouter);
app.use("/api/checkout", checkoutRouter);

const publicDir = path.join(process.cwd(), "public");
//cwd is current working directory &
// "public" is the folder where the static files are located .. "public" folder is created by vite build command in the frontend project

if (fs.existsSync(publicDir)) {
  //existsSync means check if the public folder exists or not
  app.use(express.static(publicDir)); // this middleware is used to serve the static files from the public folder

  app.get("/{*any}", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      //req.method === "GET" is when the user is trying to access a page in the browser
      //req.method === "HEAD" is when the user is trying to get the headers of the response, not the body of the response
      next();
      return;
    }

    if (req.path.startsWith("/api/") || req.path.startsWith("/webhooks/")) {
      next();
      return;
    }

    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);

  if (env.NODE_ENV === "production") {
    keerpAliveCorn.start(); // start the cron job to keep the server alive in production
  }
});
