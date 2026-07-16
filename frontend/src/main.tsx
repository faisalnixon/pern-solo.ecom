import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { BrowserRouter } from "react-router";
import { SentryErrorFallback } from "./components/SentryErrorFallback.tsx";
import { SentryUserSync } from "./components/SentryUserSync.tsx";

const queryClient = new QueryClient();

const apiBase = import.meta.env.VITE_API_URL ?? "";
const tracePropagationTargets =
  apiBase.length > 0
    ? [apiBase]
    : typeof window !== "undefined"
      ? [window.location.origin]
      : [];

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // vite will set this to "development" or "production" automatically
  sendDefaultPii: true, //sendDefaultPii means that Sentry will send the user's IP address and other identifying information along with the error report. This can be useful for debugging, but it may also raise privacy concerns, so use it with caution. Pii = personally identifiable information (PII)
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      //replayIntegration will record the user's interactions with the application, such as clicks, scrolls, and form submissions.
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0, // will set to 0.1 or 0.2 in production, but for now we want to see everything
  tracePropagationTargets: tracePropagationTargets, //tracePropagationTargets will tell Sentry which outgoing requests to trace. In this case, it will trace requests to the API base URL if it's set, or to the current origin if not.
  replaysSessionSampleRate: 1.0, // will set to 0.1 or 0.2 in production
  replaysOnErrorSampleRate: 1.0, // will set to 0.1 or 0.2 in production
  enableLogs: true,
});
// In simple terms, 'browserTracingIntegration' lets Sentry see things like:
// page load timing
// route/navigation timing
// slow frontend interactions
// outgoing fetch / API requests
// frontend-to-backend trace linking

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <SentryUserSync />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
            {/* We are wrapping our application with Sentry's Error Boundary and a custom fallback component named SentryErrorFallback to display a friendly "something went wrong" message if the app crashes. */}
            <App />
          </Sentry.ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
);
