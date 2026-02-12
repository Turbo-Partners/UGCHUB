import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Serve attached assets (videos, images, etc.)
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Stripe webhook needs raw body for signature verification
// Must be registered before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("[Express] Unhandled error:", err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const port = parseInt(process.env.APP_PORT || process.env.PORT || '5000', 10);

  // Listen FIRST, then setup Vite (Vite 7 needs the server already listening)
  server.listen(port, "0.0.0.0", async () => {
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    log(`serving on port ${port}`);
    
    // Start the metrics processor for gamification (runs every 15 minutes)
    const { startMetricsProcessor } = await import("./jobs/metricsProcessor");
    startMetricsProcessor(15);
    
    // Start the weekly email job (sends weekly reports every Monday at 9 AM)
    const { initWeeklyEmailJob } = await import("./jobs/weeklyEmailJob");
    initWeeklyEmailJob();
    
    // DISABLED: Apify sync job - use Apify Schedules instead for better cost control
    // To run manual sync: call runManualSync() from apifySyncJob.ts
    // const { initApifySyncJob } = await import("./jobs/apifySyncJob");
    // initApifySyncJob();
    
    // Start cleanup scheduler for notifications and integration_logs (runs every 24h)
    const { startCleanupScheduler } = await import("./services/cleanup");
    startCleanupScheduler();
    
    // Auto-enrichment: event-driven (on profile save) + daily catch-up for missed profiles
    const { startDailyCatchUpJob } = await import("./jobs/autoEnrichmentJob");
    startDailyCatchUpJob();

    // Company re-enrichment: weekly batch (Sundays 3 AM BRT)
    const { initCompanyEnrichmentJob } = await import("./jobs/companyEnrichmentJob");
    initCompanyEnrichmentJob();
  });
})();
