#!/usr/bin/env node

try {
  process.loadEnvFile();
} catch (e) {}

import { startGuiServer, defaultGuiPort } from "./gui.js";
import { logger } from "./logger.js";

logger.info("ClarityOS starting...", "Main");

if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  logger.warn(
    "GEMINI_API_KEY or GOOGLE_API_KEY not set — Profiler and Critic agents will fail. Set it in .env or environment.",
    "Main",
  );
}

if (!process.env.HUGGINGFACEHUB_API_TOKEN) {
  logger.warn(
    "HUGGINGFACEHUB_API_TOKEN not set — Paraphraser agent will fail. Set it in .env or environment.",
    "Main",
  );
}

const port = defaultGuiPort;
startGuiServer(port);

logger.info(`ClarityOS ready on port ${port}`, "Main");
