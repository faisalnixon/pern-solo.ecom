import express from "express";
import cors from "cors";
import "dotenv/config";

import { clerkMiddleware } from '@clerk/express'

import { clerkWebhookHandler } from "./webhooks/clerk";
import { getEnv } from "./lib/env";

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
app.use(clerkMiddleware())

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});