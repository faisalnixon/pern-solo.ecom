import "dotenv/config";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const dsn = process.env.SENTRY_DSN;

// node profiling integration is for performance debugging in Sentry.
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    integrations: [nodeProfilingIntegration()],
    enableLogs: true,
    tracesSampleRate: 1.0, // this should be set to 1.0 for development and testing, but should be lowered in production to avoid sending too much data
    profileSessionSampleRate: 1.0, //this should be set to 1.0 for development and testing, but should be lowered in production to avoid sending too much data
    profileLifecycle: "trace",
    sendDefaultPii: true,
  });
}
