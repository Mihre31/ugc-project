import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://8e1896f0a684a294c635e54b8948e27c@o4510924422840320.ingest.de.sentry.io/4510924444074064",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
