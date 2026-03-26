import "./configs/instrument.mjs";
import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controllers/clerk";
import * as Sentry from "@sentry/node";
import userRoutes from "./routes/userRoutes";
import projectRouter from "./routes/projectRoutes";

const app = express();

// Middleware
app.use(cors());

app.post(
  "/api/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhooks,
);

app.use(express.json());
app.use(clerkMiddleware());

app.get("/health", (_req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 5000;

app.get("/", (req: Request, res: Response) => {
  res.send("Server is Live!");
});
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});
app.use("/api/user", userRoutes);
app.use("/api/project", projectRouter);
// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
