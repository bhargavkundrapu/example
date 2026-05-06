import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";

import "./index.css";
import App from "./App.jsx";
import ErrorFallbackUI from "./Components/common/ErrorFallbackUI.jsx";
import { isChunkLoadError, chunkLoadUserMessage } from "./utils/chunkLoadError.js";

function escapeRegExp(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Initialize Sentry only in production. Local dev should stay quiet even if a DSN is present.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENABLED = import.meta.env.VITE_SENTRY_ENABLE === "true";
const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const looksLikeSentryDsn =
  typeof SENTRY_DSN === "string" &&
  /^https:\/\/.+@o\d+\.ingest\.[a-z0-9.-]+\.sentry\.io\/\d+$/i.test(SENTRY_DSN);
const SENTRY_DISABLED =
  import.meta.env.VITE_SENTRY_DISABLE === "true" ||
  !SENTRY_ENABLED ||
  !looksLikeSentryDsn ||
  !import.meta.env.PROD ||
  isLocalHost;
const API_URL = import.meta.env.VITE_API_URL;
const apiOrigin = API_URL?.replace(/\/+$/, "");
const tracePropagationTargets = [
  "localhost",
  apiOrigin ? new RegExp("^" + escapeRegExp(apiOrigin) + "/api") : /^https?:\/\/localhost:\d+\/api/,
];

// In local dev, Sentry tracing adds headers (`sentry-trace`, `baggage`) that can break
// API CORS configs. Also, replay can generate additional envelope traffic.
// We only enable these integrations in production.
const enableTracing = !!import.meta.env.PROD;
const enableReplay = !!import.meta.env.PROD;

if (SENTRY_DSN && !SENTRY_DISABLED) {
  Sentry.init({
    dsn: SENTRY_DSN,
    autoSessionTracking: enableTracing,
    sendDefaultPii: true,
    environment: import.meta.env.MODE || (import.meta.env.PROD ? "production" : "development"),
    release: "expograph-web",
    debug: false,
    integrations: [
      ...(enableReplay ? [Sentry.replayIntegration()] : []),
      ...(enableTracing ? [Sentry.browserTracingIntegration()] : []),
    ],
    // Tracing
    tracesSampleRate: enableTracing ? 1.0 : 0.0,
    tracePropagationTargets: enableTracing ? tracePropagationTargets : [],
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Enable logs to be sent to Sentry (avoid console noise in dev)
    enableLogs: !!import.meta.env.PROD,
  });
}

// Dev-only helper so you can verify Sentry from the browser console.
// Use a non-reserved name: Sentry itself uses `__SENTRY__` internally.
if (!import.meta.env.PROD) {
  window.__SENTRY_SDK__ = Sentry;
}

class GlobalErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error("[ErrorBoundary]", err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackUI
          title="Something went wrong"
          message="We hit a small bump. Try again-it usually works."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}

// Suppress harmless console errors from third-party services and browser extensions
const originalError = console.error;
console.error = (...args) => {
  const message = String(args[0] || '');
  // Sentry ingest 403: wrong DSN / project / org - browser still logs failed fetch; not actionable in-app
  const joined = args.map((a) => (typeof a === "string" ? a : "")).join(" ");
  if ((message.includes("ingest.sentry.io") || joined.includes("ingest.sentry.io")) && (message.includes("403") || joined.includes("403"))) {
    return;
  }
  // Suppress Cloudflare Stream analytics beacon errors
  if (message.includes('cloudflarestream.com') && (message.includes('beacon') || message.includes('404'))) {
    return;
  }
  // Suppress Cloudflare Dash errors (harmless reporting failures)
  if (message.includes('platform.dash.cloudflare.com')) {
    return;
  }
  // Suppress API connection refused (expected when API server is not running)
  if (message.includes('Cannot connect to API server') || message.includes('ERR_CONNECTION_REFUSED')) {
    return;
  }
  // Suppress Chrome extension messaging errors (e.g. "message channel closed before response")
  if ((message.includes('asynchronous response') && message.includes('message channel closed')) ||
      message.includes('message channel closed before a response was received') ||
      (message.includes('listener indicated') && message.includes('asynchronous response'))) {
    return;
  }
  originalError.apply(console, args);
};

// Suppress Spline 3D library internal logs (e.g. "updating from 115 to 121", "H0", "BV", etc.)
function isSplineNoise(args) {
  const full = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  if (full.includes('updating from')) return true;
  if (args.length === 1) {
    const a = String(args[0]).trim();
    if (['H0', 'BV', 'start', 'load', 't'].includes(a)) return true;
  }
  return false;
}
// Suppress React DevTools suggestion and Three.js multi-instance warning (dev-only noise)
function isNoise(args) {
  const full = args.map((a) => String(a ?? '')).join(' ');
  if (isSplineNoise(args)) return true;
  if (full.includes('Download the React DevTools') || full.includes('React DevTools')) return true;
  if (full.includes('Multiple instances of Three.js')) return true;
  return false;
}
const originalLog = console.log;
const originalInfo = console.info;
const originalDebug = console.debug;
const originalWarn = console.warn;
console.log = (...args) => { if (!isNoise(args)) originalLog.apply(console, args); };
console.info = (...args) => { if (!isNoise(args)) originalInfo.apply(console, args); };
console.debug = (...args) => { if (!isNoise(args)) originalDebug.apply(console, args); };
console.warn = (...args) => { if (!isNoise(args)) originalWarn.apply(console, args); };

// Suppress unhandled promise rejections from browser extensions (e.g. React DevTools, ad blockers)
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message ?? String(event.reason ?? '');
  if (msg.includes('Cannot connect to API server') || msg.includes('ERR_CONNECTION_REFUSED')) {
    event.preventDefault();
    return false;
  }
  if ((msg.includes('asynchronous response') && msg.includes('message channel closed')) ||
      msg.includes('message channel closed before a response was received') ||
      msg.includes('listener indicated') && msg.includes('asynchronous response')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <Sentry.ErrorBoundary
        fallback={({ error, resetError }) => (
          <ErrorFallbackUI
            title="Something went wrong"
            message={
              isChunkLoadError(error)
                ? chunkLoadUserMessage()
                : "We hit a small bump. Try again-it usually works."
            }
            onRetry={() => {
              if (isChunkLoadError(error)) {
                window.location.reload();
                return;
              }
              resetError();
            }}
          />
        )}
      >
        <App />
      </Sentry.ErrorBoundary>
    </GlobalErrorBoundary>
  </StrictMode>
);
